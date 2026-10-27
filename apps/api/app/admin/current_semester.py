from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..auth.deps import require_admin
from ..db.current_semester import CURRENT_BOOK_CODE, CURRENT_PACKAGE_CODE, MINISTRY_G5_SCIENCE_URL
from ..db.deps import get_db
from ..db.models import AIJob, Book, Lesson, LessonSkill, LessonSourceLink, SourceFile, SourcePackage, Unit
from ..db.visual_models import VisualAsset
from ..factory.generation_readiness import calculate_generation_readiness
from ..services.object_storage import storage_configuration

router = APIRouter(prefix='/admin', tags=['admin-current-semester'], dependencies=[Depends(require_admin)])
CURRENT_CATALOG_SOURCE_CODE = 'PS.G05.SCI.GAZA.CURRENT.S1'


def _registry(db: Session):
    book = db.query(Book).filter(Book.book_code == CURRENT_BOOK_CODE).first()
    package = db.query(SourcePackage).filter(SourcePackage.package_code == CURRENT_PACKAGE_CODE).first()
    if not book or not package:
        raise HTTPException(503, 'Current semester registry is not initialized')
    return book, package


def _current_official_source(db: Session, package_id: int) -> SourceFile | None:
    rows = db.query(SourceFile).filter(SourceFile.package_id == package_id).order_by(SourceFile.id).all()
    for row in rows:
        meta = dict(row.extraction_meta or {})
        if (
            row.source_url == MINISTRY_G5_SCIENCE_URL
            or meta.get('registered_source_url') == MINISTRY_G5_SCIENCE_URL
            or meta.get('catalog_source_code') == CURRENT_CATALOG_SOURCE_CODE
        ):
            return row
    return None


def _pipeline_lesson(db: Session, book_id: int, lesson_id: int | None) -> Lesson | None:
    unit_ids = [row.id for row in db.query(Unit).filter(Unit.book_id == book_id).all()]
    if not unit_ids:
        return None
    query = db.query(Lesson).filter(Lesson.unit_id.in_(unit_ids))
    if lesson_id is not None:
        lesson = query.filter(Lesson.id == lesson_id).first()
        if not lesson:
            raise HTTPException(404, 'Selected lesson is not part of the current semester')
        return lesson
    return query.join(Unit, Unit.id == Lesson.unit_id).order_by(Unit.order_no, Unit.unit_number, Lesson.lesson_number).first()


def _stage(key: str, label: str, status: str, *, detail: str, action: str | None = None) -> dict:
    return {'key': key, 'label': label, 'status': status, 'detail': detail, 'action': action}


def _database_backend(db: Session) -> str:
    bind = db.get_bind()
    return bind.url.get_backend_name() if bind is not None else 'unknown'


def _source_is_durable(source: SourceFile | None) -> bool:
    if not source:
        return False
    meta = dict(source.extraction_meta or {})
    file_key = source.file_key or ''
    return bool(meta.get('durable_storage') or str(file_key).startswith('s3://'))


@router.get('/current-semester')
def current_semester(db: Session = Depends(get_db)):
    book, package = _registry(db)
    units = db.query(Unit).filter(Unit.book_id == book.id).order_by(Unit.order_no).all()
    unit_payload = []
    for unit in units:
        lessons = db.query(Lesson).filter(Lesson.unit_id == unit.id).order_by(Lesson.lesson_number).all()
        unit_payload.append({
            'id': unit.id,
            'unit_number': unit.unit_number,
            'title': unit.title,
            'lessons': [
                {'id': lesson.id, 'lesson_number': lesson.lesson_number, 'lesson_code': lesson.lesson_code,
                 'title': lesson.title, 'status': lesson.status}
                for lesson in lessons
            ],
        })

    sources = db.query(SourceFile).filter(SourceFile.package_id == package.id).order_by(SourceFile.id).all()
    return {
        'semester': 1,
        'book': {'id': book.id, 'book_code': book.book_code, 'title': book.title, 'status': book.status, 'edition': book.edition},
        'package': {'id': package.id, 'package_code': package.package_code, 'status': package.status, 'source_count': len(sources)},
        'units': unit_payload,
        'sources': [
            {'id': source.id, 'source_type': source.source_type, 'source_url': source.source_url,
             'status': source.status, 'reliability_score': source.reliability_score,
             'edition_match_score': source.edition_match_score}
            for source in sources
        ],
        'backlog': {
            'semester_2_book_code': 'PS.G05.SCI.S2',
            'note': 'Semester 2 remains prototype/backlog and is not the current production priority.',
        },
    }


@router.get('/current-semester/pipeline')
def current_semester_pipeline(
    db: Session = Depends(get_db),
    lesson_id: int | None = Query(default=None, ge=1),
):
    book, package = _registry(db)
    selected_lesson_id = lesson_id if isinstance(lesson_id, int) else None
    lesson = _pipeline_lesson(db, book.id, selected_lesson_id)
    source = _current_official_source(db, package.id)
    database_backend = _database_backend(db)
    production_database = database_backend in {'postgresql', 'postgres'}
    storage = storage_configuration()
    storage_ready = (not production_database) or (storage.durable and storage.configured)
    lesson_label = lesson.title if lesson else '—'

    stages: list[dict] = []
    stages.append(_stage('REGISTRY', 'سجل الفصل الأول', 'DONE', detail=f'{book.book_code} · {package.package_code} · {lesson_label}'))
    stages.append(_stage(
        'DURABLE_STORAGE', 'تخزين ملفات المنهاج', 'DONE' if storage_ready else 'BLOCKED',
        detail=(
            f'{storage.backend} · {storage.bucket or "development local storage"}' if storage_ready else
            'PostgreSQL production requires R2/S3 before importing factual PDFs. Missing: '
            + ', '.join(storage.missing or ('STORAGE_BACKEND=R2/S3',))
        ),
        action=None,
    ))

    if not source:
        stages.append(_stage(
            'SOURCE_FETCH', 'جلب المصدر الرسمي', 'BLOCKED',
            detail='مصدر الوزارة غير مسجل في الحزمة الحالية.',
            action='SYNC_OR_REGISTER_OFFICIAL_SOURCE' if storage_ready else None,
        ))
        source_ready = False
        scope_verified = False
    else:
        source_fetched = bool(source.extracted_text) and source.status in {'EXTRACTED', 'ANALYZED'}
        source_durable = _source_is_durable(source)
        source_ready = source_fetched and ((not production_database) or source_durable)
        fetch_status = 'DONE' if source_ready else ('READY' if storage_ready else 'BLOCKED')
        if source_fetched and production_database and not source_durable:
            fetch_detail = f'المصدر #{source.id} مستخرج لكنه غير محفوظ تخزينًا دائمًا؛ أعد جلبه بعد تهيئة R2/S3.'
        elif source_fetched:
            fetch_detail = f'{source.page_count or 0} صفحة · {source.status} · durable={source_durable if production_database else "dev"}'
        else:
            fetch_detail = f'المصدر #{source.id} مسجل ويحتاج Fetch/Extraction.'
        stages.append(_stage(
            'SOURCE_FETCH', 'جلب المصدر الرسمي', fetch_status,
            detail=fetch_detail,
            action=None if source_ready else ('FETCH_OFFICIAL_SOURCE' if storage_ready else None),
        ))
        scope_verified = source.source_type == 'OFFICIAL_PACKAGE' and source_ready

    stages.append(_stage(
        'SEMESTER_SCOPE', 'تحقق نطاق الفصل الأول',
        'DONE' if scope_verified else ('READY' if source_ready else 'BLOCKED'),
        detail=(
            'الخلية + خصائص المادة + الطاقة في حياتنا مؤكدة في النص المستخرج.'
            if scope_verified else 'يجب إثبات مؤشرات وحدات الفصل الأول داخل المصدر المستخرج والدائم.'
        ),
        action=None if scope_verified else ('VERIFY_SEMESTER_SCOPE' if source_ready else None),
    ))

    candidate_links = 0
    verified_links = 0
    linked_skills = 0
    visual_assets = 0
    visual_pending = 0
    visual_cleared = 0
    visual_redraw = 0
    latest_skill_job = None
    latest_generation_job = None
    readiness = None
    if lesson:
        candidate_links = db.query(LessonSourceLink).filter(
            LessonSourceLink.lesson_id == lesson.id,
            LessonSourceLink.relation == 'TEACHING_SOURCE',
            LessonSourceLink.status.in_(['CANDIDATE', 'VERIFIED_CANDIDATE']),
        ).count()
        verified_links = db.query(LessonSourceLink).filter(
            LessonSourceLink.lesson_id == lesson.id,
            LessonSourceLink.relation == 'TEACHING_SOURCE',
            LessonSourceLink.status == 'VERIFIED',
        ).count()
        linked_skills = db.query(LessonSkill).filter(LessonSkill.lesson_id == lesson.id).count()
        visual_query = db.query(VisualAsset).filter(VisualAsset.lesson_id == lesson.id)
        visual_assets = visual_query.count()
        visual_pending = visual_query.filter(VisualAsset.rights_status == 'REVIEW_REQUIRED').count()
        visual_cleared = visual_query.filter(
            VisualAsset.rights_status == 'CLEARED', VisualAsset.status == 'APPROVED'
        ).count()
        visual_redraw = visual_query.filter(VisualAsset.rights_status == 'REDRAW_REQUIRED').count()
        latest_skill_job = db.query(AIJob).filter(
            AIJob.source_type == 'LESSON', AIJob.source_id == lesson.id, AIJob.job_type == 'EXTRACT_SKILLS'
        ).order_by(AIJob.id.desc()).first()
        latest_generation_job = db.query(AIJob).filter(
            AIJob.source_type == 'LESSON', AIJob.source_id == lesson.id, AIJob.job_type == 'GENERATE_LESSON'
        ).order_by(AIJob.id.desc()).first()

    link_done = candidate_links > 0 or verified_links > 0
    stages.append(_stage(
        'LESSON_LINKING', 'ربط المصدر بالدرس',
        'DONE' if link_done else ('READY' if scope_verified else 'BLOCKED'),
        detail=(f'{candidate_links} مرشح + {verified_links} موثّق للدرس «{lesson_label}».' if link_done else f'لم تُنشأ Source candidates للدرس «{lesson_label}» بعد.'),
        action=None if link_done else ('AUTO_LINK_LESSONS' if scope_verified else None),
    ))
    stages.append(_stage(
        'SOURCE_REVIEW', 'مراجعة Source Chunks',
        'DONE' if verified_links > 0 else ('READY' if candidate_links > 0 else 'BLOCKED'),
        detail=(
            f'{verified_links} Teaching Source link موثّق إداريًا.' if verified_links > 0 else
            f'{candidate_links} رابط مرشح ينتظر Verify.' if candidate_links > 0 else
            'لا يوجد رابط مرشح يمكن مراجعته.'
        ),
        action=None if verified_links > 0 else ('REVIEW_SOURCE_LINKS' if candidate_links > 0 else None),
    ))

    if verified_links <= 0:
        visual_stage = _stage(
            'VISUAL_ASSETS', 'صور الكتاب والمراجعة البصرية', 'BLOCKED',
            detail='اعتمد Source Chunk واحدًا على الأقل قبل استخراج صفحات الكتاب.',
        )
    elif visual_assets == 0:
        visual_stage = _stage(
            'VISUAL_ASSETS', 'صور الكتاب والمراجعة البصرية', 'READY',
            detail='لم تُستخرج صفحات الكتاب المرتبطة بالدرس بعد.',
            action='OPEN_VISUAL_ASSETS',
        )
    elif visual_pending > 0:
        visual_stage = _stage(
            'VISUAL_ASSETS', 'صور الكتاب والمراجعة البصرية', 'READY',
            detail=f'{visual_assets} أصل بصري · {visual_pending} ينتظر مراجعة الحقوق · {visual_cleared} CLEARED.',
            action='OPEN_VISUAL_ASSETS',
        )
    elif visual_cleared > 0:
        visual_stage = _stage(
            'VISUAL_ASSETS', 'صور الكتاب والمراجعة البصرية', 'DONE',
            detail=f'{visual_cleared} أصل بصري CLEARED وجاهز للدرس · {visual_redraw} يحتاج إعادة رسم.',
        )
    else:
        visual_stage = _stage(
            'VISUAL_ASSETS', 'صور الكتاب والمراجعة البصرية', 'READY',
            detail=f'تمت مراجعة {visual_assets} أصل، لكن لا يوجد أصل CLEARED بعد. REDRAW_REQUIRED={visual_redraw}.',
            action='OPEN_VISUAL_ASSETS',
        )
    stages.append(visual_stage)

    skill_ready = linked_skills > 0
    visual_review_passed = visual_stage['status'] == 'DONE'
    stages.append(_stage(
        'SKILL_MAPPING', 'استخراج واعتماد المهارات',
        'DONE' if skill_ready else ('READY' if verified_links > 0 and visual_review_passed else 'BLOCKED'),
        detail=(
            f'{linked_skills} مهارة مرتبطة بالدرس.' if skill_ready else
            f'آخر Skill Mapping Job: {latest_skill_job.status}' if latest_skill_job else
            'لا توجد مهارات معتمدة للدرس بعد.' if visual_review_passed else
            'أكمل مراجعة الأصول البصرية قبل Skill Mapping في المسار الإنتاجي.'
        ),
        action=None if skill_ready else ('OPEN_SKILL_MAPPING' if verified_links > 0 and visual_review_passed else None),
    ))

    if lesson:
        readiness = calculate_generation_readiness(db, lesson.id)
    generation_ready = bool(readiness and readiness['queue_ready']) and visual_review_passed
    generation_status = latest_generation_job.status if latest_generation_job else None

    if generation_status == 'OUTPUT_VALIDATED':
        generation_stage = _stage(
            'LESSON_GENERATION', 'توليد حزمة الدرس', 'DONE',
            detail=f'Generation Job #{latest_generation_job.id}: OUTPUT_VALIDATED · ContentCandidate جاهز لـQA.',
        )
    elif latest_generation_job:
        if generation_status == 'WAITING_PROVIDER':
            stage_status = 'BLOCKED'
            detail = f'Generation Job #{latest_generation_job.id}: WAITING_PROVIDER · يجب إعداد مزود AI حقيقي.'
        elif generation_status == 'COMPLETED':
            stage_status = 'READY'
            detail = f'Generation Job #{latest_generation_job.id}: COMPLETED · خرج المزود ينتظر Schema/Provenance validation.'
        elif generation_status in {'QUEUED', 'RUNNING'}:
            stage_status = 'READY'
            detail = f'Generation Job #{latest_generation_job.id}: {generation_status} · لم يصبح ContentCandidate بعد.'
        elif generation_status in {'FAILED', 'STALE_INPUT', 'OUTPUT_REJECTED', 'OUTPUT_SCHEMA_INVALID'}:
            stage_status = 'READY' if generation_ready else 'BLOCKED'
            detail = f'Generation Job #{latest_generation_job.id}: {generation_status} · يلزم الفحص/إعادة المحاولة.'
        else:
            stage_status = 'READY'
            detail = f'Generation Job #{latest_generation_job.id}: {generation_status}.'
        generation_stage = _stage(
            'LESSON_GENERATION', 'توليد حزمة الدرس', stage_status,
            detail=detail,
            action='OPEN_LESSON_GENERATION',
        )
    else:
        generation_stage = _stage(
            'LESSON_GENERATION', 'توليد حزمة الدرس', 'READY' if generation_ready else 'BLOCKED',
            detail=('كل بوابات Queue + Visual Review جاهزة.' if generation_ready else ' · '.join((readiness or {}).get('blockers') or ['غير جاهز بصريًا أو أكاديميًا'])),
            action='QUEUE_GENERATION' if generation_ready else None,
        )
    stages.append(generation_stage)

    next_stage = next((stage for stage in stages if stage['status'] != 'DONE'), None)
    return {
        'semester': 1,
        'package_id': package.id,
        'package_code': package.package_code,
        'database': {'backend': database_backend, 'production': production_database},
        'storage': {
            'backend': storage.backend, 'durable': storage.durable, 'configured': storage.configured,
            'bucket': storage.bucket, 'missing': list(storage.missing), 'required': production_database, 'ready': storage_ready,
        },
        'lesson': {'id': lesson.id, 'lesson_code': lesson.lesson_code, 'title': lesson.title} if lesson else None,
        'source': {
            'id': source.id, 'source_type': source.source_type, 'status': source.status,
            'page_count': source.page_count, 'edition_match_score': source.edition_match_score,
            'durable': _source_is_durable(source),
        } if source else None,
        'counts': {
            'candidate_source_links': candidate_links,
            'verified_source_links': verified_links,
            'linked_skills': linked_skills,
            'visual_assets': visual_assets,
            'visual_pending': visual_pending,
            'visual_cleared': visual_cleared,
            'visual_redraw': visual_redraw,
        },
        'stages': stages,
        'next_stage': next_stage,
        'generation_readiness': readiness,
        'latest_skill_mapping_job': {'id': latest_skill_job.id, 'status': latest_skill_job.status} if latest_skill_job else None,
        'latest_generation_job': {'id': latest_generation_job.id, 'status': latest_generation_job.status} if latest_generation_job else None,
    }
