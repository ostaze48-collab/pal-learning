from app.importer.official_catalog import (
    OFFICIAL_SOURCE_CATALOG,
    _scope_term_report,
    entries_for_package,
)


def test_grade5_science_official_gaza_catalog_entry_is_registered_as_scope_candidate():
    rows = entries_for_package('PS-G05-SCI-S2-2026')
    assert len(rows) == 1
    row = rows[0]
    assert row.source_code == 'PS.G05.SCI.GAZA.CURRENT'
    assert row.grade_code == 'G05'
    assert row.subject_code == 'SCI'
    assert row.promoted_source_type == 'OFFICIAL_PACKAGE'
    assert row.catalog_url == 'https://www.moe.edu.ps/gaza/subjects'
    assert row.registered_url == 'https://moe.edu.ps/m/4070'
    assert row.authority == 'PALESTINIAN_MINISTRY_OF_EDUCATION'
    assert row.reliability_score == 100.0
    assert row.scope_verification_status == 'TARGET_SEMESTER_SCOPE_UNVERIFIED'
    assert 'الجهاز الهيكلي' in row.required_scope_terms


def test_catalog_discovery_does_not_claim_edition_verification():
    row = OFFICIAL_SOURCE_CATALOG[0]
    assert row.verification_status == 'CATALOG_LINK_CONFIRMED'
    assert 'EDITION_TO_VERIFY' in row.edition_claim


def test_scope_report_requires_all_target_terms():
    entry = OFFICIAL_SOURCE_CATALOG[0]
    partial = _scope_term_report('درس الجهاز الهيكلي ووظائفه', entry)
    assert partial['scope_verified'] is False
    assert 'أجهزة جسم الإنسان' in partial['missing_terms']

    complete = _scope_term_report(
        'الوحدة: أجهزة جسم الإنسان والجلد. الدرس الأول: الجهاز الهيكلي.',
        entry,
    )
    assert complete['scope_verified'] is True
    assert complete['missing_terms'] == []
