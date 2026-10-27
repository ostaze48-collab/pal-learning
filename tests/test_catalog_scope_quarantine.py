from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.db.base import Base
from app.db.models import SourceFile, SourcePackage
from app.importer.official_catalog import (
    quarantine_unverified_catalog_sources,
    verify_catalog_source_scope,
)
from app.importer.router import update_package_completeness


def _session():
    engine = create_engine('sqlite:///:memory:')
    Base.metadata.create_all(bind=engine)
    return Session(engine)


def test_quarantine_removes_unverified_official_link_from_coverage():
    with _session() as db:
        package = SourcePackage(
            book_id=999,
            package_code='PS-G05-SCI-S2-2026',
            status='INGESTING',
        )
        db.add(package)
        db.flush()
        source = SourceFile(
            package_id=package.id,
            source_type='OFFICIAL_PACKAGE',
            source_url='https://moe.edu.ps/m/4070',
            reliability_score=100,
            edition_match_score=100,
            status='DISCOVERED',
        )
        db.add(source)
        db.flush()
        update_package_completeness(db, package)
        assert package.completeness_score == 20.0

        result = quarantine_unverified_catalog_sources(db)
        db.refresh(source)
        db.refresh(package)
        assert result['quarantined'] == 1
        assert source.source_type == 'CATALOG_CANDIDATE'
        assert source.status == 'SCOPE_UNVERIFIED'
        assert source.edition_match_score == 0.0
        assert package.completeness_score == 0.0
        assert package.quality_score == 0.0


def test_scope_verified_catalog_candidate_is_promoted_and_recounted():
    with _session() as db:
        package = SourcePackage(
            book_id=999,
            package_code='PS-G05-SCI-S2-2026',
            status='INGESTING',
        )
        db.add(package)
        db.flush()
        source = SourceFile(
            package_id=package.id,
            source_type='CATALOG_CANDIDATE',
            source_url='https://moe.edu.ps/m/4070',
            reliability_score=100,
            edition_match_score=90,
            status='EXTRACTED',
            extracted_text='الوحدة: أجهزة جسم الإنسان والجلد. الدرس الأول: الجهاز الهيكلي ووظائفه.',
        )
        db.add(source)
        db.commit()

        result = verify_catalog_source_scope(source.id, db)
        db.refresh(source)
        db.refresh(package)
        assert result['scope_verified'] is True
        assert source.source_type == 'OFFICIAL_PACKAGE'
        assert source.status == 'EXTRACTED'
        assert package.completeness_score == 20.0
        assert package.quality_score == 18.0
