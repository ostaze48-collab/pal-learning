from __future__ import annotations

from dataclasses import asdict, dataclass

from fastapi import APIRouter, Depends

from ..auth.deps import require_admin

router = APIRouter(
    prefix='/importer/discovery-catalog',
    tags=['curriculum-source-discovery'],
    dependencies=[Depends(require_admin)],
)


@dataclass(frozen=True)
class SourceDiscoveryEntry:
    source_code: str
    package_code: str
    intended_source_type: str
    title: str
    grade_code: str
    subject_code: str
    semester: int
    academic_year: str
    discovery_url: str
    corroboration_urls: tuple[str, ...]
    discovery_kind: str
    authority_claim: str
    file_verified: bool
    ingestion_mode: str
    discovered_on: str
    notes: str


SOURCE_DISCOVERY_CATALOG: tuple[SourceDiscoveryEntry, ...] = (
    SourceDiscoveryEntry(
        source_code='PS.G05.SCI.S2.PLAN.2025_2026.DISCOVERY',
        package_code='PS-G05-SCI-S2-2026',
        intended_source_type='CURRICULUM_PLAN',
        title='خطة العلوم والحياة للصف الخامس الأساسي — الفصل الثاني — 2025/2026 — طوارئ',
        grade_code='G05',
        subject_code='SCI',
        semester=2,
        academic_year='2025/2026',
        discovery_url='https://www.wepal.net/lms.resourceItemShow.115050',
        corroboration_urls=(
            'https://www.wepal.net/lms.subjectContext?level_id=5&semester_id=2&subject_id=4',
            'https://paledue.com/%D8%AE%D8%B7%D8%B7-%D8%A7%D9%84%D9%88%D8%B2%D8%A7%D8%B1%D8%A9-%D8%A7%D9%84%D8%AC%D8%AF%D9%8A%D8%AF%D8%A9-2026-%D9%84%D9%83%D8%A7%D9%81%D8%A9-%D8%A7%D9%84%D9%85%D8%A8%D8%A7%D8%AD%D8%AB-%D8%A7%D9%84/',
        ),
        discovery_kind='SECONDARY_INDEX',
        authority_claim='REPORTED_AS_MINISTRY_PLAN_BY_SECONDARY_EDUCATION_INDEXES',
        file_verified=False,
        ingestion_mode='UPLOAD_REQUIRED',
        discovered_on='2026-10-27',
        notes=(
            'Discovery evidence only. Do not create SourceFile, curriculum-plan scope links, '
            'edition evidence, or coverage from this entry. Obtain the actual plan file, upload '
            'it through the CURRICULUM_PLAN route, extract text, then verify the target unit and lesson.'
        ),
    ),
)


def discoveries_for_package(package_code: str) -> list[SourceDiscoveryEntry]:
    return [item for item in SOURCE_DISCOVERY_CATALOG if item.package_code == package_code]


@router.get('')
def list_source_discoveries(package_code: str | None = None):
    rows = SOURCE_DISCOVERY_CATALOG
    if package_code:
        rows = tuple(item for item in rows if item.package_code == package_code)
    return {
        'catalog_version': 'source-discovery/v1',
        'entries': [asdict(item) for item in rows],
        'policy': {
            'creates_source_files': False,
            'adds_package_coverage': False,
            'authorizes_generation': False,
            'required_next_step': 'OBTAIN_AND_UPLOAD_ACTUAL_FILE',
        },
    }
