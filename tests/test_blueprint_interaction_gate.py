import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'apps' / 'api'))

from app.factory.output_validation import validate_section_blueprint
from app.schemas.factory import GeneratedLessonPayload


BLUEPRINT = [
    {'section_number': 1, 'title': 'استكشف: لاحظ وقارن', 'order_no': 1},
    {'section_number': 2, 'title': 'افهم: بناء مفهوم الخلية', 'order_no': 2},
    {'section_number': 3, 'title': 'افهم: أنواع الخلايا', 'order_no': 3},
    {'section_number': 4, 'title': 'طبّق: قارن وصنّف', 'order_no': 4},
    {'section_number': 5, 'title': 'تحقق من فهمك', 'order_no': 5},
    {'section_number': 6, 'title': 'اختبر نفسك', 'order_no': 6},
    {'section_number': 7, 'title': 'ملخص ومراجعة', 'order_no': 7},
]


def _block(block_type: str):
    content = {}
    if block_type == 'CLASSIFY':
        content = {
            'categories': [
                {'id': 'a', 'label': 'الفئة أ'},
                {'id': 'b', 'label': 'الفئة ب'},
            ],
            'items': [
                {'id': 'i1', 'label': 'عنصر 1', 'category_id': 'a'},
                {'id': 'i2', 'label': 'عنصر 2', 'category_id': 'b'},
            ],
        }
    elif block_type == 'COMPARE_GRID':
        content = {
            'columns': [
                {'id': 'a', 'label': 'الفئة أ'},
                {'id': 'b', 'label': 'الفئة ب'},
            ],
            'rows': [
                {'label': 'صفة 1', 'values': {'a': 'نعم', 'b': 'لا'}},
            ],
        }
    return {
        'block_type': block_type,
        'title': 'نشاط',
        'body': 'محتوى مدعوم بالمصدر.',
        'content': content,
        'source_chunk_ids': [1],
    }


def _payload(stage4_block_type: str = 'TEXT', section_count: int = 7):
    sections = []
    for index in range(section_count):
        block_type = stage4_block_type if index == 3 else 'TEXT'
        sections.append({
            'title': BLUEPRINT[index]['title'] if index < len(BLUEPRINT) else f'مرحلة {index + 1}',
            'learning_goal': 'هدف تعلم',
            'blocks': [_block(block_type)],
        })
    return GeneratedLessonPayload.model_validate({
        'learning_objectives': ['هدف'],
        'concepts': ['مفهوم'],
        'sections': sections,
        'questions': [],
        'summary': [{'text': 'ملخص', 'source_chunk_ids': [1]}],
        'flashcards': [],
        'misconceptions': [],
        'remediation_candidates': [],
    })


def test_compare_classify_stage_rejects_plain_text_only():
    result = validate_section_blueprint({'section_blueprint': BLUEPRINT}, _payload('TEXT'))
    assert result['valid'] is False
    assert result['reason'] == 'REQUIRED_BLUEPRINT_INTERACTION_MISSING'
    requirement = result['interaction_requirements'][0]
    assert requirement['section_number'] == 4
    assert requirement['passed'] is False
    assert requirement['allowed_block_types'] == ['CLASSIFY', 'COMPARE_GRID']


def test_compare_classify_stage_accepts_classify_block():
    result = validate_section_blueprint({'section_blueprint': BLUEPRINT}, _payload('CLASSIFY'))
    assert result['valid'] is True
    assert result['reason'] is None
    assert result['interaction_requirements'][0]['passed'] is True


def test_compare_classify_stage_accepts_compare_grid_block():
    result = validate_section_blueprint({'section_blueprint': BLUEPRINT}, _payload('COMPARE_GRID'))
    assert result['valid'] is True
    assert result['interaction_requirements_pass'] is True


def test_section_count_failure_still_has_priority():
    result = validate_section_blueprint({'section_blueprint': BLUEPRINT}, _payload('TEXT', section_count=6))
    assert result['valid'] is False
    assert result['reason'] == 'SECTION_COUNT_DOES_NOT_MATCH_APPROVED_BLUEPRINT'
