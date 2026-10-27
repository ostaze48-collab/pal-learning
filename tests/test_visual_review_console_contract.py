from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / 'apps/web/app/admin/visual-assets/page.tsx'


def test_visual_review_console_exposes_extraction_review_and_hotspots():
    text = PAGE.read_text(encoding='utf-8')
    assert '/visual-assets/extract' in text
    assert '/importer/visual-assets/${asset.id}' in text
    assert 'REVIEW_REQUIRED' in text
    assert 'REDRAW_REQUIRED' in text
    assert 'CLEARED' in text
    assert 'addHotspot' in text
    assert 'getBoundingClientRect' in text
    assert 'alt_text' in text


def test_visual_review_console_links_back_to_generation_and_source_review():
    text = PAGE.read_text(encoding='utf-8')
    assert '/admin/lesson-generation?lesson_id=' in text
    assert '/admin/source-link-review?lesson_id=' in text
