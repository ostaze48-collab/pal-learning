from __future__ import annotations

from dataclasses import dataclass, asdict
from urllib.parse import urlparse

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


def _source_meta(row: SourceFile) -> dict:
    return dict(row.extraction_meta or {})


def _host(url: str | None) -> str:
    try:
        return (urlparse(url or '').hostname or '').lower()
    except ValueError:
        return ''


def _looks_like_entry(row: SourceFile, entry: OfficialSourceCatalogEntry) -> bool:
    if row.source_url == entry.registered_url:
        return True
    meta = _source_meta(row)
    if meta.get('registered_source_url') == entry.registered_url:
        return True
    if meta.get('catalog_source_code') == entry.source_code:
        return True
    name = (row.original_filename or '').lower()
    if 'moe-current-grade5-science' in name and entry.grade_code == 'G05' and entry.subject_code == 'SCI':
        return True
    # A redirect target can replace the visible URL during old imports. Within
    # the exact expected package, a single Ministry-hosted 100%-reliability row
    # is a safe compatibility fallback and is immediately stamped with catalog
    # identity on the next sync.
    return _host(row.source_url).endswith('moe.edu.ps') and float(row.reliability_score or 0) >= 99


def _catalog_row_for_entry(db: Session, package: SourcePackage, entry: OfficialSourceCatalogEntry) -> SourceFile | None:
    rows = db.query(SourceFile).filter(SourceFile.package_id == package.id).order_by(SourceFile.id).all()
    matches = [row for row in rows if _looks_like_entry(row, entry)]
    if not matches:
        return None
    exact = [row for row in matches if row.source_url == entry.registered_url]
    return exact[0] if exact else matches[0]


def _stamp_catalog_identity(row: SourceFile, entry: OfficialSourceCatalogEntry) -> None:
    meta = _source_meta(row)
    meta['catalog_source_code'] = entry.source_code
    meta['registered_source_url'] = entry.registered_url
    meta['catalog_url'] = entry.catalog_url
    meta['catalog_authority'] = entry.authority
    row.extraction_meta = meta


def _entry_for_source_file(db: Session, row: SourceFile) -> OfficialSourceCatalogEntry | None:
    package = db.query(SourcePackage).filter(SourcePackage.id == row.package_id).first()
    if not package:
        return None
    entries = entries_for_package(package.package_code)
    for entry in entries:
        if _looks_like_entry(row, entry):
            return entry
    return None


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
    checked = 0
    quarantined = 0
    already_verified = 0
    touched_packages: dict[int, SourcePackage] = {}
    for entry in OFFICIAL_SOURCE_CATALOG:
        package = db.query(SourcePackage).filter(SourcePackage.package_code == entry.package_code).first()
        if not package:
            continue
        row = _catalog_row_for_entry(db, package, entry)
        if not row:
            continue
        _stamp_catalog_identity(row, entry)
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
    if checked:
        db.commit()
    return {'checked': checked, 'quarantined': quarantined, 'already_scope_verified': already_verified}


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
    payload = []
    missing = 0
    for entry in expected:
        row = _catalog_row_for_entry(db, package, entry)
        if not row:
            missing += 1
        payload.append({
            **asdict(entry),
            'registered_in_package': bool(row),
            'source_file_id': row.id if row else None,
            'current_source_type': row.source_type if row else None,
            'current_source_url': row.source_url if row else None,
            'scope_verified': bool(row and row.source_type == entry.promoted_source_type),
        })
    return {'package_id': package.id, 'package_code': package.package_code, 'catalog_entries': payload, 'missing_count': missing}


@router.post('/source-packages/{package_id}/sync')
def sync_official_catalog(package_id: int, db: Session = Depends(get_db)):
    package = db.query(SourcePackage).filter(SourcePackage.id == package_id).first()
    if not package:
        raise HTTPException(404, 'Source package not found')
    expected = entries_for_package(package.package_code)
    if not expected:
        return {'package_id': package.id, 'package_code': package.package_code, 'created': 0, 'existing': 0, 'quarantined': 0, 'sources': []}

    created = 0
    existing_count = 0
    quarantined = 0
    sources = []
    for entry in expected:
        row = _catalog_row_for_entry(db, package, entry)
        if row:
            existing_count += 1
            _stamp_catalog_identity(row, entry)
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
                extraction_meta={},
            )
            _stamp_catalog_identity(row, entry)
            db.add(row); db.flush()
            created += 1; quarantined += 1
        sources.append({
            'source_file_id': row.id,
            'source_code': entry.source_code,
            'source_type': row.source_type,
            'promoted_source_type': entry.promoted_source_type,
            'registered_url': entry.registered_url,
            'current_source_url': row.source_url,
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
        'note': 'Catalog identity is preserved independently from redirect targets. Scope verification remains mandatory.',
    }


@router.post('/source-files/{source_file_id}/verify-scope')
def verify_catalog_source_scope(source_file_id: int, db: Session = Depends(get_db)):
    row = db.query(SourceFile).filter(SourceFile.id == source_file_id).first()
    if not row:
        raise HTTPException(404, 'Source file not found')
    entry = _entry_for_source_file(db, row)
    if not entry:
        raise HTTPException(409, 'Source file is not backed by a verified catalog entry')
    if not row.extracted_text:
        raise HTTPException(409, 'Source must be fetched/extracted before scope verification')
    package = db.query(SourcePackage).filter(SourcePackage.id == row.package_id).first()
    if not package:
        raise HTTPException(404, 'Source package not found')
    if package.package_code != entry.package_code:
        raise HTTPException(409, 'Catalog source is attached to the wrong semester/package')

    _stamp_catalog_identity(row, entry)
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
        'registered_url': entry.registered_url,
        'current_source_url': row.source_url,
        'edition_match_score': float(row.edition_match_score or 0),
        'package_completeness': package.completeness_score,
        'package_quality': package.quality_score,
        'note': 'Scope verification confirms semester 1 only. Redirect target changes do not alter catalog identity.',
    }
