import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'apps' / 'api'))

from app.services.mastery import MasteryState, update_mastery
from app.services.diagnostic import find_root_gap
from app.services.solution_alignment import align_questions, validate_answer
from app.services.document_importer import detect_curriculum_structure, chunk_pages


def test_mastery_single_item_not_full_confidence():
    updated = update_mastery(MasteryState(), correct=True, difficulty=0.8)
    assert updated.score > 0.8
    assert updated.confidence <= 0.27
    assert updated.status != 'STABLE'


def test_help_reduces_evidence_strength():
    no_help = update_mastery(MasteryState(), True, 0.5, False, False)
    with_help = update_mastery(MasteryState(), True, 0.5, True, True)
    assert with_help.score < no_help.score


def test_diagnostic_finds_deep_root_gap():
    edges = [(1, 2), (2, 3), (3, 4)]
    mastery = {1: 0.82, 2: 0.30, 3: 0.20, 4: 0.28}
    result = find_root_gap(4, edges, mastery, threshold=0.7)
    assert result['root_gap_skill_id'] == 2


def test_solution_alignment_and_validation():
    result = align_questions(
        ['ما العضو الذي تحميه الجمجمة؟'],
        [{'question': 'ما العضو الذي تساعد الجمجمة على حمايته؟', 'answer': 'الدماغ', 'page': 12}],
        threshold=0.35,
    )[0]
    assert result['matched'] is True
    check = validate_answer('الدماغ', result['reference_answer'])
    assert check['status'] == 'VERIFIED_MATCH'


def test_structure_and_chunking():
    text = 'الوحدة الرابعة: جسم الإنسان\nالدرس الأول: الجهاز الهيكلي\n' + ('نص تعليمي ' * 400)
    structure = detect_curriculum_structure(text)
    assert structure['unit_count'] == 1
    assert structure['lesson_count'] == 1
    chunks = chunk_pages([text], max_chars=500, overlap=50)
    assert len(chunks) > 1
    assert chunks[0]['page_number'] == 1


def test_solution_pair_parser():
    from app.services.solution_alignment import parse_solution_items
    text = 'سؤال 1: ما العضو الذي تحميه الجمجمة؟\nجواب: الدماغ\nسؤال 2: ما وظيفة القفص الصدري؟\nالإجابة: حماية القلب والرئتين'
    items = parse_solution_items(text)
    assert len(items) == 2
    assert items[0]['answer'] == 'الدماغ'
