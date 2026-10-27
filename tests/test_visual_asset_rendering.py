import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'apps' / 'api'))

from app.services.visual_asset_pipeline import _render_page_variants


def test_pdf_page_renderer_produces_main_and_low_data_png():
    import fitz

    document = fitz.open()
    page = document.new_page(width=400, height=600)
    page.insert_text((50, 80), 'Science visual test')
    pdf_bytes = document.tobytes()
    document.close()

    rendered = _render_page_variants(pdf_bytes, 1)
    assert rendered['main_bytes'].startswith(b'\x89PNG')
    assert rendered['low_bytes'].startswith(b'\x89PNG')
    assert rendered['width'] > rendered['height'] * 0.5
    assert len(rendered['low_bytes']) < len(rendered['main_bytes'])


def test_pdf_page_renderer_rejects_page_outside_document():
    import fitz
    import pytest

    document = fitz.open()
    document.new_page()
    pdf_bytes = document.tobytes()
    document.close()

    with pytest.raises(ValueError, match='outside PDF range'):
        _render_page_variants(pdf_bytes, 2)
