from __future__ import annotations

from sqlalchemy.orm import Session

from .models import Book, CurriculumVersion, Grade, Lesson, SourceFile, SourcePackage, Subject, Unit

CURRENT_BOOK_CODE = 'PS.G05.SCI.S1'
CURRENT_PACKAGE_CODE = 'PS-G05-SCI-S1-2026'
MINISTRY_G5_SCIENCE_URL = 'https://moe.edu.ps/m/4070'

SEMESTER1_STRUCTURE = [
    (1, 'الخلية', [
        (1, 'المجهر واكتشاف الخلية'),
        (2, 'الخلية وأنواعها'),
    ]),
    (2, 'خصائص المادة', [
        (1, 'أنواع المواد وخصائصها'),
        (2, 'طرائق فصل المواد'),
        (3, 'التغيرات الفيزيائية والكيميائية'),
    ]),
    (3, 'الطاقة في حياتنا', [
        (1, 'الطاقة وأشكالها'),
        (2, 'تحولات الطاقة'),
        (3, 'الطاقة والبيئة'),
    ]),
]


def ensure_current_semester_registry(db: Session) -> dict:
    """Idempotently register the current Grade 5 Science semester-1 production track.

    Semester 2 remains in the database as prototype/backlog material. The current
    Ministry Grade-5 Science Gaza package is associated with semester 1 because its
    indexed topics align with cell/materials/energy. It still starts as a
    CATALOG_CANDIDATE and must pass scope/edition verification before factual use.
    """
    cv = db.query(CurriculumVersion).filter(CurriculumVersion.academic_year == '2026').first()
    grade = db.query(Grade).filter(Grade.code == 'G05').first()
    subject = db.query(Subject).filter(Subject.code == 'SCI').first()
    if not cv or not grade or not subject:
        return {'ready': False, 'reason': 'base_curriculum_seed_missing'}

    book = db.query(Book).filter(Book.book_code == CURRENT_BOOK_CODE).first()
    created_book = False
    if not book:
        book = Book(
            curriculum_version_id=cv.id,
            grade_id=grade.id,
            subject_id=subject.id,
            semester=1,
            title='العلوم والحياة — الصف الخامس — الفصل الأول',
            book_code=CURRENT_BOOK_CODE,
            edition='current-semester-reference-to-verify',
            status='DRAFT',
        )
        db.add(book); db.flush()
        created_book = True

    created_units = 0
    created_lessons = 0
    for unit_number, unit_title, lessons in SEMESTER1_STRUCTURE:
        unit = db.query(Unit).filter(
            Unit.book_id == book.id,
            Unit.unit_number == unit_number,
        ).first()
        if not unit:
            unit = Unit(
                book_id=book.id,
                unit_number=unit_number,
                title=unit_title,
                order_no=unit_number,
            )
            db.add(unit); db.flush()
            created_units += 1
        else:
            unit.title = unit_title
            unit.order_no = unit_number

        for lesson_number, lesson_title in lessons:
            lesson_code = f'{CURRENT_BOOK_CODE}.U{unit_number:02d}.L{lesson_number:02d}'
            lesson = db.query(Lesson).filter(Lesson.lesson_code == lesson_code).first()
            if not lesson:
                lesson = Lesson(
                    unit_id=unit.id,
                    lesson_number=lesson_number,
                    lesson_code=lesson_code,
                    title=lesson_title,
                    status='DRAFT',
                    estimated_minutes=None,
                )
                db.add(lesson); db.flush()
                created_lessons += 1
            else:
                lesson.title = lesson_title
                lesson.status = 'DRAFT' if lesson.status != 'PUBLISHED' else lesson.status

    package = db.query(SourcePackage).filter(SourcePackage.package_code == CURRENT_PACKAGE_CODE).first()
    created_package = False
    if not package:
        package = SourcePackage(
            book_id=book.id,
            package_code=CURRENT_PACKAGE_CODE,
            status='DISCOVERED',
            completeness_score=0,
            quality_score=0,
        )
        db.add(package); db.flush()
        created_package = True

    source = db.query(SourceFile).filter(
        SourceFile.package_id == package.id,
        SourceFile.source_url == MINISTRY_G5_SCIENCE_URL,
    ).first()
    created_source = False
    if not source:
        source = SourceFile(
            package_id=package.id,
            source_type='CATALOG_CANDIDATE',
            source_url=MINISTRY_G5_SCIENCE_URL,
            original_filename='moe-current-grade5-science-learning-package-semester1-candidate',
            edition='CURRENT_GAZA_LEARNING_PACKAGE_EDITION_TO_VERIFY',
            reliability_score=100,
            edition_match_score=0,
            status='SCOPE_UNVERIFIED',
            extraction_meta={
                'catalog_scope': 'GRADE5_SCIENCE_CURRENT',
                'semester_priority': 1,
                'note': 'Current-semester candidate; factual use requires scope and edition verification.',
            },
        )
        db.add(source); db.flush()
        created_source = True
    else:
        source.source_type = 'CATALOG_CANDIDATE' if not source.extracted_text else source.source_type
        source.reliability_score = 100
        if not source.extracted_text:
            source.edition_match_score = 0
            source.status = 'SCOPE_UNVERIFIED'

    # The same broad Ministry catalog URL was previously attached to the S2 prototype.
    # Keep the historical row for auditability, but ensure it contributes no semester-2 authority.
    s2_package = db.query(SourcePackage).filter(SourcePackage.package_code == 'PS-G05-SCI-S2-2026').first()
    reassigned_s2_rows = 0
    if s2_package:
        for old_source in db.query(SourceFile).filter(
            SourceFile.package_id == s2_package.id,
            SourceFile.source_url == MINISTRY_G5_SCIENCE_URL,
        ).all():
            old_source.source_type = 'CATALOG_CANDIDATE'
            old_source.edition_match_score = 0
            old_source.status = 'REASSIGNED_TO_CURRENT_SEMESTER_1'
            meta = dict(old_source.extraction_meta or {})
            meta['semester_priority'] = 1
            meta['reassigned_to_package_code'] = CURRENT_PACKAGE_CODE
            old_source.extraction_meta = meta
            reassigned_s2_rows += 1

    db.commit()
    return {
        'ready': True,
        'book_id': book.id,
        'book_code': book.book_code,
        'package_id': package.id,
        'package_code': package.package_code,
        'created_book': created_book,
        'created_package': created_package,
        'created_source': created_source,
        'created_units': created_units,
        'created_lessons': created_lessons,
        'reassigned_s2_catalog_rows': reassigned_s2_rows,
        'semester': 1,
    }
