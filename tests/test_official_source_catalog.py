from app.importer.official_catalog import OFFICIAL_SOURCE_CATALOG, entries_for_package


def test_grade5_science_official_gaza_catalog_entry_is_registered():
    rows = entries_for_package('PS-G05-SCI-S2-2026')
    assert len(rows) == 1
    row = rows[0]
    assert row.source_code == 'PS.G05.SCI.GAZA.CURRENT'
    assert row.grade_code == 'G05'
    assert row.subject_code == 'SCI'
    assert row.source_type == 'OFFICIAL_PACKAGE'
    assert row.catalog_url == 'https://www.moe.edu.ps/gaza/subjects'
    assert row.registered_url == 'https://moe.edu.ps/m/4070'
    assert row.authority == 'PALESTINIAN_MINISTRY_OF_EDUCATION'
    assert row.reliability_score == 100.0


def test_catalog_discovery_does_not_claim_edition_verification():
    row = OFFICIAL_SOURCE_CATALOG[0]
    assert row.verification_status == 'CATALOG_LINK_CONFIRMED'
    assert 'EDITION_TO_VERIFY' in row.edition_claim
