from __future__ import annotations

from datetime import datetime, timedelta, UTC
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..auth.deps import require_student_profile
from ..db.demo_experiment import DEMO_BOOK_CODE, DEMO_LESSON_CODE, DEMO_STATUS, demo_enabled
from ..db.deps import get_db
from ..db.models import (
    Book, ContentBlock, LearningEvent, Lesson, LessonSection, LessonSkill,
    Question, QuestionAttempt, QuestionSkill, Skill, StudentProfile,
    StudentSkillMastery, Unit,
)
from ..services.mastery import MasteryState, update_mastery

router = APIRouter(prefix='/demo', tags=['experimental-demo'])


class DemoAttempt(BaseModel):
    answer: int | str
    response_time_ms: int | None = None
    used_hint: bool = False
    used_ai_help: bool = False


class TutorRequest(BaseModel):
    action: str = 'explain_simple'
    question: str | None = None


def _require_demo() -> None:
    if not demo_enabled():
        raise HTTPException(404, 'Experimental demo is disabled')


def _demo_lesson(db: Session) -> tuple[Book, Unit, Lesson]:
    _require_demo()
    lesson = db.query(Lesson).filter(
        Lesson.lesson_code == DEMO_LESSON_CODE,
        Lesson.status == DEMO_STATUS,
    ).first()
    if not lesson:
        raise HTTPException(503, 'Experimental lesson is not ready')
    unit = db.query(Unit).filter(Unit.id == lesson.unit_id).first()
    book = db.query(Book).filter(Book.id == unit.book_id, Book.book_code == DEMO_BOOK_CODE).first() if unit else None
    if not unit or not book:
        raise HTTPException(503, 'Experimental curriculum is not ready')
    return book, unit, lesson


def _demo_skills(db: Session, lesson_id: int) -> list[Skill]:
    rows = db.query(LessonSkill, Skill).join(Skill, Skill.id == LessonSkill.skill_id).filter(
        LessonSkill.lesson_id == lesson_id,
        Skill.status == DEMO_STATUS,
    ).order_by(Skill.skill_code).all()
    return [skill for _, skill in rows]


def _mastery_rows(db: Session, profile: StudentProfile, lesson_id: int) -> list[dict]:
    skills = _demo_skills(db, lesson_id)
    result = []
    for skill in skills:
        mastery = db.query(StudentSkillMastery).filter(
            StudentSkillMastery.student_id == profile.id,
            StudentSkillMastery.skill_id == skill.id,
        ).first()
        result.append({
            'skill_id': skill.id,
            'skill_code': skill.skill_code,
            'name_ar': skill.name_ar,
            'domain': skill.domain,
            'mastery_threshold': skill.mastery_threshold,
            'mastery_score': mastery.mastery_score if mastery else 0.0,
            'confidence': mastery.confidence if mastery else 0.0,
            'status': mastery.status if mastery else 'NOT_ASSESSED',
            'evidence_count': mastery.evidence_count if mastery else 0,
        })
    return result


@router.get('/info')
def demo_info(db: Session = Depends(get_db)):
    book, unit, lesson = _demo_lesson(db)
    return {
        'experimental': True,
        'scope': 'single-lesson-beta',
        'grade': 5,
        'subject': 'العلوم والحياة',
        'semester': 1,
        'book': {'id': book.id, 'book_code': book.book_code, 'title': book.title},
        'unit': {'id': unit.id, 'unit_number': unit.unit_number, 'title': unit.title},
        'lesson': {'id': lesson.id, 'lesson_code': lesson.lesson_code, 'title': lesson.title, 'estimated_minutes': lesson.estimated_minutes},
        'notice': 'نسخة تجريبية مغلقة على الدرس الأول فقط؛ لا تمثل إصدارًا إنتاجيًا منشورًا.',
    }


@router.get('/home')
def demo_home(
    profile: StudentProfile = Depends(require_student_profile),
    db: Session = Depends(get_db),
):
    book, unit, lesson = _demo_lesson(db)
    mastery = _mastery_rows(db, profile, lesson.id)
    avg = round(sum(row['mastery_score'] for row in mastery) / len(mastery) * 100) if mastery else 0
    attempted = db.query(QuestionAttempt).join(Question, Question.id == QuestionAttempt.question_id).filter(
        QuestionAttempt.student_id == profile.id,
        Question.lesson_id == lesson.id,
    ).count()
    return {
        'experimental': True,
        'student': {'id': profile.id, 'display_name': profile.display_name},
        'course': {'grade': 5, 'subject': 'العلوم والحياة', 'semester': 1},
        'book': {'title': book.title, 'book_code': book.book_code},
        'unit': {'title': unit.title, 'unit_number': unit.unit_number},
        'lesson': {'id': lesson.id, 'title': lesson.title, 'lesson_code': lesson.lesson_code, 'estimated_minutes': lesson.estimated_minutes},
        'progress_percent': avg,
        'attempts': attempted,
        'skills_count': len(mastery),
        'plan': [
            {'type': 'LEARN', 'title': lesson.title, 'minutes': 12, 'href': '/student/lesson'},
            {'type': 'PRACTICE', 'title': 'تحقق من فهمك', 'minutes': 5, 'href': '/student/lesson#questions'},
            {'type': 'REVIEW', 'title': 'مراجعة ذكية', 'minutes': 3, 'href': '/student/recovery'},
        ],
    }


@router.get('/lesson')
def demo_lesson(
    profile: StudentProfile = Depends(require_student_profile),
    db: Session = Depends(get_db),
):
    book, unit, lesson = _demo_lesson(db)
    sections = db.query(LessonSection).filter(LessonSection.lesson_id == lesson.id).order_by(LessonSection.order_no).all()
    payload_sections = []
    for section in sections:
        blocks = db.query(ContentBlock).filter(
            ContentBlock.lesson_section_id == section.id,
            ContentBlock.status == DEMO_STATUS,
        ).order_by(ContentBlock.order_no).all()
        if not blocks:
            continue
        payload_sections.append({
            'id': section.id,
            'section_number': section.section_number,
            'title': section.title,
            'blocks': [
                {'id': b.id, 'block_type': b.block_type, 'content': b.content_json, 'order_no': b.order_no}
                for b in blocks
            ],
        })
    db.add(LearningEvent(
        event_uuid=str(uuid4()),
        student_id=profile.id,
        event_type='LESSON_STARTED',
        lesson_id=lesson.id,
        metadata_json={'experimental_demo': True},
    ))
    db.commit()
    return {
        'experimental': True,
        'book': {'id': book.id, 'title': book.title, 'book_code': book.book_code},
        'unit': {'id': unit.id, 'title': unit.title, 'unit_number': unit.unit_number},
        'lesson': {'id': lesson.id, 'title': lesson.title, 'lesson_code': lesson.lesson_code, 'estimated_minutes': lesson.estimated_minutes},
        'sections': payload_sections,
    }


@router.get('/questions')
def demo_questions(
    profile: StudentProfile = Depends(require_student_profile),
    db: Session = Depends(get_db),
):
    _, _, lesson = _demo_lesson(db)
    questions = db.query(Question).filter(
        Question.lesson_id == lesson.id,
        Question.status == DEMO_STATUS,
    ).order_by(Question.id).all()
    return [
        {
            'id': q.id,
            'question_code': q.question_code,
            'question_type': q.question_type,
            'prompt': q.prompt,
            'options': q.options_json or [],
            'difficulty': q.difficulty,
            'purpose': q.purpose,
        }
        for q in questions
    ]


@router.post('/questions/{question_id}/attempt')
def demo_attempt(
    question_id: int,
    payload: DemoAttempt,
    profile: StudentProfile = Depends(require_student_profile),
    db: Session = Depends(get_db),
):
    _, _, lesson = _demo_lesson(db)
    question = db.query(Question).filter(
        Question.id == question_id,
        Question.lesson_id == lesson.id,
        Question.status == DEMO_STATUS,
    ).first()
    if not question:
        raise HTTPException(404, 'Demo question not found')

    expected = question.correct_answer_json
    if isinstance(expected, dict) and 'value' in expected:
        expected = expected['value']
    correct = payload.answer == expected
    attempts_count = db.query(QuestionAttempt).filter(
        QuestionAttempt.student_id == profile.id,
        QuestionAttempt.question_id == question.id,
    ).count()
    attempt = QuestionAttempt(
        student_id=profile.id,
        question_id=question.id,
        answer_json=payload.answer,
        is_correct=correct,
        attempt_number=attempts_count + 1,
        response_time_ms=payload.response_time_ms,
        used_hint=payload.used_hint,
        used_ai_help=payload.used_ai_help,
    )
    db.add(attempt)

    updates = []
    links = db.query(QuestionSkill).filter(QuestionSkill.question_id == question.id).all()
    for link in links:
        row = db.query(StudentSkillMastery).filter(
            StudentSkillMastery.student_id == profile.id,
            StudentSkillMastery.skill_id == link.skill_id,
        ).first()
        if not row:
            row = StudentSkillMastery(student_id=profile.id, skill_id=link.skill_id)
            db.add(row); db.flush()
        state = MasteryState(row.mastery_score, row.confidence, row.evidence_count, row.status)
        updated = update_mastery(
            state,
            correct=correct,
            difficulty=question.difficulty,
            used_hint=payload.used_hint,
            used_ai_help=payload.used_ai_help,
        )
        row.mastery_score = updated.score
        row.confidence = updated.confidence
        row.status = updated.status
        row.evidence_count = updated.evidence_count
        now = datetime.now(UTC).replace(tzinfo=None)
        row.last_assessed_at = now
        row.next_retention_at = now + timedelta(days=3) if updated.status == 'MASTERED' else None
        updates.append({'skill_id': link.skill_id, 'mastery_score': updated.score, 'confidence': updated.confidence, 'status': updated.status})

    db.add(LearningEvent(
        event_uuid=str(uuid4()),
        student_id=profile.id,
        event_type='ANSWER_CORRECT' if correct else 'ANSWER_INCORRECT',
        lesson_id=lesson.id,
        question_id=question.id,
        metadata_json={'experimental_demo': True, 'attempt_number': attempts_count + 1},
    ))
    db.commit()
    return {
        'correct': correct,
        'explanation': question.explanation,
        'attempt_number': attempts_count + 1,
        'mastery_updates': updates,
    }


@router.get('/progress')
def demo_progress(
    profile: StudentProfile = Depends(require_student_profile),
    db: Session = Depends(get_db),
):
    _, _, lesson = _demo_lesson(db)
    rows = _mastery_rows(db, profile, lesson.id)
    avg = round(sum(row['mastery_score'] for row in rows) / len(rows) * 100) if rows else 0
    mastered = sum(1 for row in rows if row['status'] in {'MASTERED', 'STABLE'})
    return {'experimental': True, 'lesson_id': lesson.id, 'progress_percent': avg, 'mastered_skills': mastered, 'skills': rows}


@router.get('/recovery')
def demo_recovery(
    profile: StudentProfile = Depends(require_student_profile),
    db: Session = Depends(get_db),
):
    _, _, lesson = _demo_lesson(db)
    rows = _mastery_rows(db, profile, lesson.id)
    assessed = [row for row in rows if row['evidence_count'] > 0]
    weakest = min(assessed, key=lambda x: x['mastery_score']) if assessed else None
    if not weakest:
        return {
            'status': 'NOT_ENOUGH_EVIDENCE',
            'title': 'ابدأ بالأسئلة أولًا',
            'message': 'أجب عن سؤالين أو أكثر في الدرس، ثم ستظهر هنا مراجعة موجهة حسب مهاراتك.',
            'blocks': [],
        }

    content_by_skill = {
        'SK.SCI.G05.MICROSCOPE.PURPOSE': [
            {'type': 'EXPLAIN', 'body': 'المجهر مثل عين أقوى: يجعل الشيء الصغير يبدو أكبر حتى نلاحظ تفاصيله.'},
            {'type': 'CHECK', 'body': 'اسأل نفسك: ما الشيء الذي لا تستطيع العين رؤيته جيدًا ويحتاج إلى تكبير؟'},
        ],
        'SK.SCI.G05.CELL.DISCOVERY.HOOKE': [
            {'type': 'EXPLAIN', 'body': 'تذكّر الصورة الذهنية: هوك + فلين + مجهر = حجرات صغيرة سماها خلايا.'},
            {'type': 'CHECK', 'body': 'ما المادة التي فحصها هوك؟ ولماذا احتاج إلى المجهر؟'},
        ],
        'SK.SCI.G05.CELL.DISCOVERY.TIMELINE': [
            {'type': 'EXPLAIN', 'body': 'رتّب القصة: هوك شاهد خلايا الفلين، ليفنهوك شاهد كائنات وحيدة الخلية، براون وصف النواة، ثم شلايدن وشفان عمّما فكرة أن النبات والحيوان يتكونان من خلايا.'},
            {'type': 'CHECK', 'body': 'اختر عالمين واشرح إنجاز كل واحد بكلماتك.'},
        ],
        'SK.SCI.G05.CELL.CONCEPT.BASIC': [
            {'type': 'EXPLAIN', 'body': 'الخلية وحدة بناء أساسية في الكائنات الحية، ودراستها أصبحت ممكنة بفضل المجاهر.'},
            {'type': 'CHECK', 'body': 'لماذا لا يكفي النظر بالعين المجردة لدراسة الخلايا؟'},
        ],
    }
    return {
        'status': 'REVIEW_RECOMMENDED',
        'title': f"مراجعة سريعة: {weakest['name_ar']}",
        'estimated_minutes': 4,
        'skill': weakest,
        'message': 'هذه مراجعة قصيرة داخل الدرس التجريبي؛ بعدها عد إلى الأسئلة وحاول مرة أخرى.',
        'blocks': content_by_skill.get(weakest['skill_code'], []),
    }


@router.post('/tutor')
def demo_tutor(
    payload: TutorRequest,
    profile: StudentProfile = Depends(require_student_profile),
    db: Session = Depends(get_db),
):
    _, _, lesson = _demo_lesson(db)
    action = payload.action.strip().lower()
    free = (payload.question or '').strip()
    responses = {
        'explain_simple': 'تخيّل أن المجهر عين قوية جدًا. عندما جعل العلماء الأشياء الصغيرة تبدو أكبر، استطاعوا رؤية الخلايا وتفاصيل لم تكن واضحة من قبل.',
        'example': 'مثال: فحص روبرت هوك شريحة رقيقة من الفلين بالمجهر، فشاهد حجرات صغيرة متراصة. هذه المشاهدة كانت محطة مهمة في قصة اكتشاف الخلية.',
        'hint': 'تلميح: ركّز على العلاقة بين ثلاث كلمات: مجهر ← تكبير ← رؤية تفاصيل دقيقة.',
        'compare': 'هوك ارتبط بخلايا الفلين، ليفنهوك بكائنات حية وحيدة الخلية، وبراون بنواة الخلية النباتية.',
        'quiz': 'سؤال سريع: من العالم الذي فحص الفلين بالمجهر وشاهد الحجرات الصغيرة؟',
    }
    answer = responses.get(action)
    if not answer and free:
        text = free.lower()
        if 'هوك' in text:
            answer = 'روبرت هوك فحص شريحة رقيقة من الفلين بالمجهر عام 1665، وشاهد تراكيب صغيرة متراصة أطلق عليها اسم الخلايا.'
        elif 'ليفنهوك' in text or 'ليفنهوك' in free:
            answer = 'فان ليفنهوك ارتبط بمشاهدة كائنات حية وحيدة الخلية باستخدام مجهر ذي قدرة تكبير أكبر.'
        elif 'براون' in text or 'نواة' in text:
            answer = 'روبرت براون وصف نواة الخلية النباتية عام 1831.'
        elif 'مجهر' in text:
            answer = 'المجهر جهاز يساعد على تكبير الأشياء الصغيرة الدقيقة كي نستطيع ملاحظة تفاصيل لا تظهر بوضوح للعين المجردة.'
        elif 'خلية' in text:
            answer = 'في هذا الدرس نتعلم كيف أدى تطور المجهر إلى اكتشاف الخلايا ودراسة الكائنات الدقيقة.'
        else:
            answer = 'في النسخة التجريبية أستطيع مساعدتك داخل موضوع المجهر واكتشاف الخلية فقط. جرّب السؤال عن المجهر، روبرت هوك، ليفنهوك، براون، أو اطلب «اشرح أبسط».'

    db.add(LearningEvent(
        event_uuid=str(uuid4()),
        student_id=profile.id,
        event_type='AI_HELP_REQUESTED',
        lesson_id=lesson.id,
        metadata_json={'experimental_demo': True, 'mode': 'GROUNDED_DEMO_TUTOR', 'action': action},
    ))
    db.commit()
    return {
        'mode': 'GROUNDED_DEMO_TUTOR',
        'experimental': True,
        'answer': answer,
        'lesson_code': lesson.lesson_code,
        'notice': 'مساعد تجريبي مقيد بموضوع الدرس الأول؛ لا يستخدم الإنترنت ولا يجيب خارج نطاق الدرس.',
    }
