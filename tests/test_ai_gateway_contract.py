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
