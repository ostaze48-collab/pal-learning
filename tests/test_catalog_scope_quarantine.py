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
            package_code='PS-G05-SCI-S1-2026',
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


def test_scope_verified_semester1_catalog_candidate_is_promoted_and_recounted():
    with _session() as db:
        package = SourcePackage(
            book_id=999,
            package_code='PS-G05-SCI-S1-2026',
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
            extracted_text='الوحدة الأولى: الخلية. الوحدة الثانية: خصائص المادة. الوحدة الثالثة: الطاقة في حياتنا.',
        )
        db.add(source)
        db.commit()

        result = verify_catalog_source_scope(source.id, db)
        db.refresh(source)
        db.refresh(package)
        assert result['scope_verified'] is True
        assert result['missing_terms'] == []
        assert source.source_type == 'OFFICIAL_PACKAGE'
        assert source.status == 'EXTRACTED'
        assert package.completeness_score == 20.0
        assert package.quality_score == 18.0


def test_semester2_package_cannot_promote_the_semester1_catalog_source():
    with _session() as db:
        package = SourcePackage(
            book_id=999,
            package_code='PS-G05-SCI-S2-2026',
            status='INGESTING',
        )
        db.add(package); db.flush()
        source = SourceFile(
            package_id=package.id,
            source_type='CATALOG_CANDIDATE',
            source_url='https://moe.edu.ps/m/4070',
            reliability_score=100,
            edition_match_score=0,
            status='EXTRACTED',
            extracted_text='الخلية خصائص المادة الطاقة في حياتنا',
        )
        db.add(source); db.commit()

        try:
            verify_catalog_source_scope(source.id, db)
            assert False, 'Expected wrong-package verification to be blocked'
        except Exception as exc:
            assert getattr(exc, 'status_code', None) == 409
