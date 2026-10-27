from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db.deps import get_db
from ..auth.deps import require_admin
from ..db.models import (
    Grade, Subject, Book, Unit, Lesson, LessonSection, ContentBlock,
    SourcePackage, SourceFile, SourceChunk, AIJob, Question, QuestionSkill, Skill
)
from ..schemas.curriculum import SourcePackageCreate, SourceFileCreate, AIJobCreate

router = APIRouter(prefix='/curriculum', tags=['curriculum'])


@router.get('/grades')
def list_grades(db: Session = Depends(get_db)):
    rows = db.query(Grade).order_by(Grade.order_no).all()
    return [{'id': x.id, 'code': x.code, 'name_ar': x.name_ar} for x in rows]


@router.get('/subjects')
def list_subjects(db: Session = Depends(get_db)):
    rows = db.query(Subject).order_by(Subject.code).all()
    return [{'id': x.id, 'code': x.code, 'name_ar': x.name_ar, 'name_en': x.name_en} for x in rows]


@router.get('/books')
def list_books(db: Session = Depends(get_db)):
    rows = db.query(Book).order_by(Book.id).all()
    return [
        {
            'id': x.id, 'book_code': x.book_code, 'title': x.title,
            'semester': x.semester, 'status': x.status, 'edition': x.edition
        } for x in rows
    ]


@router.get('/books/{book_id}/units')
def list_units(book_id: int, db: Session = Depends(get_db)):
    rows = db.query(Unit).filter(Unit.book_id == book_id).order_by(Unit.order_no).all()
    return [{'id': x.id, 'unit_number': x.unit_number, 'title': x.title} for x in rows]


@router.get('/units/{unit_id}/lessons')
def list_lessons(unit_id: int, db: Session = Depends(get_db)):
    rows = db.query(Lesson).filter(Lesson.unit_id == unit_id).order_by(Lesson.lesson_number).all()
    return [
        {
            'id': x.id, 'lesson_code': x.lesson_code, 'lesson_number': x.lesson_number,
            'title': x.title, 'status': x.status, 'estimated_minutes': x.estimated_minutes
        } for x in rows
    ]


@router.get('/lessons/{lesson_id}')
def get_lesson(lesson_id: int, db: Session = Depends(get_db)):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(404, 'Lesson not found')
    sections = db.query(LessonSection).filter(LessonSection.lesson_id == lesson_id).order_by(LessonSection.order_no).all()
    data = []
    for section in sections:
        blocks = db.query(ContentBlock).filter(ContentBlock.lesson_section_id == section.id).order_by(ContentBlock.order_no).all()
        data.append({
            'id': section.id,
            'section_number': section.section_number,
            'title': section.title,
            'blocks': [
                {
                    'id': b.id, 'block_type': b.block_type,
                    'content': b.content_json, 'order_no': b.order_no,
                    'status': b.status
                } for b in blocks
            ]
        })
    return {
        'id': lesson.id, 'lesson_code': lesson.lesson_code, 'title': lesson.title,
        'status': lesson.status, 'estimated_minutes': lesson.estimated_minutes,
        'sections': data
    }


@router.get('/source-packages')
def list_source_packages(db: Session = Depends(get_db), admin=Depends(require_admin)):
    rows = db.query(SourcePackage).order_by(SourcePackage.id.desc()).all()
    return [
        {
            'id': x.id, 'book_id': x.book_id, 'package_code': x.package_code,
            'status': x.status, 'completeness_score': x.completeness_score,
            'quality_score': x.quality_score,
        } for x in rows
    ]


@router.get('/lessons/{lesson_id}/questions')
def lesson_questions(lesson_id: int, db: Session = Depends(get_db)):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(404, 'Lesson not found')
    questions = db.query(Question).filter(Question.lesson_id == lesson_id).order_by(Question.id).all()
    result = []
    for q in questions:
        links = db.query(QuestionSkill, Skill).join(Skill, Skill.id == QuestionSkill.skill_id).filter(QuestionSkill.question_id == q.id).all()
        result.append({
            'id': q.id, 'question_code': q.question_code, 'question_type': q.question_type,
            'prompt': q.prompt, 'options': q.options_json, 'difficulty': q.difficulty,
            'purpose': q.purpose, 'status': q.status,
            'skills': [{'id': skill.id, 'skill_code': skill.skill_code, 'name_ar': skill.name_ar} for _, skill in links],
        })
    return result


@router.post('/source-packages')
def create_source_package(payload: SourcePackageCreate, db: Session = Depends(get_db), admin=Depends(require_admin)):
    book = db.query(Book).filter(Book.id == payload.book_id).first()
    if not book:
        raise HTTPException(404, 'Book not found')
    existing = db.query(SourcePackage).filter(SourcePackage.package_code == payload.package_code).first()
    if existing:
        raise HTTPException(409, 'Package code already exists')
    row = SourcePackage(book_id=payload.book_id, package_code=payload.package_code)
    db.add(row); db.commit(); db.refresh(row)
    return {'id': row.id, 'package_code': row.package_code, 'status': row.status}


@router.post('/source-packages/{package_id}/files')
def add_source_file(package_id: int, payload: SourceFileCreate, db: Session = Depends(get_db), admin=Depends(require_admin)):
    package = db.query(SourcePackage).filter(SourcePackage.id == package_id).first()
    if not package:
        raise HTTPException(404, 'Package not found')
    row = SourceFile(package_id=package_id, **payload.model_dump())
    db.add(row); db.commit(); db.refresh(row)
    return {'id': row.id, 'source_type': row.source_type, 'status': row.status}


@router.get('/source-packages/{package_id}')
def get_source_package(package_id: int, db: Session = Depends(get_db), admin=Depends(require_admin)):
    package = db.query(SourcePackage).filter(SourcePackage.id == package_id).first()
    if not package:
        raise HTTPException(404, 'Package not found')
    files = db.query(SourceFile).filter(SourceFile.package_id == package_id).order_by(SourceFile.id).all()
    return {
        'id': package.id, 'package_code': package.package_code, 'status': package.status,
        'completeness_score': package.completeness_score, 'quality_score': package.quality_score,
        'files': [
            {
                'id': x.id, 'source_type': x.source_type, 'original_filename': x.original_filename,
                'source_url': x.source_url, 'reliability_score': x.reliability_score,
                'edition_match_score': x.edition_match_score, 'status': x.status,
                'page_count': x.page_count, 'checksum': x.checksum,
                'extraction_meta': x.extraction_meta,
                'chunk_count': db.query(SourceChunk).filter(SourceChunk.source_file_id == x.id).count(),
            } for x in files
        ]
    }


@router.post('/ai-jobs')
def create_ai_job(payload: AIJobCreate, db: Session = Depends(get_db), admin=Depends(require_admin)):
    row = AIJob(**payload.model_dump())
    db.add(row); db.commit(); db.refresh(row)
    return {'id': row.id, 'job_type': row.job_type, 'status': row.status, 'progress': row.progress}


@router.get('/ai-jobs')
def list_ai_jobs(db: Session = Depends(get_db), admin=Depends(require_admin)):
    rows = db.query(AIJob).order_by(AIJob.id.desc()).limit(50).all()
    return [
        {
            'id': x.id, 'job_type': x.job_type, 'status': x.status,
            'progress': x.progress, 'model_route': x.model_route,
            'source_type': x.source_type, 'source_id': x.source_id
        } for x in rows
    ]
