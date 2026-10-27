from __future__ import annotations

import hashlib
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

from pypdf import PdfReader


ARABIC_DIACRITICS = re.compile(r'[\u0617-\u061A\u064B-\u0652\u0670\u06D6-\u06ED]')


@dataclass
class ExtractedDocument:
    text: str
    pages: list[str]
    page_count: int
    checksum: str
    extraction_method: str
    warnings: list[str]


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def safe_filename(name: str) -> str:
    name = Path(name or 'source').name
    clean = re.sub(r'[^\w.\-\u0600-\u06FF]+', '_', name, flags=re.UNICODE)
    return clean[:180] or 'source'


def save_upload(data: bytes, filename: str, upload_dir: str | Path) -> Path:
    root = Path(upload_dir)
    root.mkdir(parents=True, exist_ok=True)
    digest = sha256_bytes(data)[:16]
    target = root / f'{digest}-{safe_filename(filename)}'
    target.write_bytes(data)
    return target


def extract_document(path: str | Path, mime_type: str | None = None) -> ExtractedDocument:
    path = Path(path)
    raw = path.read_bytes()
    checksum = sha256_bytes(raw)
    suffix = path.suffix.lower()
    warnings: list[str] = []

    if suffix == '.pdf' or mime_type == 'application/pdf':
        reader = PdfReader(str(path))
        pages = []
        empty_pages = 0
        for page in reader.pages:
            text = (page.extract_text() or '').strip()
            if not text:
                empty_pages += 1
            pages.append(text)
        if empty_pages:
            warnings.append(
                f'{empty_pages} page(s) had no extractable text; scanned pages require manual/vision review.'
            )
        text = '\n\n'.join(p for p in pages if p)
        return ExtractedDocument(
            text=text,
            pages=pages,
            page_count=len(pages),
            checksum=checksum,
            extraction_method='PDF_TEXT',
            warnings=warnings,
        )

    if suffix in {'.txt', '.md', '.csv'} or (mime_type or '').startswith('text/'):
        text = raw.decode('utf-8', errors='replace')
        return ExtractedDocument(
            text=text,
            pages=[text],
            page_count=1,
            checksum=checksum,
            extraction_method='UTF8_TEXT',
            warnings=warnings,
        )

    raise ValueError(f'Unsupported source type: {suffix or mime_type}')


def chunk_pages(pages: Iterable[str], max_chars: int = 1800, overlap: int = 180) -> list[dict]:
    chunks: list[dict] = []
    index = 0
    for page_number, page_text in enumerate(pages, start=1):
        text = re.sub(r'\s+', ' ', page_text or '').strip()
        if not text:
            continue
        start = 0
        while start < len(text):
            end = min(len(text), start + max_chars)
            chunk = text[start:end].strip()
            if chunk:
                chunks.append({'chunk_index': index, 'page_number': page_number, 'text': chunk})
                index += 1
            if end >= len(text):
                break
            start = max(start + 1, end - overlap)
    return chunks


def normalize_heading(text: str) -> str:
    text = ARABIC_DIACRITICS.sub('', text)
    text = text.replace('أ', 'ا').replace('إ', 'ا').replace('آ', 'ا')
    return re.sub(r'\s+', ' ', text).strip()


def detect_curriculum_structure(text: str) -> dict:
    """Heuristic structure detector used before AI review.

    It intentionally returns candidates rather than claiming authoritative structure.
    """
    lines = [re.sub(r'\s+', ' ', x).strip() for x in text.splitlines()]
    lines = [x for x in lines if 3 <= len(x) <= 180]
    units: list[dict] = []
    lessons: list[dict] = []

    unit_re = re.compile(r'^(?:الوحدة|وحدة)\s+(?:رقم\s+)?([\w\u0600-\u06FF٠-٩0-9]+)?\s*[:\-–—]?\s*(.*)$')
    lesson_re = re.compile(r'^(?:الدرس|درس)\s+(?:رقم\s+)?([\w\u0600-\u06FF٠-٩0-9]+)?\s*[:\-–—]?\s*(.*)$')

    current_unit = None
    for line_no, line in enumerate(lines, start=1):
        normalized = normalize_heading(line)
        um = unit_re.match(normalized)
        if um:
            current_unit = len(units) + 1
            title = (um.group(2) or um.group(1) or line).strip(' :-–—')
            units.append({'candidate_number': current_unit, 'title': title, 'line_no': line_no, 'raw': line})
            continue
        lm = lesson_re.match(normalized)
        if lm:
            title = (lm.group(2) or lm.group(1) or line).strip(' :-–—')
            lessons.append({
                'candidate_number': len(lessons) + 1,
                'title': title,
                'unit_candidate_number': current_unit,
                'line_no': line_no,
                'raw': line,
            })

    return {
        'units': units,
        'lessons': lessons,
        'unit_count': len(units),
        'lesson_count': len(lessons),
        'confidence': min(0.98, 0.45 + 0.04 * len(units) + 0.025 * len(lessons)) if (units or lessons) else 0.15,
        'method': 'HEURISTIC_V1',
    }


def edition_match_score(extracted_text: str, expected_year: str | None, expected_title: str | None = None) -> float:
    if not extracted_text:
        return 0.0
    score = 35.0
    normalized = normalize_heading(extracted_text[:15000]).lower()
    if expected_year and str(expected_year) in normalized:
        score += 35
    if expected_title:
        tokens = [t for t in normalize_heading(expected_title).lower().split() if len(t) >= 3]
        if tokens:
            hits = sum(1 for token in set(tokens) if token in normalized)
            score += 30 * (hits / len(set(tokens)))
    return round(min(100.0, score), 1)


def title_match_score(title: str, text: str) -> float:
    """Conservative lexical score for linking a lesson title to a source chunk."""
    title_n = normalize_heading(title).lower()
    text_n = normalize_heading(text).lower()
    if not title_n or not text_n:
        return 0.0
    if title_n in text_n:
        return 1.0
    title_tokens = {t for t in title_n.split() if len(t) > 2}
    if not title_tokens:
        return 0.0
    hits = sum(1 for token in title_tokens if token in text_n)
    return round(hits / len(title_tokens), 4)
