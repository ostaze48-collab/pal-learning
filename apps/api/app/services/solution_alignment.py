from __future__ import annotations

import re
from difflib import SequenceMatcher

_DIAC = re.compile(r'[\u0617-\u061A\u064B-\u0652\u0670\u06D6-\u06ED]')


def normalize_arabic(text: str) -> str:
    text = _DIAC.sub('', (text or '').lower())
    text = text.translate(str.maketrans({'أ':'ا','إ':'ا','آ':'ا','ى':'ي','ؤ':'و','ئ':'ي','ة':'ه'}))
    text = re.sub(r'[^\w\u0600-\u06FF]+', ' ', text)
    return re.sub(r'\s+', ' ', text).strip()


def token_similarity(a: str, b: str) -> float:
    na, nb = normalize_arabic(a), normalize_arabic(b)
    if not na or not nb:
        return 0.0
    sa, sb = set(na.split()), set(nb.split())
    jaccard = len(sa & sb) / max(1, len(sa | sb))
    seq = SequenceMatcher(None, na, nb).ratio()
    return round((jaccard * 0.6) + (seq * 0.4), 4)


def align_questions(question_prompts: list[str], solution_items: list[dict], threshold: float = 0.42) -> list[dict]:
    results = []
    for q in question_prompts:
        best = None
        for item in solution_items:
            score = token_similarity(q, item.get('question', ''))
            if best is None or score > best['score']:
                best = {'score': score, 'item': item}
        if best and best['score'] >= threshold:
            item = best['item']
            results.append({
                'question': q,
                'matched': True,
                'score': best['score'],
                'reference_answer': item.get('answer'),
                'source_page': item.get('page'),
                'source_line': item.get('line'),
                'source_answer_line': item.get('answer_line'),
                'source_file_id': item.get('source_file_id') or item.get('_source_file_id'),
            })
        else:
            results.append({'question': q, 'matched': False, 'score': best['score'] if best else 0.0})
    return results


def validate_answer(ai_answer: str, reference_answer: str) -> dict:
    score = token_similarity(ai_answer, reference_answer)
    if normalize_arabic(ai_answer) == normalize_arabic(reference_answer):
        status = 'VERIFIED_MATCH'
        confidence = 1.0
    elif score >= 0.78:
        status = 'SEMANTIC_MATCH'
        confidence = score
    elif score >= 0.48:
        status = 'REVIEW'
        confidence = score
    else:
        status = 'CONFLICT'
        confidence = 1.0 - score
    return {'status': status, 'similarity': score, 'confidence': round(confidence, 4)}


def parse_solution_items(text: str) -> list[dict]:
    """Extract conservative سؤال/جواب pairs from a solution text file.

    This is deliberately strict. Unstructured material is left unmatched for AI/admin review.
    """
    lines = [re.sub(r'\s+', ' ', x).strip() for x in (text or '').splitlines() if x.strip()]
    q_re = re.compile(r'^(?:سؤال|س|س\.|س:|السؤال)\s*(?:\d+|[٠-٩]+)?\s*[:\-–—]?\s*(.+)$')
    a_re = re.compile(r'^(?:جواب|ج|ج\.|ج:|الإجابة|الاجابة)\s*[:\-–—]?\s*(.+)$')
    items = []
    pending = None
    for idx, line in enumerate(lines, start=1):
        qm = q_re.match(line)
        if qm:
            pending = {'question': qm.group(1).strip(), 'line': idx}
            continue
        am = a_re.match(line)
        if am and pending:
            items.append({
                'question': pending['question'],
                'answer': am.group(1).strip(),
                'line': pending['line'],
                'answer_line': idx,
            })
            pending = None
    return items
