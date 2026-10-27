from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth.deps import require_admin
from ..db.current_semester import CURRENT_BOOK_CODE, CURRENT_PACKAGE_CODE
from ..db.deps import get_db
from ..db.models import Book, Lesson, SourceFile, SourcePackage, Unit

router = APIRouter(prefix='/admin', tags=['admin-current-semester'], dependencies=[Depends(require_admin)])


@router.get('/current-semester')
def current_semester(db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.book_code == CURRENT_BOOK_CODE).first()
    package = db.query(SourcePackage).filter(SourcePackage.package_code == CURRENT_PACKAGE_CODE).first()
    if not book or not package:
        raise HTTPException(503, 'Current semester registry is not initialized')

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
