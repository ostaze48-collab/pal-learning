from types import SimpleNamespace

from app.importer.router import select_primary_teaching_source


def source(source_type, text, reliability=80, edition_match=0, row_id=1):
    return SimpleNamespace(
        id=row_id,
        source_type=source_type,
        extracted_text=text,
        reliability_score=reliability,
        edition_match_score=edition_match,
    )


def test_current_official_package_is_preferred_over_historical_student_book():
    official = source('OFFICIAL_PACKAGE', 'current official text', 100, 95, 10)
    historical = source('STUDENT_BOOK', 'historical book text', 75, 0, 20)
    assert select_primary_teaching_source([historical, official]) is official


def test_student_book_is_fallback_when_official_package_has_no_extractable_text():
    official_scan = source('OFFICIAL_PACKAGE', '', 100, 95, 10)
    student_book = source('STUDENT_BOOK', 'text book', 90, 90, 20)
    assert select_primary_teaching_source([official_scan, student_book]) is student_book


def test_validator_sources_are_not_promoted_to_primary_teaching_sources():
    solutions = source('SOLUTIONS', 'answers', 95, 95, 30)
    guide = source('TEACHER_GUIDE', 'guide', 98, 95, 40)
    assert select_primary_teaching_source([solutions, guide]) is None
