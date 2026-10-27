from pathlib import Path


def test_official_source_workflow_uses_fail_closed_catalog_sequence():
    page = Path('apps/web/app/admin/official-source/page.tsx').read_text(encoding='utf-8')
    assert '/importer/catalog/source-packages/${PACKAGE_ID}/sync' in page
    assert '/importer/source-files/${source.source_file_id}/fetch-registered' in page
    assert '/importer/catalog/source-files/${source.source_file_id}/verify-scope' in page
    assert 'CATALOG_CANDIDATE' in page
    assert 'OFFICIAL_PACKAGE' in page
    assert 'durable_storage' in page
