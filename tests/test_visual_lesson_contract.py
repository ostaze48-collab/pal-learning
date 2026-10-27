from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def test_student_image_renderer_is_rights_fail_closed():
    text = (ROOT / 'apps/web/app/student/lesson/TextbookFigure.tsx').read_text(encoding='utf-8')
    assert "content.rights_status==='CLEARED'" in text
    assert 'الصورة قيد مراجعة الحقوق' in text
    assert 'source_page' in text
    assert 'hotspots.map' in text


def test_lesson_content_blocks_routes_image_to_textbook_figure():
    text = (ROOT / 'apps/web/app/student/lesson/LessonContentBlocks.tsx').read_text(encoding='utf-8')
    assert "block.block_type==='IMAGE'" in text
    assert '<TextbookFigure content={c} lowData={lowData}/>' in text


def test_visual_first_prompt_contract_is_documented():
    text = (ROOT / 'packages/prompts/lesson_generator/v2.md').read_text(encoding='utf-8')
    assert 'Observe' in text
    assert 'server-approved hotspots' in text
    assert 'Only `CLEARED` assets' in text
