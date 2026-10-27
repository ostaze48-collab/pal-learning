"""Deterministic curriculum processing core for V0.3.

Provider-specific AI generation remains behind the API AI Gateway. These stages
perform safe local work that can be tested without network access.
"""
from dataclasses import dataclass
import re
from difflib import SequenceMatcher

STAGES = [
    'MATCH_EDITION',
    'PARSE_SOURCES',
    'ALIGN_SOLUTIONS',
    'EXTRACT_STRUCTURE',
    'EXTRACT_CONCEPTS',
    'EXTRACT_SKILLS',
    'MAP_PREREQUISITES',
    'GENERATE_LESSON',
    'GENERATE_QUESTIONS',
    'VALIDATE_ANSWERS',
    'GENERATE_REMEDIATION',
    'QA_CONTENT',
]


@dataclass
class PipelineResult:
    package_code: str
    stage: str
    status: str
    details: dict


def _normalize(text: str) -> str:
    text = (text or '').lower().replace('أ','ا').replace('إ','ا').replace('آ','ا').replace('ى','ي')
    return re.sub(r'[^\w\u0600-\u06FF]+', ' ', text).strip()


def _extract_headings(text: str) -> dict:
    units, lessons = [], []
    for line in text.splitlines():
        clean = re.sub(r'\s+', ' ', line).strip()
        norm = _normalize(clean)
        if norm.startswith('الوحدة ') or norm.startswith('وحدة ') or norm.startswith('الوحده ') or norm.startswith('وحده '):
            units.append(clean)
        elif norm.startswith('الدرس ') or norm.startswith('درس '):
            lessons.append(clean)
    return {'units': units, 'lessons': lessons, 'unit_count': len(units), 'lesson_count': len(lessons)}


def run_stage(package_code: str, stage: str, context: dict | None = None) -> PipelineResult:
    if stage not in STAGES:
        raise ValueError(f'Unknown stage: {stage}')
    context = context or {}
    text = context.get('text', '')

    if stage in {'PARSE_SOURCES', 'EXTRACT_STRUCTURE'}:
        structure = _extract_headings(text)
        return PipelineResult(package_code, stage, 'COMPLETED', {'structure': structure, 'characters': len(text)})

    if stage == 'MATCH_EDITION':
        expected = str(context.get('expected_year') or '')
        score = 95 if expected and expected in text else (45 if text else 0)
        return PipelineResult(package_code, stage, 'COMPLETED', {'edition_match_score': score})

    if stage == 'ALIGN_SOLUTIONS':
        q = _normalize(context.get('question', ''))
        candidate = _normalize(context.get('solution_question', ''))
        score = SequenceMatcher(None, q, candidate).ratio() if q and candidate else 0.0
        return PipelineResult(package_code, stage, 'COMPLETED', {'match_score': round(score, 4), 'matched': score >= 0.6})

    if stage in {'EXTRACT_CONCEPTS', 'EXTRACT_SKILLS', 'MAP_PREREQUISITES'}:
        return PipelineResult(package_code, stage, 'READY_FOR_AI_REVIEW', {
            'message': 'Local preprocessing complete. AI Gateway or admin review is required for semantic curriculum decisions.'
        })

    return PipelineResult(package_code, stage, 'READY_FOR_AI_PROVIDER', {
        'message': 'Stage contract is active; generation/QA runs through the provider-neutral AI Gateway.'
    })
