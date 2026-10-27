import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'apps' / 'api'))

from app.db.current_semester import SECOND_LESSON_BLUEPRINT, SEMESTER1_STRUCTURE


def test_grade5_science_unit1_contains_lesson_2():
    unit1 = next(unit for unit in SEMESTER1_STRUCTURE if unit[0] == 1)
    assert (2, 'الخلية وأنواعها') in unit1[2]


def test_lesson_2_blueprint_is_pedagogical_only_and_complete():
    assert len(SECOND_LESSON_BLUEPRINT) == 7
    assert SECOND_LESSON_BLUEPRINT[0] == (1, 'استكشف: لاحظ وقارن')
    assert SECOND_LESSON_BLUEPRINT[-1] == (7, 'ملخص ومراجعة')
    assert [number for number, _ in SECOND_LESSON_BLUEPRINT] == list(range(1, 8))
