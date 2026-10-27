import sys
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'apps' / 'api'))

from app.db.base import Base
from app.db.models import Lesson, LessonSection
from app.services.ai_gateway import AIGateway
from app.services.generation_packet import build_lesson_generation_packet


def _lesson_with_blueprint():
    engine = create_engine('sqlite:///:memory:')
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    db = Session()
    lesson = Lesson(
        unit_id=1,
        lesson_number=2,
        lesson_code='PS.G05.SCI.S1.U01.L02',
        title='الخلية وأنواعها',
        status='DRAFT',
    )
    db.add(lesson)
    db.flush()
    titles = [
        'استكشف: لاحظ وقارن',
        'افهم: بناء مفهوم الخلية',
        'افهم: أنواع الخلايا',
        'طبّق: قارن وصنّف',
        'تحقق من فهمك',
        'اختبر نفسك',
        'ملخص ومراجعة',
    ]
    for number, title in enumerate(titles, start=1):
        db.add(LessonSection(
            lesson_id=lesson.id,
            section_number=number,
            title=title,
            order_no=number,
        ))
    db.commit()
    return db, lesson, titles


def test_generation_packet_contains_ordered_approved_section_blueprint():
    db, lesson, titles = _lesson_with_blueprint()
    packet = build_lesson_generation_packet(db, lesson.id)

    assert packet['contract_version'] == 'lesson-generation-packet/v6'
    assert [row['section_number'] for row in packet['section_blueprint']] == list(range(1, 8))
    assert [row['title'] for row in packet['section_blueprint']] == titles
    assert packet['generation_rules']['section_blueprint_enforced'] is True
    assert 'Do not merge' in packet['generation_rules']['section_blueprint_rule']


def test_generation_prompt_explicitly_preserves_packet_blueprint():
    db, lesson, titles = _lesson_with_blueprint()
    packet = build_lesson_generation_packet(db, lesson.id)
    instructions = AIGateway(provider='LOCAL_MOCK')._instructions_for_task(
        'GENERATE_LESSON',
        {'packet': packet},
    )

    assert 'approved section_blueprint' in instructions
    assert 'exactly the same number of sections in the same order' in instructions
    assert titles[0] in instructions
    assert titles[-1] in instructions
