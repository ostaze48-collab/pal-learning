import sys
from pathlib import Path

import pytest
from pydantic import ValidationError

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'apps' / 'api'))

from app.schemas.factory import GeneratedLessonPayload


def _payload():
    return {
        'learning_objectives': ['أن يفسر الطالب وظيفة أساسية للجهاز الهيكلي.'],
        'concepts': ['الجهاز الهيكلي'],
        'sections': [{
            'title': 'فكرة أساسية',
            'learning_goal': 'فهم الدعامة',
            'blocks': [{
                'block_type': 'TEXT',
                'title': 'الدعامة',
                'body': 'يساعد الجهاز الهيكلي على دعامة الجسم.',
                'content': {},
                'source_chunk_ids': [1],
            }],
        }],
        'questions': [],
        'summary': [{'text': 'الجهاز الهيكلي يساعد على دعامة الجسم.', 'source_chunk_ids': [1]}],
        'flashcards': [],
        'misconceptions': [],
        'remediation_candidates': [],
    }


def test_generated_lesson_payload_accepts_only_declared_top_level_fields():
    GeneratedLessonPayload.model_validate(_payload())

    bad = _payload()
    bad['provider_note'] = 'unexpected'
    with pytest.raises(ValidationError, match='extra_forbidden'):
        GeneratedLessonPayload.model_validate(bad)


def test_generated_blocks_reject_unexpected_fields():
    bad = _payload()
    bad['sections'][0]['blocks'][0]['invented_field'] = 'unexpected'
    with pytest.raises(ValidationError, match='extra_forbidden'):
        GeneratedLessonPayload.model_validate(bad)
