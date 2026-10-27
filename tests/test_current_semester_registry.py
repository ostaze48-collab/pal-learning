from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.db.base import Base
from app.db.current_semester import (
    CURRENT_BOOK_CODE,
    CURRENT_PACKAGE_CODE,
    MINISTRY_G5_SCIENCE_URL,
    ensure_current_semester_registry,
)
from app.db.models import Book, CurriculumVersion, Grade, Lesson, SourceFile, SourcePackage, Subject, Unit


def test_current_semester_registry_creates_s1_and_reassigns_broad_s2_catalog_url():
    engine = create_engine('sqlite:///:memory:')
    Base.metadata.create_all(bind=engine)
    db = Session(engine)
    try:
        cv = CurriculumVersion(
            country='Palestine', academic_year='2026', edition='Latest Verified Edition', status='ACTIVE'
        )
        grade = Grade(code='G05', name_ar='الصف الخامس', order_no=5)
        subject = Subject(code='SCI', name_ar='العلوم والحياة', name_en='Science')
        db.add_all([cv, grade, subject]); db.flush()

        s2_book = Book(
            curriculum_version_id=cv.id,
            grade_id=grade.id,
            subject_id=subject.id,
            semester=2,
            title='العلوم والحياة — الصف الخامس — الفصل الثاني',
            book_code='PS.G05.SCI.S2',
            edition='prototype',
            status='DRAFT',
        )
        db.add(s2_book); db.flush()
        s2_package = SourcePackage(
            book_id=s2_book.id,
            package_code='PS-G05-SCI-S2-2026',
            status='DISCOVERED',
        )
        db.add(s2_package); db.flush()
        s2_source = SourceFile(
            package_id=s2_package.id,
            source_type='OFFICIAL_PACKAGE',
            source_url=MINISTRY_G5_SCIENCE_URL,
            reliability_score=100,
            edition_match_score=95,
            status='EXTRACTED',
        )
        db.add(s2_source); db.commit()

        result = ensure_current_semester_registry(db)
        assert result['ready'] is True
        assert result['semester'] == 1
        assert result['reassigned_s2_catalog_rows'] == 1

        s1_book = db.query(Book).filter(Book.book_code == CURRENT_BOOK_CODE).one()
        assert s1_book.semester == 1
        units = db.query(Unit).filter(Unit.book_id == s1_book.id).order_by(Unit.unit_number).all()
        assert [u.title for u in units] == ['الخلية', 'خصائص المادة', 'الطاقة في حياتنا']
        unit_ids = [u.id for u in units]
        lessons = db.query(Lesson).filter(Lesson.unit_id.in_(unit_ids)).all()
        assert len(lessons) == 8
        assert all(lesson.status == 'DRAFT' for lesson in lessons)

        s1_package = db.query(SourcePackage).filter(SourcePackage.package_code == CURRENT_PACKAGE_CODE).one()
        s1_source = db.query(SourceFile).filter(
            SourceFile.package_id == s1_package.id,
            SourceFile.source_url == MINISTRY_G5_SCIENCE_URL,
        ).one()
        assert s1_source.source_type == 'CATALOG_CANDIDATE'
        assert s1_source.edition_match_score == 0
        assert s1_source.reliability_score == 100

        db.refresh(s2_source)
        assert s2_source.source_type == 'CATALOG_CANDIDATE'
        assert s2_source.edition_match_score == 0
        assert s2_source.status == 'REASSIGNED_TO_CURRENT_SEMESTER_1'
    finally:
        db.close()
