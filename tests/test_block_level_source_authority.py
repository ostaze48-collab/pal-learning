from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.db.base import Base
from app.db.models import (
    Book,
    ContentBlock,
    Lesson,
    LessonSection,
    SourceChunk,
    SourceFile,
    SourcePackage,
    Unit,
)
from app.qa.router import calculate_lesson_qa


def test_block_source_refs_from_curriculum_plan_do_not_count_as_factual_alignment():
    engine = create_engine('sqlite:///:memory:')
    Base.metadata.create_all(bind=engine)
    db = Session(engine)
    try:
        book = Book(
            curriculum_version_id=1,
            grade_id=5,
            subject_id=4,
            semester=2,
            title='العلوم والحياة — الصف الخامس — الفصل الثاني',
            book_code='PS.G05.SCI.S2.TEST.BLOCK.AUTH',
            edition='2026/latest-to-verify',
            status='DRAFT',
        )
        db.add(book); db.flush()
        package = SourcePackage(
            book_id=book.id,
            package_code='PS-G05-SCI-S2-TEST-BLOCK-AUTH',
            status='INGESTING',
        )
        db.add(package); db.flush()
        unit = Unit(book_id=book.id, unit_number=4, title='أجهزة جسم الإنسان والجلد', order_no=1)
        db.add(unit); db.flush()
        lesson = Lesson(
            unit_id=unit.id,
            lesson_number=1,
            lesson_code='PS.G05.SCI.S2.U04.L01.TEST.BLOCK.AUTH',
            title='الجهاز الهيكلي',
            status='DRAFT',
        )
        db.add(lesson); db.flush()
        section = LessonSection(lesson_id=lesson.id, section_number=1, title='مقدمة', order_no=1)
        db.add(section); db.flush()
        plan = SourceFile(
            package_id=package.id,
            source_type='CURRICULUM_PLAN',
            edition='2025/2026 emergency plan',
            reliability_score=100,
            edition_match_score=100,
            status='EXTRACTED',
            extracted_text='أجهزة جسم الإنسان والجلد — الجهاز الهيكلي',
        )
        db.add(plan); db.flush()
        chunk = SourceChunk(
            source_file_id=plan.id,
            chunk_index=0,
            page_number=1,
            text='أجهزة جسم الإنسان والجلد — الجهاز الهيكلي',
        )
        db.add(chunk); db.flush()
        db.add(ContentBlock(
            lesson_section_id=section.id,
            block_type='TEXT',
            content_json={'text': 'نص تجريبي'},
            order_no=1,
            status='DRAFT',
            source_refs=[chunk.id],
        ))
        db.commit()

        result = calculate_lesson_qa(db, lesson.id)
        assert result['details']['blocks_with_source_refs'] == 1
        assert result['details']['blocks_with_authorized_factual_source_refs'] == 0
        assert result['source_alignment_score'] == 25
    finally:
        db.close()
