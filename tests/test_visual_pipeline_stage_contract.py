from pathlib import Path
from types import SimpleNamespace

from app.factory.generation_readiness import _visual_required_for_lesson


ROOT = Path(__file__).resolve().parents[1]


def test_science_lessons_require_cleared_visual_before_generation():
    science = SimpleNamespace(lesson_code='PS.G05.SCI.S1.U01.L02')
    language = SimpleNamespace(lesson_code='PS.G05.AR.S1.U01.L02')
    assert _visual_required_for_lesson(science) is True
    assert _visual_required_for_lesson(language) is False


def test_current_semester_pipeline_contains_visual_assets_stage():
    text = (ROOT / 'apps/api/app/admin/current_semester.py').read_text(encoding='utf-8')
    assert "'VISUAL_ASSETS'" in text
    assert "action='OPEN_VISUAL_ASSETS'" in text
    assert 'visual_cleared' in text


def test_generation_readiness_has_fail_closed_visual_blocker():
    text = (ROOT / 'apps/api/app/factory/generation_readiness.py').read_text(encoding='utf-8')
    assert "blockers.append('NO_CLEARED_VISUAL_ASSET')" in text
    assert "next_actions.append('EXTRACT_REVIEW_AND_CLEAR_VISUAL_ASSET')" in text


def test_admin_control_center_routes_visual_stage_to_review_console():
    text = (ROOT / 'apps/web/app/admin/current-semester/page.tsx').read_text(encoding='utf-8')
    assert "action==='OPEN_VISUAL_ASSETS'" in text
    assert '/admin/visual-assets?lesson_id=' in text
    assert 'صور الكتاب والمراجعة البصرية' in text
