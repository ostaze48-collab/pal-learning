from __future__ import annotations

from dataclasses import dataclass, asdict

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth.deps import require_admin
from ..db.deps import get_db
from ..db.models import SourceFile, SourcePackage

router = APIRouter(
    prefix='/importer/catalog',
    tags=['curriculum-source-catalog'],
    dependencies=[Depends(require_admin)],
)


@dataclass(frozen=True)
class OfficialSourceCatalogEntry:
    source_code: str
    package_code: str
    grade_code: str
    subject_code: str
    promoted_source_type: str
    catalog_url: str
    registered_url: str
    authority: str
    reliability_score: float
    edition_claim: str
    verification_status: str
    scope_verification_status: str
    required_scope_terms: tuple[str, ...]
    verified_on: str


OFFICIAL_SOURCE_CATALOG: tuple[OfficialSourceCatalogEntry, ...] = (
    OfficialSourceCatalogEntry(
        source_code='PS.G05.SCI.GAZA.CURRENT.S1',
        package_code='PS-G05-SCI-S1-2026',
        grade_code='G05',
        subject_code='SCI',
        promoted_source_type='OFFICIAL_PACKAGE',
        catalog_url='https://www.moe.edu.ps/gaza/subjects',
        registered_url='https://moe.edu.ps/m/4070',
        authority='PALESTINIAN_MINISTRY_OF_EDUCATION',
        reliability_score=100.0,
        edition_claim='CURRENT_GAZA_LEARNING_PACKAGE_EDITION_TO_VERIFY',
        verification_status='CATALOG_LINK_CONFIRMED',
        scope_verification_status='SEMESTER_1_SCOPE_UNVERIFIED',
        required_scope_terms=('الخلية', 'خصائص المادة', 'الطاقة في حياتنا'),
        verified_on='2026-10-27',
    ),
)


def entries_for_package(package_code: str) -> list[OfficialSourceCatalogEntry]:
    return [x for x in OFFICIAL_SOURCE_CATALOG if x.package_code == package_code]


def _entry_for_url(url: str | None) -> OfficialSourceCatalogEntry | None:
    if not url:
        return None
    return next((x for x in OFFICIAL_SOURCE_CATALOG if x.registered_url == url), None)


def _scope_term_report(text: str, entry: OfficialSourceCatalogEntry) -> dict:
    normalized = ' '.join((text or '').split())
    matched = [term for term in entry.required_scope_terms if term in normalized]
    missing = [term for term in entry.required_scope_terms if term not in normalized]
    return {
        'matched_terms': matched,
        'missing_terms': missing,
        'scope_verified': bool(entry.required_scope_terms) and not missing,
    }


def _recalculate_package(db: Session, package: SourcePackage) -> None:
    from .router import update_package_completeness
    update_package_completeness(db, package)


def quarantine_unverified_catalog_sources(db: Session) -> dict:
    """Remove unverified catalog links from weighted teaching-source types.

    The current Grade-5 Science Ministry link belongs to the semester-1 production
    track. It remains CATALOG_CANDIDATE until extracted text confirms all three
    semester-1 unit markers. Semester-2 prototype rows are handled separately by
    the current-semester registry and carry no current authority.
    """
    checked = 0
    quarantined = 0
    already_verified = 0
    touched_packages: dict[int, SourcePackage] = {}
    for entry in OFFICIAL_SOURCE_CATALOG:
        package = db.query(SourcePackage).filter(SourcePackage.package_code == entry.package_code).first()
        if not package:
            continue
        row = db.query(SourceFile).filter(
            SourceFile.package_id == package.id,
            SourceFile.source_url == entry.registered_url,
        ).first()
        if not row:
            continue
        checked += 1
        report = _scope_term_report(row.extracted_text or '', entry)
        if report['scope_verified']:
            already_verified += 1
            continue
        if row.source_type != 'CATALOG_CANDIDATE' or row.status not in {'SCOPE_UNVERIFIED', 'SCOPE_REJECTED'}:
            row.source_type = 'CATALOG_CANDIDATE'
            row.status = 'SCOPE_REJECTED' if row.extracted_text else 'SCOPE_UNVERIFIED'
            row.edition_match_score = 0.0
            touched_packages[package.id] = package
            quarantined += 1
    for package in touched_packages.values():
        _recalculate_package(db, package)
    if quarantined:
        db.commit()
    return {
        'checked': checked,
        'quarantined': quarantined,
        'already_scope_verified': already_verified,
    }


@router.get('/official-sources')
def list_official_sources(package_code: str | None = None):
    rows = OFFICIAL_SOURCE_CATALOG
    if package_code:
        rows = tuple(x for x in rows if x.package_code == package_code)
    return [asdict(x) for x in rows]


@router.get('/source-packages/{package_id}/diff')
def official_catalog_diff(package_id: int, db: Session = Depends(get_db)):
    package = db.query(SourcePackage).filter(SourcePackage.id == package_id).first()
    if not package:
        raise HTTPException(404, 'Source package not found')

    expected = entries_for_package(package.package_code)
    existing = db.query(SourceFile).filter(SourceFile.package_id == package.id).all()
    existing_urls = {x.source_url: x for x in existing if x.source_url}

    return {
        'package_id': package.id,
        'package_code': package.package_code,
        'catalog_entries': [
            {
                **asdict(entry),
                'registered_in_package': entry.registered_url in existing_urls,
                'current_source_type': (
                    existing_urls[entry.registered_url].source_type
                    if entry.registered_url in existing_urls else None
                ),
                'scope_verified': (
                    existing_urls[entry.registered_url].source_type == entry.promoted_source_type
                    if entry.registered_url in existing_urls else False
                ),
            }
            for entry in expected
        ],
        'missing_count': sum(1 for entry in expected if entry.registered_url not in existing_urls),
    }


@router.post('/source-packages/{package_id}/sync')
def sync_official_catalog(package_id: int, db: Session = Depends(get_db)):
    package = db.query(SourcePackage).filter(SourcePackage.id == package_id).first()
    if not package:
        raise HTTPException(404, 'Source package not found')

    expected = entries_for_package(package.package_code)
    if not expected:
        return {
            'package_id': package.id,
            'package_code': package.package_code,
            'created': 0,
            'existing': 0,
            'quarantined': 0,
            'sources': [],
        }

    created = 0
    existing_count = 0
    quarantined = 0
    sources = []
    for entry in expected:
        row = db.query(SourceFile).filter(
            SourceFile.package_id == package.id,
            SourceFile.source_url == entry.registered_url,
        ).first()
        if row:
            existing_count += 1
            report = _scope_term_report(row.extracted_text or '', entry)
            if not report['scope_verified'] and row.source_type != 'CATALOG_CANDIDATE':
                row.source_type = 'CATALOG_CANDIDATE'
                row.status = 'SCOPE_REJECTED' if row.extracted_text else 'SCOPE_UNVERIFIED'
                row.edition_match_score = 0.0
                quarantined += 1
        else:
            row = SourceFile(
                package_id=package.id,
                source_type='CATALOG_CANDIDATE',
                source_url=entry.registered_url,
                original_filename=f'{entry.source_code.lower().replace(".", "-")}-registered-source',
                edition=entry.edition_claim,
                reliability_score=entry.reliability_score,
                edition_match_score=0.0,
                status='SCOPE_UNVERIFIED',
            )
            db.add(row)
            db.flush()
            created += 1
            quarantined += 1
        sources.append({
            'source_file_id': row.id,
            'source_code': entry.source_code,
            'source_type': row.source_type,
            'promoted_source_type': entry.promoted_source_type,
            'registered_url': row.source_url,
            'catalog_url': entry.catalog_url,
            'authority': entry.authority,
            'scope_verification_status': entry.scope_verification_status,
            'required_scope_terms': list(entry.required_scope_terms),
            'edition_match_score': float(row.edition_match_score or 0),
            'status': row.status,
        })

    _recalculate_package(db, package)
    db.commit()
    return {
        'package_id': package.id,
        'package_code': package.package_code,
        'created': created,
        'existing': existing_count,
        'quarantined': quarantined,
        'package_completeness': package.completeness_score,
        'package_quality': package.quality_score,
        'sources': sources,
        'note': 'Catalog sync proves discovery/authority only. Sources remain unweighted CATALOG_CANDIDATE records until extracted content verifies semester-1 scope.',
    }


@router.post('/source-files/{source_file_id}/verify-scope')
def verify_catalog_source_scope(source_file_id: int, db: Session = Depends(get_db)):
    row = db.query(SourceFile).filter(SourceFile.id == source_file_id).first()
    if not row:
        raise HTTPException(404, 'Source file not found')
    entry = _entry_for_url(row.source_url)
    if not entry:
        raise HTTPException(409, 'Source file is not backed by a verified catalog entry')
    if not row.extracted_text:
        raise HTTPException(409, 'Source must be fetched/extracted before scope verification')

    package = db.query(SourcePackage).filter(SourcePackage.id == row.package_id).first()
    if not package:
        raise HTTPException(404, 'Source package not found')
    if package.package_code != entry.package_code:
        raise HTTPException(409, 'Catalog source is attached to the wrong semester/package')

    report = _scope_term_report(row.extracted_text, entry)
    if report['scope_verified']:
        row.source_type = entry.promoted_source_type
        if row.status in {'SCOPE_UNVERIFIED', 'SCOPE_REJECTED'}:
            row.status = 'EXTRACTED'
    else:
        row.source_type = 'CATALOG_CANDIDATE'
        row.status = 'SCOPE_REJECTED'

    _recalculate_package(db, package)
    db.commit()
    return {
        'source_file_id': row.id,
        'source_code': entry.source_code,
        'scope_verified': report['scope_verified'],
        'matched_terms': report['matched_terms'],
        'missing_terms': report['missing_terms'],
        'source_type': row.source_type,
        'status': row.status,
        'edition_match_score': float(row.edition_match_score or 0),
        'package_completeness': package.completeness_score,
        'package_quality': package.quality_score,
        'note': 'Scope verification confirms semester 1 only. Edition match remains a separate quality gate.',
    }
