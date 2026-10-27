from __future__ import annotations

from dataclasses import dataclass


@dataclass
class AIResponse:
    provider: str
    model_route: str
    output: dict
    usage: dict


class AIGateway:
    """Provider-neutral gateway.

    V0.3 ships with deterministic LOCAL_MOCK so the application can be tested
    without API keys. Real provider adapters plug in behind the same contract.
    """

    def __init__(self, provider: str = 'LOCAL_MOCK'):
        self.provider = provider

    def run(self, task: str, payload: dict, model_route: str = 'BALANCED') -> AIResponse:
        if self.provider != 'LOCAL_MOCK':
            raise RuntimeError(f'Provider adapter not configured: {self.provider}')
        excerpt = (payload.get('text') or '')[:1200]
        output = {
            'task': task,
            'status': 'MOCK_COMPLETED',
            'source_excerpt': excerpt,
            'requires_provider_for_generation': task in {
                'GENERATE_LESSON', 'GENERATE_QUESTIONS', 'GENERATE_REMEDIATION', 'QA_CONTENT'
            },
        }
        return AIResponse(self.provider, model_route, output, {'input_chars': len(payload.get('text') or ''), 'cost': 0})
