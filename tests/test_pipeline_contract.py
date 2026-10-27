import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MODULE = ROOT / 'workers' / 'curriculum' / 'processor.py'
spec = importlib.util.spec_from_file_location('processor', MODULE)
processor = importlib.util.module_from_spec(spec)
spec.loader.exec_module(processor)


def test_parse_stage_detects_headings():
    text = 'الوحدة الرابعة: أجهزة جسم الإنسان والجلد\nالدرس الأول: الجهاز الهيكلي\nالدرس الثاني: الجهاز العضلي'
    result = processor.run_stage('PS-G05-SCI-S2-2026', 'PARSE_SOURCES', {'text': text})
    assert result.status == 'COMPLETED'
    assert result.details['structure']['unit_count'] == 1
    assert result.details['structure']['lesson_count'] == 2


def test_generation_stage_waits_for_provider():
    result = processor.run_stage('X', 'GENERATE_LESSON')
    assert result.status == 'READY_FOR_AI_PROVIDER'


def test_unknown_stage_rejected():
    try:
        processor.run_stage('X', 'UNKNOWN')
    except ValueError:
        return
    raise AssertionError('Unknown stage must be rejected')
