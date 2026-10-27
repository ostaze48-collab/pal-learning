from __future__ import annotations

import os
from sqlalchemy.orm import Session

from .models import (
    Book, ContentBlock, Lesson, LessonSection, LessonSkill, Question,
    QuestionSkill, Skill, Subject, Unit,
)

DEMO_BOOK_CODE = 'PS.G05.SCI.S1'
DEMO_LESSON_CODE = 'PS.G05.SCI.S1.U01.L01'
DEMO_STATUS = 'BETA'


def demo_enabled() -> bool:
    return os.getenv('EXPERIMENTAL_DEMO', 'true').strip().lower() in {'1', 'true', 'yes', 'on'}


def is_demo_lesson(lesson: Lesson | None) -> bool:
    return bool(demo_enabled() and lesson and lesson.lesson_code == DEMO_LESSON_CODE)


SKILLS = [
    {
        'skill_code': 'SK.SCI.G05.MICROSCOPE.PURPOSE',
        'domain': 'CELL_DISCOVERY',
        'name_ar': 'يشرح وظيفة المجهر في دراسة الأشياء الدقيقة',
        'description': 'يربط بين حاجة العلماء إلى التكبير وقدرتهم على ملاحظة تراكيب لا تراها العين المجردة.',
        'mastery_threshold': 0.80,
        'importance': 1.0,
    },
    {
        'skill_code': 'SK.SCI.G05.CELL.DISCOVERY.HOOKE',
        'domain': 'CELL_DISCOVERY',
        'name_ar': 'يربط روبرت هوك بالمشاهدة الأولى للخلايا في الفلين',
        'description': 'يتعرف دور روبرت هوك في تاريخ اكتشاف الخلية باستخدام المجهر.',
        'mastery_threshold': 0.80,
        'importance': 1.0,
    },
    {
        'skill_code': 'SK.SCI.G05.CELL.DISCOVERY.TIMELINE',
        'domain': 'CELL_DISCOVERY',
        'name_ar': 'يرتب المحطات الأساسية في تطور فهم الخلية',
        'description': 'يميز إسهامات هوك وليفنهوك وبراون وشلايدن وشفان في تسلسل مبسط.',
        'mastery_threshold': 0.80,
        'importance': 0.9,
    },
    {
        'skill_code': 'SK.SCI.G05.CELL.CONCEPT.BASIC',
        'domain': 'CELL_DISCOVERY',
        'name_ar': 'يعرّف الخلية بوصفها وحدة بناء أساسية للكائنات الحية',
        'description': 'يتعرف المفهوم الأساسي للخلية في سياق اكتشافها ودراستها بالمجهر.',
        'mastery_threshold': 0.80,
        'importance': 1.0,
    },
]


BLOCKS = {
    1: [
        ('INFO_CARD', {
            'label': 'سؤال البداية',
            'title': 'كيف نرى ما لا تستطيع العين رؤيته؟',
            'body': 'توجد أشياء صغيرة جدًا لا نستطيع رؤية تفاصيلها بالعين المجردة. احتاج العلماء إلى أدوات تكبّر هذه الأشياء كي يدرسوها.',
            'icon': '🔎',
        }),
        ('TEXT', {
            'title': 'فكّر',
            'body': 'لو أردت فحص جزء دقيق جدًا من ورقة نبات أو قطرة ماء، فما الأداة التي ستساعدك؟',
        }),
    ],
    2: [
        ('INFO_CARD', {
            'label': 'الفكرة الأساسية',
            'title': 'المجهر',
            'body': 'المجهر جهاز يُستخدم لتكبير الأشياء الصغيرة الدقيقة، ويساعد على ملاحظة تفاصيل لا تظهر بوضوح للعين المجردة.',
            'icon': '🔬',
        }),
        ('TEXT', {
            'title': 'لماذا كان المجهر مهمًا؟',
            'body': 'لأن اكتشاف الخلية ودراسة الكائنات الدقيقة ارتبطا بتطور أدوات التكبير. كلما تحسنت قدرة المجهر، استطاع العلماء مشاهدة تفاصيل أكثر.',
        }),
    ],
    3: [
        ('TIMELINE', {
            'title': 'محطات في اكتشاف الخلية',
            'items': [
                {'year': '1665', 'name': 'روبرت هوك', 'text': 'فحص شريحة رقيقة من الفلين بالمجهر، وشاهد فراغات صغيرة متراصة أطلق عليها اسم الخلايا.'},
                {'year': '1674', 'name': 'أنطوني فان ليفنهوك', 'text': 'شاهد كائنات حية وحيدة الخلية باستخدام مجهر ذي قدرة تكبير أكبر.'},
                {'year': '1831', 'name': 'روبرت براون', 'text': 'وصف نواة الخلية النباتية.'},
                {'year': '1838', 'name': 'ماتياس شلايدن', 'text': 'استنتج أن النباتات تتكون من خلايا.'},
                {'year': '1839', 'name': 'ثيودور شفان', 'text': 'استنتج أن أجسام الحيوانات تتكون من خلايا.'},
            ],
        }),
    ],
    4: [
        ('MATCHING', {
            'title': 'جرّب المطابقة',
            'prompt': 'اربط العالم بإنجازه العلمي.',
            'pairs': [
                ['روبرت هوك', 'شاهد خلايا الفلين بالمجهر'],
                ['فان ليفنهوك', 'شاهد كائنات حية وحيدة الخلية'],
                ['روبرت براون', 'وصف نواة الخلية النباتية'],
            ],
        }),
        ('INFO_CARD', {
            'label': 'استنتاج',
            'title': 'الأداة تغيّر ما نستطيع معرفته',
            'body': 'تطور المجاهر لم يكن مجرد تحسين للأداة؛ بل سمح للعلماء باكتشاف تراكيب وكائنات لم تكن معروفة من قبل.',
            'icon': '💡',
        }),
    ],
    5: [
        ('TEXT', {
            'title': 'تحقق من فهمك',
            'body': 'أجب عن الأسئلة القصيرة أسفل الدرس. كل إجابة تُحفظ وتُستخدم لتحديث تقدمك في المهارات.',
        }),
    ],
    6: [
        ('INFO_CARD', {
            'label': 'اختبر نفسك',
            'title': 'هل تستطيع تفسير الفكرة؟',
            'body': 'إذا استطعت أن تشرح لماذا كان المجهر ضروريًا لاكتشاف الخلية، وأن تربط العلماء بأهم إنجازاتهم، فأنت قريب من إتقان الدرس.',
            'icon': '✅',
        }),
    ],
    7: [
        ('SUMMARY', {
            'title': 'ملخص الدرس',
            'items': [
                'المجهر يساعد على تكبير الأشياء الصغيرة الدقيقة.',
                'استخدم روبرت هوك المجهر لفحص الفلين وشاهد تراكيب أطلق عليها اسم الخلايا.',
                'أسهم تطور المجهر في مشاهدة كائنات وحيدة الخلية وتفاصيل داخل الخلايا.',
                'تراكمت اكتشافات العلماء تدريجيًا حتى أصبح فهم الخلية أكثر وضوحًا.',
            ],
        }),
    ],
}


QUESTIONS = [
    {
        'code': 'PS.G05.SCI.S1.U01.L01.BETA.Q01',
        'prompt': 'ما الوظيفة الأساسية للمجهر؟',
        'options': ['تكبير الأشياء الصغيرة الدقيقة', 'قياس درجة الحرارة', 'قياس كتلة الأجسام', 'فصل المخاليط'],
        'answer': 0,
        'explanation': 'المجهر يساعدنا على تكبير الأشياء الدقيقة ورؤية تفاصيل لا تظهر بوضوح للعين المجردة.',
        'skill_code': 'SK.SCI.G05.MICROSCOPE.PURPOSE',
        'difficulty': 0.25,
    },
    {
        'code': 'PS.G05.SCI.S1.U01.L01.BETA.Q02',
        'prompt': 'أي مادة فحصها روبرت هوك عندما شاهد تراكيب تشبه الحجرات الصغيرة؟',
        'options': ['الفلين', 'الحديد', 'الزجاج', 'الرمل'],
        'answer': 0,
        'explanation': 'فحص روبرت هوك شريحة رقيقة من الفلين بالمجهر.',
        'skill_code': 'SK.SCI.G05.CELL.DISCOVERY.HOOKE',
        'difficulty': 0.35,
    },
    {
        'code': 'PS.G05.SCI.S1.U01.L01.BETA.Q03',
        'prompt': 'من العالم الذي شاهد كائنات حية وحيدة الخلية باستخدام المجهر؟',
        'options': ['فان ليفنهوك', 'روبرت براون', 'ثيودور شفان', 'شلايدن'],
        'answer': 0,
        'explanation': 'ارتبط فان ليفنهوك بمشاهدة كائنات حية وحيدة الخلية باستخدام مجهر أكثر قدرة على التكبير.',
        'skill_code': 'SK.SCI.G05.CELL.DISCOVERY.TIMELINE',
        'difficulty': 0.45,
    },
    {
        'code': 'PS.G05.SCI.S1.U01.L01.BETA.Q04',
        'prompt': 'ماذا اكتشف روبرت براون في الخلية النباتية؟',
        'options': ['النواة', 'الجدار فقط', 'الكلوروفيل', 'الماء'],
        'answer': 0,
        'explanation': 'وصف روبرت براون نواة الخلية النباتية عام 1831.',
        'skill_code': 'SK.SCI.G05.CELL.DISCOVERY.TIMELINE',
        'difficulty': 0.50,
    },
    {
        'code': 'PS.G05.SCI.S1.U01.L01.BETA.Q05',
        'prompt': 'أي عبارة تلخص أهمية المجهر في قصة اكتشاف الخلية؟',
        'options': ['سمح برؤية تراكيب دقيقة لم تكن واضحة بالعين المجردة', 'ألغى الحاجة للملاحظة العلمية', 'استُخدم فقط لقياس الأطوال الكبيرة', 'لم يؤثر في دراسة الكائنات الحية'],
        'answer': 0,
        'explanation': 'المجهر وسّع قدرة العلماء على الملاحظة، فمكّنهم من رؤية تراكيب وكائنات دقيقة.',
        'skill_code': 'SK.SCI.G05.CELL.CONCEPT.BASIC',
        'difficulty': 0.55,
    },
]


def ensure_experimental_demo(db: Session) -> dict:
    """Create one complete BETA lesson without touching production publication state."""
    if not demo_enabled():
        return {'enabled': False}

    lesson = db.query(Lesson).filter(Lesson.lesson_code == DEMO_LESSON_CODE).first()
    if not lesson:
        return {'enabled': True, 'ready': False, 'reason': 'demo_lesson_missing'}

    unit = db.query(Unit).filter(Unit.id == lesson.unit_id).first()
    book = db.query(Book).filter(Book.id == unit.book_id).first() if unit else None
    subject = db.query(Subject).filter(Subject.id == book.subject_id).first() if book else None
    if not book or not subject:
        return {'enabled': True, 'ready': False, 'reason': 'demo_curriculum_missing'}

    # Only the first lesson is exposed in the experimental student experience.
    sibling_lessons = db.query(Lesson).filter(Lesson.unit_id == lesson.unit_id).all()
    for row in sibling_lessons:
        if row.id != lesson.id and row.status == DEMO_STATUS:
            row.status = 'DRAFT'
    lesson.status = DEMO_STATUS
    lesson.estimated_minutes = 20
    book.status = DEMO_STATUS

    sections = {
        row.section_number: row
        for row in db.query(LessonSection).filter(LessonSection.lesson_id == lesson.id).all()
    }
    for section_number, block_rows in BLOCKS.items():
        section = sections.get(section_number)
        if not section:
            continue
        for order_no, (block_type, content) in enumerate(block_rows, start=1):
            block = db.query(ContentBlock).filter(
                ContentBlock.lesson_section_id == section.id,
                ContentBlock.order_no == order_no,
            ).first()
            if not block:
                block = ContentBlock(
                    lesson_section_id=section.id,
                    block_type=block_type,
                    content_json=content,
                    order_no=order_no,
                    version=1,
                    status=DEMO_STATUS,
                    source_refs=[],
                )
                db.add(block)
            else:
                block.block_type = block_type
                block.content_json = content
                block.status = DEMO_STATUS
                block.version = max(block.version or 1, 1)

    skill_by_code: dict[str, Skill] = {}
    for payload in SKILLS:
        skill = db.query(Skill).filter(Skill.skill_code == payload['skill_code']).first()
        if not skill:
            skill = Skill(subject_id=subject.id, status=DEMO_STATUS, **payload)
            db.add(skill); db.flush()
        else:
            skill.domain = payload['domain']
            skill.name_ar = payload['name_ar']
            skill.description = payload['description']
            skill.mastery_threshold = payload['mastery_threshold']
            skill.importance = payload['importance']
            skill.status = DEMO_STATUS
        skill_by_code[payload['skill_code']] = skill
        link = db.query(LessonSkill).filter(
            LessonSkill.lesson_id == lesson.id,
            LessonSkill.skill_id == skill.id,
            LessonSkill.relationship == 'TEACHES',
        ).first()
        if not link:
            db.add(LessonSkill(lesson_id=lesson.id, skill_id=skill.id, relationship='TEACHES', weight=1.0))

    for index, payload in enumerate(QUESTIONS, start=1):
        question = db.query(Question).filter(Question.question_code == payload['code']).first()
        if not question:
            question = Question(
                lesson_id=lesson.id,
                question_code=payload['code'],
                question_type='MCQ',
                prompt=payload['prompt'],
                options_json=payload['options'],
                correct_answer_json=payload['answer'],
                difficulty=payload['difficulty'],
                purpose='PRACTICE' if index < len(QUESTIONS) else 'MASTERY',
                explanation=payload['explanation'],
                status=DEMO_STATUS,
            )
            db.add(question); db.flush()
        else:
            question.lesson_id = lesson.id
            question.prompt = payload['prompt']
            question.options_json = payload['options']
            question.correct_answer_json = payload['answer']
            question.difficulty = payload['difficulty']
            question.purpose = 'PRACTICE' if index < len(QUESTIONS) else 'MASTERY'
            question.explanation = payload['explanation']
            question.status = DEMO_STATUS

        skill = skill_by_code[payload['skill_code']]
        qlink = db.query(QuestionSkill).filter(
            QuestionSkill.question_id == question.id,
            QuestionSkill.skill_id == skill.id,
        ).first()
        if not qlink:
            db.add(QuestionSkill(question_id=question.id, skill_id=skill.id, weight=1.0))

    db.commit()
    return {
        'enabled': True,
        'ready': True,
        'book_code': DEMO_BOOK_CODE,
        'lesson_code': DEMO_LESSON_CODE,
        'lesson_id': lesson.id,
        'status': DEMO_STATUS,
        'skills': len(SKILLS),
        'questions': len(QUESTIONS),
        'sections': len(BLOCKS),
    }
