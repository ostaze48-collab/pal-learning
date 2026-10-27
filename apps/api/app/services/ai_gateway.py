from __future__ import annotations

import json
import os
from dataclasses import dataclass


@dataclass
class AIResponse:
    provider: str
    model_route: str
    output: dict
    usage: dict


class AIGateway:
    """Provider-neutral AI gateway.

    LOCAL_MOCK remains the safe default. OPENAI is opt-in and requires all
    credentials/model configuration to live in environment variables, never in
    source control. Generated lesson output is still validated by the Content
    Factory's Pydantic/provenance layer before it can become a candidate.
    """

    def __init__(self, provider: str | None = None):
        self.provider = (provider or os.getenv('AI_PROVIDER', 'LOCAL_MOCK')).upper()

    def run(self, task: str, payload: dict, model_route: str = 'BALANCED') -> AIResponse:
        if self.provider == 'LOCAL_MOCK':
            return self._run_local_mock(task, payload, model_route)
        if self.provider == 'OPENAI':
            return self._run_openai(task, payload, model_route)
        raise RuntimeError(f'Provider adapter not configured: {self.provider}')

    def _run_local_mock(self, task: str, payload: dict, model_route: str) -> AIResponse:
        excerpt = (payload.get('text') or '')[:1200]
        output = {
            'task': task,
            'status': 'MOCK_COMPLETED',
            'source_excerpt': excerpt,
            'requires_provider_for_generation': task in {
                'GENERATE_LESSON', 'GENERATE_QUESTIONS', 'GENERATE_REMEDIATION', 'QA_CONTENT'
            },
        }
        return AIResponse('LOCAL_MOCK', model_route, output, {'input_chars': len(payload.get('text') or ''), 'cost': 0})

    def _model_for_route(self, model_route: str) -> str:
        route_key = model_route.upper().replace('-', '_')
        model = os.getenv(f'OPENAI_MODEL_{route_key}') or os.getenv('OPENAI_MODEL')
        if not model:
            raise RuntimeError(
                f'OPENAI model is not configured for route {model_route}. '
                'Set OPENAI_MODEL or OPENAI_MODEL_<ROUTE>.'
            )
        return model

    @staticmethod
    def _json_from_text(text: str) -> dict:
        raw = (text or '').strip()
        if raw.startswith('```'):
            lines = raw.splitlines()
            if lines and lines[0].startswith('```'):
                lines = lines[1:]
            if lines and lines[-1].strip() == '```':
                lines = lines[:-1]
            raw = '\n'.join(lines).strip()
            if raw.lower().startswith('json\n'):
                raw = raw[5:].strip()
        try:
            parsed = json.loads(raw)
            return parsed if isinstance(parsed, dict) else {'value': parsed}
        except json.JSONDecodeError:
            return {'text': raw, 'parse_status': 'NON_JSON_OUTPUT'}

    def _instructions_for_task(self, task: str, payload: dict) -> str:
        common = (
            'You are a curriculum-grounded education content processor. '
            'Use only the source context supplied in the input. Do not invent facts, '
            'citations, source chunk IDs, skill codes, or curriculum claims. '
            'Return one valid JSON object only.'
        )
        if task == 'GENERATE_LESSON':
            packet = payload.get('packet') or {}
            allowed_chunks = [x.get('source_chunk_id') for x in packet.get('source_context', []) if x.get('source_chunk_id')]
            allowed_skills = [x.get('skill_code') for x in packet.get('skills', []) if x.get('skill_code')]
            return common + (
                ' Produce exactly one Arabic digital lesson object with only these top-level keys: '
                'learning_objectives, concepts, sections, questions, summary, flashcards, '
                'misconceptions, remediation_candidates. Design the lesson as short mobile-friendly '
                'learning blocks following Explain -> Interact -> Check -> Adapt. Use an age-appropriate '
                'hook, concise explanation, guided interaction, quick checks, mastery questions, summary, '
                'and remediation candidates where the supplied skills justify them. Each section must '
                'contain blocks; each block must include block_type, title/body/content as appropriate, '
                'and source_chunk_ids. Each question must include question_type, prompt, options when '
                'needed, correct_answer, explanation, purpose, difficulty, skill_codes, and '
                'source_chunk_ids. Every citable block and question must cite at least one '
                f'allowed source_chunk_id from {allowed_chunks}. Question skill_codes may only '
                f'come from {allowed_skills}. Never cite an ID not present in those allowlists. '
                'Do not add provider metadata, model names, task names, confidence wrappers, or extra '
                'top-level keys to the lesson object. Keep language Arabic-first, clear, non-stigmatizing, '
                'and appropriate for the learner age.'
            )
        if task == 'EXTRACT_STRUCTURE':
            return common + (
                ' Return an object with units and lessons detected from the source. '
                'Include only headings actually supported by the supplied text and add a '
                'confidence value from 0 to 1.'
            )
        if task == 'GENERATE_QUESTIONS':
            return common + ' Return a JSON object containing source-grounded assessment items and explanations.'
        if task == 'GENERATE_REMEDIATION':
            return common + ' Return a short source-grounded remediation sequence followed by a mastery check.'
        if task == 'QA_CONTENT':
            return common + ' Audit the supplied content and return errors, conflicts, unsupported claims, and a confidence score.'
        return common + f' Perform task {task} and return a JSON object.'

    def _run_openai(self, task: str, payload: dict, model_route: str) -> AIResponse:
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            raise RuntimeError('OPENAI_API_KEY is not configured')

        try:
            from openai import OpenAI
        except ImportError as exc:
            raise RuntimeError('OpenAI SDK is not installed') from exc

        model = self._model_for_route(model_route)
        max_output_tokens = int(os.getenv('OPENAI_MAX_OUTPUT_TOKENS', '12000'))
        client = OpenAI(api_key=api_key)
        response = client.responses.create(
            model=model,
            instructions=self._instructions_for_task(task, payload),
            input=json.dumps(payload, ensure_ascii=False, default=str),
            text={'format': {'type': 'json_object'}},
            max_output_tokens=max_output_tokens,
        )
        output = self._json_from_text(getattr(response, 'output_text', '') or '')

        usage_obj = getattr(response, 'usage', None)
        if usage_obj is None:
            usage = {}
        elif hasattr(usage_obj, 'model_dump'):
            usage = usage_obj.model_dump()
        elif isinstance(usage_obj, dict):
            usage = usage_obj
        else:
            usage = {'raw': str(usage_obj)}
        usage = dict(usage)
        usage.setdefault('model', model)
        usage.setdefault('task', task)

        return AIResponse('OPENAI', model_route, output, usage)
