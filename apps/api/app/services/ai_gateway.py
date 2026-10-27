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
    """Provider-neutral AI gateway with fail-closed task contracts."""

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
                'GENERATE_LESSON', 'GENERATE_QUESTIONS', 'GENERATE_REMEDIATION',
                'QA_CONTENT', 'EXTRACT_SKILLS'
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
        if task == 'EXTRACT_SKILLS':
            packet = payload.get('packet') or {}
            source_context = packet.get('source_context') or []
            allowed_chunks = [x.get('source_chunk_id') for x in source_context if x.get('source_chunk_id')]
            return common + (
                ' Infer only measurable learner skills that are directly supported by the supplied lesson source context. '
                'Do not create skill codes; the server creates codes after admin approval. '
                'Return exactly one object with one top-level key: skills. skills must be an array of 1 to 20 objects. '
                'Each object must contain exactly: name_ar, domain, measurable_outcome_ar, description_ar, '
                'mastery_threshold, importance, source_chunk_ids. '
                'name_ar and measurable_outcome_ar must be Arabic and observable/measurable, not vague verbs such as "يعرف" alone. '
                'domain must be an uppercase ASCII identifier such as SCIENTIFIC_TOOLS or CELL_BIOLOGY and must match ^[A-Z][A-Z0-9_]{1,39}$. '
                'mastery_threshold must be between 0.5 and 0.98; importance between 0.1 and 2.0. '
                'Every proposal must cite one or more source_chunk_ids, using only IDs from '
                f'{allowed_chunks}. Do not infer prerequisites, future-grade links, misconceptions, or assessment questions in this task. '
                'If evidence is insufficient for a skill, omit it rather than guessing.'
            )
        if task == 'GENERATE_LESSON':
            packet = payload.get('packet') or {}
            allowed_chunks = [x.get('source_chunk_id') for x in packet.get('source_context', []) if x.get('source_chunk_id')]
            allowed_skills = [x.get('skill_code') for x in packet.get('skills', []) if x.get('skill_code')]
            return common + (
                ' Produce exactly one Arabic digital lesson object with only these top-level keys: '
                'learning_objectives, concepts, sections, questions, summary, flashcards, '
                'misconceptions, remediation_candidates. Do not add any other top-level key. '
                'Use these exact shapes: '
                'learning_objectives is an array of strings; concepts is an array of strings; '
                'sections is an array of objects {title, learning_goal, blocks}; each blocks item is '
                '{block_type, title, body, content, source_chunk_ids}; '
                'questions is an array of objects {question_type, prompt, options, correct_answer, '
                'explanation, purpose, difficulty, skill_codes, source_chunk_ids}; '
                'summary is an array of objects {text, source_chunk_ids}; '
                'flashcards is an array of objects {front, back, source_chunk_ids}; '
                'misconceptions is an array of objects {title, incorrect_idea, correction, skill_codes, source_chunk_ids}; '
                'remediation_candidates is an array of objects {title, trigger, explanation, practice_prompt, '
                'mastery_check, skill_codes, source_chunk_ids}. '
                'Every source_chunk_ids array must contain one or more IDs and may only use IDs from '
                f'{allowed_chunks}. Every skill_codes array may only use codes from {allowed_skills}. '
                'If the sources do not support a flashcard, misconception, or remediation candidate, return '
                'an empty array for that category rather than inventing one. '
                'Design the lesson as short mobile-friendly learning blocks following '
                'Explain -> Interact -> Check -> Adapt. Use an age-appropriate hook, concise explanation, '
                'guided interaction, quick checks, mastery questions, summary, and remediation only where '
                'the evidence supports it. Keep language Arabic-first, clear, non-stigmatizing, and '
                'appropriate for the learner age. Do not add provider metadata, model names, task names, '
                'confidence wrappers, Markdown, comments, or prose outside the JSON object.'
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
            return common + (
                ' Act as an independent academic reviewer. Audit the staged lesson against the supplied '
                'source_context. Return exactly these top-level keys and no others: errors, conflicts, '
                'unsupported_claims, question_issues, age_appropriateness_issues, confidence, '
                'recommendation, summary. Every issue object must contain exactly code, severity, '
                'category, message, source_chunk_ids. severity must be one of INFO, WARNING, ERROR, '
                'CRITICAL. recommendation must be PASS, REVIEW, or BLOCK. confidence must be 0 through 100. '
                'Use source_chunk_ids only from the supplied source_context; use an empty list only when '
                'the issue is structural and cannot reasonably be tied to a source chunk. Check factual '
                'accuracy, source support, contradictions, curriculum alignment, question answers and '
                'explanations, age-appropriate language, and whether assessment items test the intended '
                'learning. Mark every unsupported curriculum claim explicitly. PASS only when no ERROR or '
                'CRITICAL issue and no unsupported curriculum claim remains. Do not rewrite the lesson; '
                'report findings only.'
            )
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
