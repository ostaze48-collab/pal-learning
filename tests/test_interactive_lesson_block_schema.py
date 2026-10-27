import sys
from pathlib import Path

import pytest
from pydantic import ValidationError

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'apps' / 'api'))

from app.schemas.factory import GeneratedBlock
from app.services.ai_gateway import AIGateway


def test_classify_block_accepts_well_formed_generic_content():
    block = GeneratedBlock.model_validate({
        'block_type': 'CLASSIFY',
        'title': 'صنّف',
        'body': None,
        'content': {
            'categories': [
                {'id': 'a', 'label': 'الفئة أ'},
                {'id': 'b', 'label': 'الفئة ب'},
            ],
            'items': [
                {'id': 'i1', 'label': 'عنصر 1', 'category_id': 'a'},
                {'id': 'i2', 'label': 'عنصر 2', 'category_id': 'b'},
            ],
        },
        'source_chunk_ids': [10],
    })
    assert block.block_type == 'CLASSIFY'


def test_classify_block_rejects_unknown_category_reference():
    with pytest.raises(ValidationError):
        GeneratedBlock.model_validate({
            'block_type': 'CLASSIFY',
            'content': {
                'categories': [{'id': 'a', 'label': 'الفئة أ'}],
                'items': [{'id': 'i1', 'label': 'عنصر 1', 'category_id': 'missing'}],
            },
            'source_chunk_ids': [10],
        })


def test_compare_grid_requires_every_declared_column_in_each_row():
    valid = GeneratedBlock.model_validate({
        'block_type': 'COMPARE_GRID',
        'content': {
            'columns': [
                {'id': 'left', 'label': 'أ'},
                {'id': 'right', 'label': 'ب'},
            ],
            'rows': [
                {'label': 'وجه المقارنة', 'values': {'left': 'قيمة 1', 'right': 'قيمة 2'}},
            ],
        },
        'source_chunk_ids': [20],
    })
    assert valid.block_type == 'COMPARE_GRID'

    with pytest.raises(ValidationError):
        GeneratedBlock.model_validate({
            'block_type': 'COMPARE_GRID',
            'content': {
                'columns': [
                    {'id': 'left', 'label': 'أ'},
                    {'id': 'right', 'label': 'ب'},
                ],
                'rows': [
                    {'label': 'وجه المقارنة', 'values': {'left': 'قيمة 1'}},
                ],
            },
            'source_chunk_ids': [20],
        })


def test_generation_prompt_documents_interactive_contracts():
    gateway = AIGateway(provider='LOCAL_MOCK')
    instructions = gateway._instructions_for_task('GENERATE_LESSON', {
        'packet': {
            'source_context': [{'source_chunk_id': 10}],
            'skills': [{'skill_code': 'SK.TEST'}],
        }
    })
    assert 'CLASSIFY' in instructions
    assert 'COMPARE_GRID' in instructions
    assert 'item.category_id' in instructions
    assert 'row.values' in instructions
    assert 'verified source' in instructions
