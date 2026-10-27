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
    row = SOURCE_DISCOVERY_CATALOG[0]
    assert can_prove_current_scope(row.intended_source_type) is True
    assert can_ground_facts(row.intended_source_type) is False


def test_discovery_endpoint_policy_never_authorizes_ingestion_or_coverage():
    result = list_source_discoveries('PS-G05-SCI-S2-2026')
    assert result['catalog_version'] == 'source-discovery/v1'
    assert len(result['entries']) == 1
    assert result['policy']['creates_source_files'] is False
    assert result['policy']['adds_package_coverage'] is False
    assert result['policy']['authorizes_generation'] is False
    assert result['policy']['required_next_step'] == 'OBTAIN_AND_UPLOAD_ACTUAL_FILE'
