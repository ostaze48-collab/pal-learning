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
    source_type: str
    catalog_url: str
    registered_url: str
    authority: str
    reliability_score: float
    edition_claim: str
    verification_status: str
    verified_on: str


OFFICIAL_SOURCE_CATALOG: tuple[OfficialSourceCatalogEntry, ...] = (
    OfficialSourceCatalogEntry(
        source_code='PS.G05.SCI.GAZA.CURRENT',
        package_code='PS-G05-SCI-S2-2026',
        grade_code='G05',
        subject_code='SCI',
        source_type='OFFICIAL_PACKAGE',
        catalog_url='https://www.moe.edu.ps/gaza/subjects',
        registered_url='https://moe.edu.ps/m/4070',
        authority='PALESTINIAN_MINISTRY_OF_EDUCATION',
        reliability_score=100.0,
        edition_claim='CURRENT_GAZA_LEARNING_PACKAGE_EDITION_TO_VERIFY',
        verification_status='CATALOG_LINK_CONFIRMED',
        verified_on='2026-10-27',
    ),
)


def entries_for_package(package_code: str) -> list[OfficialSourceCatalogEntry]:
    return [x for x in OFFICIAL_SOURCE_CATALOG if x.package_code == package_code]


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
    existing_keys = {(x.source_type, x.source_url) for x in existing}

    return {
        'package_id': package.id,
        'package_code': package.package_code,
        'catalog_entries': [
            {
                **asdict(entry),
                'registered_in_package': (entry.source_type, entry.registered_url) in existing_keys,
            }
            for entry in expected
        ],
        'missing_count': sum(
            1 for entry in expected
            if (entry.source_type, entry.registered_url) not in existing_keys
        ),
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
            'sources': [],
        }

    created = 0
    existing_count = 0
    sources = []
    for entry in expected:
        row = db.query(SourceFile).filter(
            SourceFile.package_id == package.id,
            SourceFile.source_type == entry.source_type,
            SourceFile.source_url == entry.registered_url,
        ).first()
        if row:
            existing_count += 1
        else:
            row = SourceFile(
                package_id=package.id,
                source_type=entry.source_type,
                source_url=entry.registered_url,
                original_filename=f'{entry.source_code.lower().replace(".", "-")}-registered-source',
                edition=entry.edition_claim,
                reliability_score=entry.reliability_score,
                edition_match_score=0.0,
                status='DISCOVERED',
            )
            db.add(row)
            db.flush()
            created += 1
        sources.append({
            'source_file_id': row.id,
            'source_code': entry.source_code,
            'source_type': row.source_type,
            'registered_url': row.source_url,
            'catalog_url': entry.catalog_url,
            'authority': entry.authority,
            'edition_match_score': float(row.edition_match_score or 0),
            'status': row.status,
        })

    db.commit()
    return {
        'package_id': package.id,
        'package_code': package.package_code,
        'created': created,
        'existing': existing_count,
        'sources': sources,
        'note': 'Catalog sync registers discovery evidence only; it never verifies edition match or fetches the file.',
    }
