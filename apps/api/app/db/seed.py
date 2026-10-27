from datetime import datetime, timedelta, UTC
import os
from .base import Base, engine, SessionLocal
from ..services.security import hash_password
from .models import (
    Grade, Subject, CurriculumVersion, Book, Unit, Lesson, LessonSection,
    ContentBlock, SourcePackage, SourceFile, Skill, LessonSkill, SkillEdge,
    Question, QuestionSkill, ReferenceAnswer, StudentProfile, StudentSkillMastery,
    RemediationUnit, Misconception, User
)

SUBJECTS = [
    ('ARA', 'اللغة العربية', 'Arabic'), ('MATH', 'الرياضيات', 'Mathematics'),
    ('ENG', 'اللغة الإنجليزية', 'English'), ('SCI', 'العلوم والحياة', 'Science'),
    ('ISL', 'التربية الإسلامية', 'Islamic Education'),
    ('NLS', 'التربية الوطنية والحياتية', 'National & Life Education'),
    ('SOC', 'الدراسات الاجتماعية', 'Social Studies'),
    ('TECH', 'التكنولوجيا والبرمجة', 'Technology'),
    ('ARTPE', 'التربية الفنية والرياضية', 'Arts & PE'), ('FRE', 'اللغة الفرنسية', 'French')
]


def add_block(db, section_id: int, order_no: int, block_type: str, content: dict):
    # Seeded lesson material is prototype/staging material only. It must not be
    # student-visible until an audited release transaction is implemented.
    db.add(ContentBlock(
        lesson_section_id=section_id, block_type=block_type,
        content_json=content, order_no=order_no, version=1, status='DRAFT'
    ))


def seed_skeleton_lesson(db, lesson: Lesson):
    if db.query(LessonSection).filter_by(lesson_id=lesson.id).count():
        return
    structure = [
        (1, 'لماذا نحتاج إلى الهيكل؟', [
            ('TEXT', {'title': 'تخيل جسمك بلا عظام', 'body': 'يساعد الجهاز الهيكلي الجسم على الدعامة والحماية والحركة. فالعظام تعطي الجسم شكله وتعمل مع العضلات على الحركة.'}),
            ('INFO_CARD', {'label': 'فكرة أساسية', 'body': 'الجهاز الهيكلي مجموعة من العظام المترابطة التي تكوّن هيكل جسم الإنسان.'}),
        ]),
        (2, 'وظائف الجهاز الهيكلي', [
            ('TEXT', {'title': 'ثلاث وظائف رئيسية', 'body': 'يساعد الجهاز الهيكلي على دعم الجسم، حماية أعضاء مهمة، والمساعدة على الحركة بالتعاون مع العضلات.'}),
            ('MATCHING', {'prompt': 'طابق الجزء العظمي مع العضو الذي يساعد على حمايته', 'pairs': [['الجمجمة', 'الدماغ'], ['القفص الصدري', 'القلب والرئتان'], ['العمود الفقري', 'الحبل الشوكي']]}),
        ]),
        (3, 'أشكال العظام', [
            ('TEXT', {'title': 'العظام ليست متشابهة', 'body': 'تختلف العظام في الشكل والحجم بما يناسب وظائفها. من أمثلتها العظام الطويلة والمسطحة والقصيرة.'}),
            ('DRAG_DROP', {'prompt': 'صنّف الأمثلة حسب شكل العظم', 'items': ['عظمة الفخذ', 'بعض عظام الجمجمة', 'بعض عظام اليد والقدم'], 'targets': ['طويلة', 'مسطحة', 'قصيرة']}),
        ]),
        (4, 'الهيكل المحوري والطرفي', [
            ('TEXT', {'title': 'قسمان رئيسيان', 'body': 'يشمل الهيكل المحوري الأجزاء المركزية مثل الجمجمة والعمود الفقري والقفص الصدري، بينما يشمل الهيكل الطرفي الأطراف ومناطق اتصالها بالجسم.'}),
        ]),
        (5, 'المفاصل', [
            ('TEXT', {'title': 'أماكن اتصال العظام', 'body': 'المفصل منطقة اتصال عظمتين أو أكثر. وتختلف المفاصل في مقدار واتجاه الحركة التي تسمح بها.'}),
        ]),
        (6, 'صحة العظام', [
            ('TEXT', {'title': 'حافظ على عظامك', 'body': 'يساعد الغذاء المتوازن والنشاط البدني المناسب وفيتامين D والكالسيوم ضمن التغذية الصحية على دعم صحة العظام.'}),
            ('SUMMARY', {'items': ['الجهاز الهيكلي يدعم الجسم ويحمي أعضاءه ويساعد على الحركة.', 'الهيكل محوري وطرفي.', 'المفاصل تربط العظام وتسمح بدرجات مختلفة من الحركة.']}),
        ]),
    ]
    for section_number, title, blocks in structure:
        section = LessonSection(lesson_id=lesson.id, section_number=section_number, title=title, order_no=section_number)
        db.add(section); db.flush()
        for order_no, (block_type, content) in enumerate(blocks, start=1):
            add_block(db, section.id, order_no, block_type, content)


def get_or_create_skill(db, subject_id, code, domain, name, threshold=0.8, description=None):
    row = db.query(Skill).filter_by(skill_code=code).first()
    if not row:
        row = Skill(
            subject_id=subject_id, skill_code=code, domain=domain, name_ar=name,
            mastery_threshold=threshold, description=description, status='ACTIVE'
        )
        db.add(row); db.flush()
    return row


def seed_skill_graph(db, sci_subject, math_subject, skeleton_lesson):
    support = get_or_create_skill(db, sci_subject.id, 'SK.SCI.HUMAN_BODY.SKELETON.SUPPORT', 'HUMAN_BODY', 'يفسر دور الجهاز الهيكلي في دعامة الجسم')
    protection = get_or_create_skill(db, sci_subject.id, 'SK.SCI.HUMAN_BODY.SKELETON.PROTECTION', 'HUMAN_BODY', 'يربط أجزاء من الهيكل بالأعضاء التي تساعد على حمايتها')
    axial = get_or_create_skill(db, sci_subject.id, 'SK.SCI.HUMAN_BODY.SKELETON.AXIAL_APPENDICULAR', 'HUMAN_BODY', 'يميز بين الهيكل المحوري والطرفي')
    for skill in (support, protection, axial):
        if not db.query(LessonSkill).filter_by(lesson_id=skeleton_lesson.id, skill_id=skill.id, relationship='TEACHES').first():
            db.add(LessonSkill(lesson_id=skeleton_lesson.id, skill_id=skill.id, relationship='TEACHES'))

    fraction_concept = get_or_create_skill(db, math_subject.id, 'SK.MATH.FRACTION.CONCEPT', 'FRACTIONS', 'يفهم معنى الكسر وأجزائه', 0.7)
    equivalence = get_or_create_skill(db, math_subject.id, 'SK.MATH.FRACTION.EQUIVALENCE', 'FRACTIONS', 'يتعرف إلى الكسور المتكافئة وينتجها', 0.7)
    common_den = get_or_create_skill(db, math_subject.id, 'SK.MATH.FRACTION.COMMON_DENOMINATOR', 'FRACTIONS', 'يوحد مقامات الكسور', 0.72)
    fraction_add = get_or_create_skill(db, math_subject.id, 'SK.MATH.FRACTION.ADDITION', 'FRACTIONS', 'يجمع الكسور ذات المقامات المختلفة', 0.75)
    chain = [(fraction_concept, equivalence), (equivalence, common_den), (common_den, fraction_add)]
    for source, target in chain:
        if not db.query(SkillEdge).filter_by(from_skill_id=source.id, to_skill_id=target.id, relationship='PREREQUISITE').first():
            db.add(SkillEdge(
                from_skill_id=source.id, to_skill_id=target.id,
                relationship='PREREQUISITE', confidence=0.95, source_type='SEED_DEMO', status='ACTIVE'
            ))

    misconception = db.query(Misconception).filter_by(code='MIS.MATH.FRACTION.ADD_DENOMINATORS').first()
    if not misconception:
        db.add(Misconception(
            skill_id=fraction_add.id, code='MIS.MATH.FRACTION.ADD_DENOMINATORS',
            title='جمع المقامات مباشرة',
            description='يجمع الطالب البسطين والمقامين بدل توحيد المقام.',
            remediation_hint='استخدم تمثيلًا بصريًا ثم ارجع إلى الكسور المتكافئة وتوحيد المقامات.'
        ))

    if not db.query(RemediationUnit).filter_by(skill_id=equivalence.id).first():
        db.add(RemediationUnit(
            skill_id=equivalence.id,
            title='مراجعة سريعة: الكسور المتكافئة',
            estimated_minutes=7,
            status='PUBLISHED',
            content_json={
                'student_label': 'مراجعة سريعة قبل المتابعة — 7 دقائق',
                'blocks': [
                    {'type': 'EXPLAIN', 'body': 'يمكن أن يكون لكسرين شكلان مختلفان لكنهما يمثلان الكمية نفسها.'},
                    {'type': 'VISUAL', 'body': 'قارن 1/2 مع 2/4 على شريطين متساويين.'},
                    {'type': 'GUIDED', 'prompt': 'اضرب البسط والمقام في العدد نفسه لإنتاج كسر مكافئ.'},
                    {'type': 'CHECK', 'items': ['هل 1/2 = 2/4؟', 'أكمل: 3/5 = ؟/10']},
                ]
            }
        ))
    return {'science': (support, protection, axial), 'math': (fraction_concept, equivalence, common_den, fraction_add)}


def seed_questions(db, skeleton_lesson, science_skills):
    support, protection, axial = science_skills
    questions = [
        ('PS.G05.SCI.S2.U04.L01.Q001', 'ما الجزء الذي يعطي جسم الإنسان دعامة أساسية؟', ['الجلد', 'العظام', 'الشعر', 'الدم'], 1, support, 'العظام تكوّن الجهاز الهيكلي وتمنح الجسم الدعامة والشكل.'),
        ('PS.G05.SCI.S2.U04.L01.Q002', 'ما العضو الذي تساعد الجمجمة على حمايته؟', ['القلب', 'الدماغ', 'الرئتان', 'المعدة'], 1, protection, 'الجمجمة تحيط بالدماغ وتساعد على حمايته.'),
        ('PS.G05.SCI.S2.U04.L01.Q003', 'إلى أي قسم تنتمي الجمجمة؟', ['الهيكل المحوري', 'الهيكل الطرفي'], 0, axial, 'الجمجمة جزء من الهيكل المحوري.'),
    ]
    for code, prompt, options, correct, skill, explanation in questions:
        q = db.query(Question).filter_by(question_code=code).first()
        if not q:
            q = Question(
                lesson_id=skeleton_lesson.id, question_code=code, question_type='MCQ',
                prompt=prompt, options_json=options, correct_answer_json={'value': correct},
                difficulty=0.45, purpose='PRACTICE', explanation=explanation, status='DRAFT'
            )
            db.add(q); db.flush()
        if not db.query(QuestionSkill).filter_by(question_id=q.id, skill_id=skill.id).first():
            db.add(QuestionSkill(question_id=q.id, skill_id=skill.id, weight=1.0))


def run():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if not db.query(Grade).count():
            grade_names = ['الأول','الثاني','الثالث','الرابع','الخامس','السادس','السابع','الثامن','التاسع']
            db.add_all([Grade(code=f'G{i:02d}', name_ar=f'الصف {grade_names[i-1]}', order_no=i) for i in range(1, 10)])
        if not db.query(Subject).count():
            db.add_all([Subject(code=c, name_ar=a, name_en=e) for c, a, e in SUBJECTS])
        db.commit()

        admin_email = os.getenv('BOOTSTRAP_ADMIN_EMAIL')
        admin_password = os.getenv('BOOTSTRAP_ADMIN_PASSWORD')
        if admin_email and admin_password and not db.query(User).filter(User.email == admin_email.lower()).first():
            db.add(User(
                email=admin_email.lower(), password_hash=hash_password(admin_password),
                role='ADMIN', status='ACTIVE'
            ))
            db.commit()

        cv = db.query(CurriculumVersion).filter_by(academic_year='2026').first()
        if not cv:
            cv = CurriculumVersion(
                country='Palestine', academic_year='2026', edition='Latest Verified Edition',
                status='ACTIVE', source_name='Palestinian Curriculum',
                notes='Edition must be verified from source-package metadata before production publication.'
            )
            db.add(cv); db.commit(); db.refresh(cv)

        g5 = db.query(Grade).filter_by(code='G05').one()
        g7 = db.query(Grade).filter_by(code='G07').one()
        sci = db.query(Subject).filter_by(code='SCI').one()
        math = db.query(Subject).filter_by(code='MATH').one()
        book = db.query(Book).filter_by(book_code='PS.G05.SCI.S2').first()
        if not book:
            book = Book(
                curriculum_version_id=cv.id, grade_id=g5.id, subject_id=sci.id, semester=2,
                title='العلوم والحياة — الصف الخامس — الفصل الثاني',
                book_code='PS.G05.SCI.S2', edition='2026/latest-to-verify', status='DRAFT'
            )
            db.add(book); db.commit(); db.refresh(book)

        unit = db.query(Unit).filter_by(book_id=book.id, unit_number=4).first()
        if not unit:
            unit = Unit(book_id=book.id, unit_number=4, title='أجهزة جسم الإنسان والجلد', order_no=1)
            db.add(unit); db.commit(); db.refresh(unit)

        lessons = {}
        for n, title in [(1, 'الجهاز الهيكلي'), (2, 'الجهاز العضلي'), (3, 'الجلد')]:
            code = f'PS.G05.SCI.S2.U04.L{n:02d}'
            row = db.query(Lesson).filter_by(lesson_code=code).first()
            if not row:
                row = Lesson(
                    unit_id=unit.id, lesson_number=n, lesson_code=code, title=title,
                    status='DRAFT', estimated_minutes=45 if n == 1 else None
                )
                db.add(row); db.commit(); db.refresh(row)
            lessons[n] = row
        seed_skeleton_lesson(db, lessons[1])

        package = db.query(SourcePackage).filter_by(package_code='PS-G05-SCI-S2-2026').first()
        if not package:
            package = SourcePackage(
                book_id=book.id, package_code='PS-G05-SCI-S2-2026',
                status='DISCOVERED', completeness_score=0, quality_score=0
            )
            db.add(package); db.commit(); db.refresh(package)

        # Ministry catalog discovery proves grade/subject authority only. Fresh
        # databases therefore start as CATALOG_CANDIDATE; scope verification may
        # later promote this exact row to OFFICIAL_PACKAGE.
        ministry_url = 'https://moe.edu.ps/m/4070'
        official_package = db.query(SourceFile).filter_by(
            package_id=package.id, source_url=ministry_url
        ).first()
        if not official_package:
            official_package = SourceFile(
                package_id=package.id, source_type='CATALOG_CANDIDATE',
                source_url=ministry_url,
                original_filename='moe-current-grade5-science-learning-package',
                edition='CURRENT_GAZA_LEARNING_PACKAGE_EDITION_TO_VERIFY',
                reliability_score=100, edition_match_score=0, status='SCOPE_UNVERIFIED'
            )
            db.add(official_package); db.flush()
        elif not official_package.extracted_text:
            official_package.source_type = 'CATALOG_CANDIDATE'
            official_package.status = 'SCOPE_UNVERIFIED'
            official_package.edition_match_score = 0
        official_package.reliability_score = 100

        # Historical full student book remains only a structure/reference fallback.
        source_file = db.query(SourceFile).filter_by(package_id=package.id, source_type='STUDENT_BOOK').first()
        if not source_file:
            source_file = SourceFile(
                package_id=package.id, source_type='STUDENT_BOOK',
                source_url='https://download.sh-pal.com/2021/02/2020-2021_78.html?m=1',
                original_filename='historical-reference-link-not-2026-verified', edition='2020-2021 reference',
                reliability_score=75, edition_match_score=0, status='DISCOVERED'
            )
            db.add(source_file); db.flush()

        solutions_file = db.query(SourceFile).filter_by(package_id=package.id, source_type='SOLUTIONS').first()
        if not solutions_file:
            solutions_file = SourceFile(
                package_id=package.id, source_type='SOLUTIONS',
                source_url='https://www.sh-pal.com/2018/01/blog-post_675.html',
                original_filename='science-grade5-sem2-model-answers-reference',
                edition='edition-not-yet-matched-to-current-package',
                reliability_score=85, edition_match_score=0, status='DISCOVERED'
            )
            db.add(solutions_file); db.flush()

        # Historical supporting sources: useful for pedagogy/recovery/assessment,
        # but never counted as current-edition evidence until their files are
        # imported and matched against the target curriculum.
        supporting_sources = [
            (
                'TEACHER_GUIDE',
                'https://www.sh-pal.com/2019/06/blog-post_41.html',
                'grade5-science-teacher-guide-2019',
                '2019 historical teacher guide',
                90,
            ),
            (
                'REMEDIAL',
                'https://www.sh-pal.com/2019/03/blog-post_41.html',
                'grade5-science-remedial-cards-2019',
                '2019 historical remedial cards',
                75,
            ),
            (
                'WORKSHEET',
                'https://www.sh-pal.com/2022/04/2022_53.html',
                'grade5-science-final-review-cards-2022',
                '2022 historical review worksheets',
                80,
            ),
        ]
        for source_type, source_url, filename, edition, reliability in supporting_sources:
            existing_support = db.query(SourceFile).filter_by(
                package_id=package.id, source_type=source_type, source_url=source_url
            ).first()
            if not existing_support:
                db.add(SourceFile(
                    package_id=package.id, source_type=source_type,
                    source_url=source_url, original_filename=filename,
                    edition=edition, reliability_score=reliability,
                    edition_match_score=0, status='DISCOVERED'
                ))
        db.flush()

        skill_sets = seed_skill_graph(db, sci, math, lessons[1])
        # Reference answers are deliberately not seeded. They are created only
        # after a policy-authorized SOLUTIONS source is parsed and aligned.
        seed_questions(db, lessons[1], skill_sets['science'])

        student = db.query(StudentProfile).filter_by(display_name='أحمد — حساب تجريبي').first()
        if not student:
            student = StudentProfile(display_name='أحمد — حساب تجريبي', registered_grade_id=g7.id)
            db.add(student); db.flush()
        demo_student_email = os.getenv('BOOTSTRAP_DEMO_STUDENT_EMAIL')
        demo_student_password = os.getenv('BOOTSTRAP_DEMO_STUDENT_PASSWORD')
        if demo_student_email and demo_student_password:
            demo_user = db.query(User).filter(User.email == demo_student_email.lower()).first()
            if not demo_user:
                demo_user = User(
                    email=demo_student_email.lower(),
                    password_hash=hash_password(demo_student_password),
                    role='STUDENT', status='ACTIVE'
                )
                db.add(demo_user); db.flush()
            if student.user_id is None:
                student.user_id = demo_user.id
        fraction_concept, equivalence, common_den, fraction_add = skill_sets['math']
        demo_mastery = [
            (fraction_concept, 0.82, 0.75, 'STABLE', 6),
            (equivalence, 0.30, 0.65, 'NEEDS_SUPPORT', 5),
            (common_den, 0.20, 0.45, 'NEEDS_SUPPORT', 3),
            (fraction_add, 0.28, 0.35, 'NEEDS_SUPPORT', 2),
        ]
        for skill, score, conf, status, evidence in demo_mastery:
            row = db.query(StudentSkillMastery).filter_by(student_id=student.id, skill_id=skill.id).first()
            if not row:
                next_retention = None
                if status == 'STABLE':
                    next_retention = datetime.now(UTC).replace(tzinfo=None) - timedelta(days=1)
                db.add(StudentSkillMastery(
                    student_id=student.id, skill_id=skill.id, mastery_score=score,
                    confidence=conf, status=status, evidence_count=evidence,
                    next_retention_at=next_retention
                ))
        db.commit()
    finally:
        db.close()


if __name__ == '__main__':
    run()
