from types import SimpleNamespace

from app.importer.router import calculate_package_scores


def source(source_type, reliability, edition_match):
    return SimpleNamespace(
        source_type=source_type,
        reliability_score=reliability,
        edition_match_score=edition_match,
    )


def test_coverage_and_verified_quality_are_separate():
    coverage, quality = calculate_package_scores([
        source('OFFICIAL_PACKAGE', 100, 0),
        source('STUDENT_BOOK', 75, 0),
        source('SOLUTIONS', 85, 0),
    ])
    assert coverage == 65.0
    assert quality == 0.0


def test_verified_current_official_package_contributes_weighted_quality():
    coverage, quality = calculate_package_scores([
        source('OFFICIAL_PACKAGE', 100, 100),
    ])
    assert coverage == 20.0
    assert quality == 20.0


def test_duplicate_sources_do_not_inflate_coverage_or_quality():
    coverage, quality = calculate_package_scores([
        source('STUDENT_BOOK', 50, 50),
        source('STUDENT_BOOK', 100, 100),
    ])
    assert coverage == 30.0
    assert quality == 30.0
