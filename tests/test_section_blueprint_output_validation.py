import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'apps' / 'api'))

from app.factory.output_validation import validate_section_blueprint
from app.schemas.factory import GeneratedLessonPayload


def _payload(section_count: int) -> GeneratedLessonPayload:
    return GeneratedLessonPayload.model_validate({
        'learning_objectives': ['هدف قابل للقياس'],
        'concepts': ['مفهوم'],
        'sections': [
            {
                'title': f'مرحلة {index}',
                'learning_goal': None,
                'blocks': [
                    {
                        'block_type': 'TEXT',
                        'title': None,
                        'body': 'محتوى موثق',
                        'content': {},
                        'source_chunk_ids': [10],
                    }
                ],
            }
            for index in range(1, section_count + 1)
        ],
        'questions': [],
        'summary': [{'text': 'ملخص', 'source_chunk_ids': [10]}],
        'flashcards': [],
        'misconceptions': [],
        'remediation_candidates': [],
    })


def _packet(section_count: int) -> dict:
    return {
        'section_blueprint': [
            {'section_number': index, 'title': f'مرحلة معتمدة {index}', 'order_no': index}
            for index in range(1, section_count + 1)
        ]
    }


def test_section_blueprint_validation_accepts_matching_section_count():
    result = validate_section_blueprint(_packet(7), _payload(7))
    assert result['enforced'] is True
    assert result['valid'] is True
    assert result['expected_count'] == 7
    assert result['actual_count'] == 7
    assert result['reason'] is None
    assert result['semantic_title_alignment_requires_qa'] is True


def test_section_blueprint_validation_rejects_missing_or_extra_stage():
    missing = validate_section_blueprint(_packet(7), _payload(6))
    extra = validate_section_blueprint(_packet(7), _payload(8))

    assert missing['valid'] is False
    assert missing['reason'] == 'SECTION_COUNT_DOES_NOT_MATCH_APPROVED_BLUEPRINT'
    assert missing['expected_count'] == 7
    assert missing['actual_count'] == 6

    assert extra['valid'] is False
    assert extra['reason'] == 'SECTION_COUNT_DOES_NOT_MATCH_APPROVED_BLUEPRINT'
    assert extra['actual_count'] == 8


def test_section_blueprint_validation_is_backward_compatible_without_blueprint():
    result = validate_section_blueprint({}, _payload(3))
    assert result['enforced'] is False
    assert result['valid'] is True
    assert result['expected_count'] == 0
    assert result['actual_count'] == 3
