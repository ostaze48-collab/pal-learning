from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth.deps import require_student_profile
from ..db.demo_experiment import DEMO_LESSON_CODE, DEMO_STATUS, demo_enabled
from ..db.deps import get_db
from ..db.models import (
    Lesson,
    LessonSkill,
    Question,
    QuestionAttempt,
    Skill,
    StudentProfile,
    StudentSkillMastery,
)

router = APIRouter(prefix='/demo', tags=['experimental-demo-result'])


@router.get('/result')
def demo_result(
    profile: StudentProfile = Depends(require_student_profile),
    db: Session = Depends(get_db),
):
    if not demo_enabled():
        raise HTTPException(404, 'Experimental demo is disabled')

    lesson = db.query(Lesson).filter(
        Lesson.lesson_code == DEMO_LESSON_CODE,
        Lesson.status == DEMO_STATUS,
    ).first()
    if not lesson:
        raise HTTPException(503, 'Experimental lesson is not ready')

    questions = db.query(Question).filter(
        Question.lesson_id == lesson.id,
        Question.status == DEMO_STATUS,
    ).order_by(Question.id).all()

    latest = []
    for question in questions:
        attempt = db.query(QuestionAttempt).filter(
            QuestionAttempt.student_id == profile.id,
            QuestionAttempt.question_id == question.id,
        ).order_by(QuestionAttempt.attempt_number.desc(), QuestionAttempt.id.desc()).first()
        if attempt:
            latest.append((question, attempt))

    answered = len(latest)
    correct = sum(1 for _, attempt in latest if attempt.is_correct)
    total = len(questions)
    completed = bool(total and answered >= total)
    score = round((correct / total) * 100) if total else 0

    skill_rows = db.query(LessonSkill, Skill).join(Skill, Skill.id == LessonSkill.skill_id).filter(
        LessonSkill.lesson_id == lesson.id,
        Skill.status == DEMO_STATUS,
    ).all()
    skills = []
    for _, skill in skill_rows:
        mastery = db.query(StudentSkillMastery).filter(
            StudentSkillMastery.student_id == profile.id,
            StudentSkillMastery.skill_id == skill.id,
        ).first()
        skills.append({
            'skill_id': skill.id,
            'skill_code': skill.skill_code,
            'name_ar': skill.name_ar,
            'mastery_score': float(mastery.mastery_score or 0) if mastery else 0.0,
            'confidence': float(mastery.confidence or 0) if mastery else 0.0,
            'status': mastery.status if mastery else 'NOT_ASSESSED',
            'evidence_count': mastery.evidence_count if mastery else 0,
        })

    assessed = [row for row in skills if row['evidence_count'] > 0]
    strongest = max(assessed, key=lambda row: row['mastery_score']) if assessed else None
    weakest = min(assessed, key=lambda row: row['mastery_score']) if assessed else None
    avg_mastery = round(sum(row['mastery_score'] for row in assessed) / len(assessed) * 100) if assessed else 0

    if not completed:
        next_action = {
            'type': 'CONTINUE',
            'title': 'أكمل أسئلة الدرس',
            'message': f'أجبت عن {answered} من {total}. أكمل الأسئلة للحصول على نتيجة نهائية أدق.',
            'href': '/student/lesson#questions',
        }
    elif weakest and weakest['mastery_score'] < 0.70:
        next_action = {
            'type': 'REVIEW',
            'title': 'مراجعة قصيرة قبل الإنهاء',
            'message': f"أفضل خطوة الآن هي مراجعة مهارة: {weakest['name_ar']}",
            'href': '/student/recovery',
        }
    else:
        next_action = {
            'type': 'DONE',
            'title': 'أحسنت — أنهيت النسخة التجريبية',
            'message': 'يمكنك إعادة الدرس أو مراجعة تفاصيل مهاراتك.',
            'href': '/student/progress',
        }

    return {
        'experimental': True,
        'lesson': {'id': lesson.id, 'lesson_code': lesson.lesson_code, 'title': lesson.title},
        'completion': {
            'completed': completed,
            'answered_questions': answered,
            'total_questions': total,
            'correct_latest_answers': correct,
            'score_percent': score,
        },
        'mastery': {
            'average_percent': avg_mastery,
            'assessed_skills': len(assessed),
            'total_skills': len(skills),
            'strongest': strongest,
            'weakest': weakest,
        },
        'next_action': next_action,
        'notice': 'نتيجة تجريبية تجمع آخر إجابة لكل سؤال مع Mastery حسب المهارة؛ ليست شهادة أو درجة مدرسية رسمية.',
    }
