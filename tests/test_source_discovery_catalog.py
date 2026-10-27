from app.importer.discovery_catalog import (
    SOURCE_DISCOVERY_CATALOG,
    discoveries_for_package,
    list_source_discoveries,
)
from app.importer.source_policy import can_ground_facts, can_prove_current_scope


def test_grade5_science_current_plan_is_discovery_only():
    rows = discoveries_for_package('PS-G05-SCI-S2-2026')
    assert len(rows) == 1
    row = rows[0]
    assert row.intended_source_type == 'CURRICULUM_PLAN'
    assert row.grade_code == 'G05'
    assert row.subject_code == 'SCI'
    assert row.semester == 2
    assert row.academic_year == '2025/2026'
    assert row.file_verified is False
    assert row.ingestion_mode == 'UPLOAD_REQUIRED'
    assert row.discovery_kind == 'SECONDARY_INDEX'


def test_discovered_plan_type_can_prove_scope_but_cannot_ground_facts():
    row = next(x for x in SOURCE_DISCOVERY_CATALOG if x.source_code == 'PS.G05.SCI.S2.PLAN.2025_2026.DISCOVERY')
    assert can_prove_current_scope(row.intended_source_type) is True
    assert can_ground_facts(row.intended_source_type) is False


def test_discovery_endpoint_policy_is_fail_closed_and_explicit():
    result = list_source_discoveries('PS-G05-SCI-S2-2026')
    assert result['catalog_version'] == 'source-discovery/v3'
    assert len(result['entries']) == 1
    assert result['policy']['unverified_discovery_creates_source_files'] is False
    assert result['policy']['verified_direct_file_registration_requires_admin'] is True
    assert result['policy']['adds_package_coverage_before_fetch'] is False
    assert result['policy']['authorizes_generation'] is False
    assert result['policy']['required_next_step'] == 'REGISTER_VERIFIED_DIRECT_FILE_OR_OBTAIN_AND_UPLOAD_ACTUAL_FILE'
