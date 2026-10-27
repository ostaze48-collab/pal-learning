from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth.deps import require_admin
from ..db.current_semester import CURRENT_BOOK_CODE, CURRENT_PACKAGE_CODE, MINISTRY_G5_SCIENCE_URL
from ..db.deps import get_db
from ..db.models import AIJob, Book, Lesson, LessonSkill, LessonSourceLink, SourceFile, SourcePackage, Unit
from ..factory.generation_readiness import calculate_generation_readiness

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


def _first_lesson(db: Session, book_id: int) -> Lesson | None:
    unit = db.query(Unit).filter(Unit.book_id == book_id).order_by(Unit.order_no, Unit.unit_number).first()
    if not unit:
        return None
    return db.query(Lesson).filter(Lesson.unit_id == unit.id).order_by(Lesson.lesson_number).first()


def _stage(key: str, label: str, status: str, *, detail: str, action: str | None = None) -> dict:
    return {
        'key': key,
        'label': label,
        'status': status,
        'detail': detail,
        'action': action,
    }


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
                {
                    'id': lesson.id,
                    'lesson_number': lesson.lesson_number,
                    'lesson_code': lesson.lesson_code,
                    'title': lesson.title,
                    'status': lesson.status,
                }
                for lesson in lessons
            ],
        })

    sources = db.query(SourceFile).filter(SourceFile.package_id == package.id).order_by(SourceFile.id).all()
    return {
        'semester': 1,
        'book': {
            'id': book.id,
            'book_code': book.book_code,
            'title': book.title,
            'status': book.status,
            'edition': book.edition,
        },
        'package': {
            'id': package.id,
            'package_code': package.package_code,
            'status': package.status,
            'source_count': len(sources),
        },
        'units': unit_payload,
        'sources': [
            {
                'id': source.id,
                'source_type': source.source_type,
                'source_url': source.source_url,
                'status': source.status,
                'reliability_score': source.reliability_score,
                'edition_match_score': source.edition_match_score,
            }
            for source in sources
        ],
        'backlog': {
            'semester_2_book_code': 'PS.G05.SCI.S2',
            'note': 'Semester 2 remains prototype/backlog and is not the current production priority.',
        },
    }


@router.get('/current-semester/pipeline')
def current_semester_pipeline(db: Session = Depends(get_db)):
    book, package = _registry(db)
    lesson = _first_lesson(db, book.id)
    source = _current_official_source(db, package.id)

    stages: list[dict] = []
    stages.append(_stage(
        'REGISTRY',
        'سجل الفصل الأول',
        'DONE',
        detail=f'{book.book_code} · {package.package_code}',
    ))

    if not source:
        stages.append(_stage(
            'SOURCE_FETCH', 'جلب المصدر الرسمي', 'BLOCKED',
            detail='مصدر الوزارة غير مسجل في الحزمة الحالية.', action='SYNC_OR_REGISTER_OFFICIAL_SOURCE',
        ))
        source_fetched = False
        scope_verified = False
    else:
        source_fetched = bool(source.extracted_text) and source.status in {'EXTRACTED', 'ANALYZED'}
        stages.append(_stage(
            'SOURCE_FETCH', 'جلب المصدر الرسمي', 'DONE' if source_fetched else 'READY',
            detail=(
                f'{source.page_count or 0} صفحة · {source.status}' if source_fetched
                else f'المصدر #{source.id} مسجل ويحتاج Fetch/Extraction.'
            ),
            action=None if source_fetched else 'FETCH_OFFICIAL_SOURCE',
        ))
        scope_verified = source.source_type == 'OFFICIAL_PACKAGE' and source_fetched

    stages.append(_stage(
        'SEMESTER_SCOPE',
        'تحقق نطاق الفصل الأول',
        'DONE' if scope_verified else ('READY' if source_fetched else 'BLOCKED'),
        detail=(
            'الخلية + خصائص المادة + الطاقة في حياتنا مؤكدة في النص المستخرج.'
            if scope_verified else
            'يجب إثبات مؤشرات وحدات الفصل الأول داخل المصدر المستخرج.'
        ),
        action=None if scope_verified else ('VERIFY_SEMESTER_SCOPE' if source_fetched else None),
    ))

    candidate_links = 0
    verified_links = 0
    linked_skills = 0
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
        latest_skill_job = db.query(AIJob).filter(
            AIJob.source_type == 'LESSON', AIJob.source_id == lesson.id, AIJob.job_type == 'EXTRACT_SKILLS'
        ).order_by(AIJob.id.desc()).first()
        latest_generation_job = db.query(AIJob).filter(
            AIJob.source_type == 'LESSON', AIJob.source_id == lesson.id, AIJob.job_type == 'GENERATE_LESSON'
        ).order_by(AIJob.id.desc()).first()

    link_done = candidate_links > 0 or verified_links > 0
    stages.append(_stage(
        'LESSON_LINKING',
        'ربط المصدر بالدرس',
        'DONE' if link_done else ('READY' if scope_verified else 'BLOCKED'),
        detail=(
            f'{candidate_links} مرشح + {verified_links} موثّق للدرس الأول.'
            if link_done else 'لم تُنشأ Lesson Source candidates بعد.'
        ),
        action=None if link_done else ('AUTO_LINK_LESSONS' if scope_verified else None),
    ))

    stages.append(_stage(
        'SOURCE_REVIEW',
        'مراجعة Source Chunks',
        'DONE' if verified_links > 0 else ('READY' if candidate_links > 0 else 'BLOCKED'),
        detail=(
            f'{verified_links} Teaching Source link موثّق إداريًا.'
            if verified_links > 0 else
            f'{candidate_links} رابط مرشح ينتظر Verify.' if candidate_links > 0 else
            'لا يوجد رابط مرشح يمكن مراجعته.'
        ),
        action=None if verified_links > 0 else ('REVIEW_SOURCE_LINKS' if candidate_links > 0 else None),
    ))

    skill_ready = linked_skills > 0
    stages.append(_stage(
        'SKILL_MAPPING',
        'استخراج واعتماد المهارات',
        'DONE' if skill_ready else ('READY' if verified_links > 0 else 'BLOCKED'),
        detail=(
            f'{linked_skills} مهارة مرتبطة بالدرس.' if skill_ready else
            f'آخر Skill Mapping Job: {latest_skill_job.status}' if latest_skill_job else
            'لا توجد مهارات معتمدة للدرس بعد.'
        ),
        action=None if skill_ready else ('OPEN_SKILL_MAPPING' if verified_links > 0 else None),
    ))

    if lesson:
        readiness = calculate_generation_readiness(db, lesson.id)
    generation_ready = bool(readiness and readiness['queue_ready'])
    generation_done = bool(latest_generation_job and latest_generation_job.status not in {'FAILED', 'OUTPUT_REJECTED'})
    stages.append(_stage(
        'LESSON_GENERATION',
        'توليد حزمة الدرس',
        'DONE' if generation_done else ('READY' if generation_ready else 'BLOCKED'),
        detail=(
            f'آخر Generation Job #{latest_generation_job.id}: {latest_generation_job.status}'
            if latest_generation_job else
            ('كل بوابات Queue جاهزة.' if generation_ready else ' · '.join((readiness or {}).get('blockers') or ['غير جاهز']))
        ),
        action=None if generation_done else ('QUEUE_GENERATION' if generation_ready else None),
    ))

    next_stage = next((stage for stage in stages if stage['status'] != 'DONE'), None)
    return {
        'semester': 1,
        'package_id': package.id,
        'package_code': package.package_code,
        'lesson': {
            'id': lesson.id,
            'lesson_code': lesson.lesson_code,
            'title': lesson.title,
        } if lesson else None,
        'source': {
            'id': source.id,
            'source_type': source.source_type,
            'status': source.status,
            'page_count': source.page_count,
            'edition_match_score': source.edition_match_score,
        } if source else None,
        'counts': {
            'candidate_source_links': candidate_links,
            'verified_source_links': verified_links,
            'linked_skills': linked_skills,
        },
        'stages': stages,
        'next_stage': next_stage,
        'generation_readiness': readiness,
        'latest_skill_mapping_job': {
            'id': latest_skill_job.id,
            'status': latest_skill_job.status,
        } if latest_skill_job else None,
        'latest_generation_job': {
            'id': latest_generation_job.id,
            'status': latest_generation_job.status,
        } if latest_generation_job else None,
    }
