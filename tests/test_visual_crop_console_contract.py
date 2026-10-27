from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / 'apps/web/app/admin/visual-crops/page.tsx'


def test_visual_crop_console_draws_normalized_rectangle_and_calls_crop_api():
    text = PAGE.read_text(encoding='utf-8')
    assert 'onMouseDown={begin}' in text
    assert 'onMouseMove={move}' in text
    assert 'onMouseUp={finish}' in text
    assert '/figure-crops' in text
    assert 'TEXTBOOK_FIGURE' in text
    assert 'width>=5' in text
    assert 'height>=5' in text


def test_visual_crop_console_routes_to_review_after_creation():
    text = PAGE.read_text(encoding='utf-8')
    assert '/admin/visual-assets?lesson_id=' in text
    assert 'REVIEW_REQUIRED' in text
