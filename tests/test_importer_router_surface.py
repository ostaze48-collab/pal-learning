from app.importer.router import (
    DEFAULT_SOURCE_HOSTS,
    _apply_extracted_source,
    select_primary_teaching_source,
)


def test_importer_router_keeps_critical_helpers_and_official_hosts():
    assert callable(_apply_extracted_source)
    assert callable(select_primary_teaching_source)
    hosts = set(DEFAULT_SOURCE_HOSTS.split(','))
    assert 'moe.edu.ps' in hosts
    assert 'elearn.edu.ps' in hosts
    assert 'elearnps.blob.core.windows.net' in hosts
