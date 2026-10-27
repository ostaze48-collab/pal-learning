import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'apps' / 'api'))

from app.services.ai_gateway import AIGateway


class _FakeResponse:
    output_text = '{"learning_objectives": [], "status": "ok"}'
    usage = None


class _FakeResponses:
    def __init__(self, capture):
        self.capture = capture

    def create(self, **kwargs):
        self.capture.update(kwargs)
        return _FakeResponse()


class _FakeClient:
    def __init__(self, capture):
        self.responses = _FakeResponses(capture)


def test_openai_gateway_uses_responses_json_mode(monkeypatch):
    capture = {}
    monkeypatch.setenv('OPENAI_API_KEY', 'test-key')
    monkeypatch.setenv('OPENAI_MODEL', 'test-model')

    import openai
    monkeypatch.setattr(openai, 'OpenAI', lambda api_key: _FakeClient(capture))

    result = AIGateway(provider='OPENAI').run(
        'GENERATE_LESSON',
        {'packet': {'source_context': [], 'skills': []}, 'text': 'source'},
        'BALANCED',
    )

    assert result.provider == 'OPENAI'
    assert capture['model'] == 'test-model'
    assert capture['text']['format']['type'] == 'json_object'
    assert 'JSON' in capture['instructions']
    assert capture['max_output_tokens'] == 12000


def test_generation_prompt_forbids_image_blocks_without_approved_visual_assets():
    instructions = AIGateway(provider='LOCAL_MOCK')._instructions_for_task(
        'GENERATE_LESSON',
        {'packet': {'source_context': [], 'skills': [], 'visual_assets': []}},
    )
    assert 'Do not emit IMAGE blocks' in instructions
    assert 'do not invent image URLs' in instructions
    assert 'Observe -> Explain briefly -> Interact -> Check -> Adapt' in instructions


def test_generation_prompt_embeds_only_server_supplied_visual_assets():
    asset = {
        'src': '/visual-assets/cell.webp',
        'low_data_src': '/visual-assets/cell-low.webp',
        'source_label': 'كتاب العلوم',
        'source_page': 12,
        'asset_kind': 'TEXTBOOK_FIGURE',
        'rights_status': 'CLEARED',
        'hotspots': [{'id': 'nucleus', 'x': 50, 'y': 50, 'label': 'النواة'}],
    }
    instructions = AIGateway(provider='LOCAL_MOCK')._instructions_for_task(
        'GENERATE_LESSON',
        {'packet': {'source_context': [], 'skills': [], 'visual_assets': [asset]}},
    )
    assert '/visual-assets/cell.webp' in instructions
    assert 'Never invent, move, rename, or add hotspots' in instructions
    assert 'Use IMAGE only for CLEARED assets' in instructions
