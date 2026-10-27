from app.importer.official_catalog import (
    OFFICIAL_SOURCE_CATALOG,
    _scope_term_report,
    entries_for_package,
)


def test_grade5_science_official_gaza_catalog_entry_is_registered_as_scope_candidate():
    rows = entries_for_package('PS-G05-SCI-S1-2026')
    assert len(rows) == 1
    row = rows[0]
    assert row.source_code == 'PS.G05.SCI.GAZA.CURRENT.S1'
    assert row.grade_code == 'G05'
    assert row.subject_code == 'SCI'
    assert row.promoted_source_type == 'OFFICIAL_PACKAGE'
    assert row.catalog_url == 'https://www.moe.edu.ps/gaza/subjects'
    assert row.registered_url == 'https://moe.edu.ps/m/4070'
    assert row.authority == 'PALESTINIAN_MINISTRY_OF_EDUCATION'
    assert row.reliability_score == 100.0
    assert row.scope_verification_status == 'SEMESTER_1_SCOPE_UNVERIFIED'
    assert row.required_scope_terms == ('الخلية', 'خصائص المادة', 'الطاقة في حياتنا')


def test_catalog_discovery_does_not_claim_edition_verification():
    row = OFFICIAL_SOURCE_CATALOG[0]
    assert row.verification_status == 'CATALOG_LINK_CONFIRMED'
    assert 'EDITION_TO_VERIFY' in row.edition_claim


def test_scope_report_requires_all_target_terms():
    entry = OFFICIAL_SOURCE_CATALOG[0]
    partial = _scope_term_report('الوحدة الأولى: الخلية', entry)
    assert partial['scope_verified'] is False
    assert 'خصائص المادة' in partial['missing_terms']
    assert 'الطاقة في حياتنا' in partial['missing_terms']

    complete = _scope_term_report(
        'الوحدة الأولى: الخلية. الوحدة الثانية: خصائص المادة. الوحدة الثالثة: الطاقة في حياتنا.',
        entry,
    )
    assert complete['scope_verified'] is True
    assert complete['missing_terms'] == []
