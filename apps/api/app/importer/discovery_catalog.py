from __future__ import annotations

from dataclasses import asdict, dataclass

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth.deps import require_admin
from ..db.deps import get_db
from ..db.models import SourceFile, SourcePackage

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
    reliability_score: float = 70.0
    edition_claim: str = 'edition-to-verify'


S1_WORKSHEET_URL = (
    'https://elearnps.blob.core.windows.net/public/ElearnPs/worksheets2_10_2024/5/'
    '%D8%A7%D9%84%D8%B9%D9%84%D9%88%D9%85%20%D9%88%D8%A7%D9%84%D8%AD%D9%8A%D8%A7%D8%A9/'
    '%D8%A7%D9%84%D8%B5%D9%81-5-%20%D8%A7%D9%84%D8%B9%D9%84%D9%88%D9%85-%20%D8%A7%D9%84%D9%85%D8%AC%D9%87%D8%B1%20'
    '%D9%88%D8%A7%D9%83%D8%AA%D8%B4%D8%A7%D9%81%20%D8%A7%D9%84%D8%AE%D9%84%D9%8A%D8%A9-%D8%A7%D9%84%D9%88%D8%AD%D8%AF%D8%A9%201-%D8%A7%D9%84%D9%81%D8%B5%D9%84%201.pdf'
)

S1_LESSON2_WORKSHEET_URL = (
    'https://elearnps.blob.core.windows.net/public/ElearnPs/worksheets2_10_2024/5/'
    '%D8%A7%D9%84%D8%B9%D9%84%D9%88%D9%85%20%D9%88%D8%A7%D9%84%D8%AD%D9%8A%D8%A7%D8%A9/'
    '%D8%A7%D9%84%D8%B5%D9%81-5-%20%D8%A7%D9%84%D8%B9%D9%84%D9%88%D9%85-%20%D8%A7%D9%84%D8%AE%D9%84%D9%8A%D8%A9%20'
    '%D9%88%D8%A3%D9%86%D9%88%D8%A7%D8%B9%D9%87%D8%A7-%D8%A7%D9%84%D9%88%D8%AD%D8%AF%D8%A9%201-%D8%A7%D9%84%D9%81%D8%B5%D9%84%201.pdf'
)

S1_TEACHER_GUIDE_URL = 'https://elearnps.blob.core.windows.net/public/TeacherGuides/Dal5/Daleel%20Oloom05Book.pdf'


SOURCE_DISCOVERY_CATALOG: tuple[SourceDiscoveryEntry, ...] = (
    SourceDiscoveryEntry(
        source_code='PS.G05.SCI.S1.STUDENT_BOOK.2020.DISCOVERY',
        package_code='PS-G05-SCI-S1-2026',
        intended_source_type='STUDENT_BOOK',
        title='كتاب العلوم والحياة للصف الخامس — الفصل الأول — الطبعة الثالثة 2020',
        grade_code='G05',
        subject_code='SCI',
        semester=1,
        academic_year='2020/2021',
        discovery_url='https://www.wepal.net/lms.resourceItemShow.100074',
        corroboration_urls=(
            'https://www.sh-pal.com/2018/12/2018-2019_74.html',
            'https://www.wepal.net/library/?app=content.show.74',
        ),
        discovery_kind='SECONDARY_INDEX',
        authority_claim='PALESTINIAN_CURRICULUM_TEXTBOOK_2020_INDEXED_BY_EDUCATION_LIBRARIES',
        file_verified=False,
        ingestion_mode='UPLOAD_REQUIRED',
        discovered_on='2026-10-27',
        notes=(
            'Historical factual textbook reference. Obtain the actual PDF before use. '
            'It must never be treated as current scope evidence by itself.'
        ),
        reliability_score=80.0,
        edition_claim='third edition 2020 historical factual reference',
    ),
    SourceDiscoveryEntry(
        source_code='PS.G05.SCI.S1.PLAN.2025.DISCOVERY',
        package_code='PS-G05-SCI-S1-2026',
        intended_source_type='CURRICULUM_PLAN',
        title='خطة مادة العلوم للصف الخامس — الفصل الأول — برنامج الطوارئ 2025',
        grade_code='G05',
        subject_code='SCI',
        semester=1,
        academic_year='2025',
        discovery_url='https://www.wepal.net/lms.resourceItemShow.114939',
        corroboration_urls=(
            'https://www.wepal.net/lms.resourceItems?context_id=44',
            'https://www.wepal.net/lms.resourceList?level_id=5',
            'https://www.wepal.net/library/?app=content.list&level=5&semester=1&subject=6&submit=submit&type=3',
        ),
        discovery_kind='SECONDARY_INDEX',
        authority_claim='REPORTED_AS_2025_EMERGENCY_SCIENCE_PLAN_BY_PALESTINIAN_EDUCATION_LIBRARY',
        file_verified=False,
        ingestion_mode='UPLOAD_REQUIRED',
        discovered_on='2026-10-27',
        notes=(
            'Current-scope discovery evidence only. The resource is indexed inside Grade 5 / Semester 1 / Science, '
            'but the actual attachment has not yet been fetched and text-verified. Do not create current-scope links, '
            'coverage, edition evidence, or generation authority from this catalog entry. Obtain the attachment, upload '
            'it as CURRICULUM_PLAN, extract text, then verify the target lesson scope explicitly.'
        ),
        reliability_score=75.0,
        edition_claim='2025 emergency curriculum plan; attachment and scope to verify',
    ),
    SourceDiscoveryEntry(
        source_code='PS.G05.SCI.S1.U01.L01.WORKSHEET.2024.OFFICIAL',
        package_code='PS-G05-SCI-S1-2026',
        intended_source_type='WORKSHEET',
        title='ورقة عمل رسمية — المجهر واكتشاف الخلية — الصف الخامس — الفصل الأول',
        grade_code='G05',
        subject_code='SCI',
        semester=1,
        academic_year='2024',
        discovery_url=S1_WORKSHEET_URL,
        corroboration_urls=('https://elearn.edu.ps/worksheets/',),
        discovery_kind='OFFICIAL_DIRECT_FILE',
        authority_claim='PALESTINIAN_EDUCATION_PORTAL',
        file_verified=True,
        ingestion_mode='REMOTE_FETCH_ALLOWED',
        discovered_on='2026-10-27',
        notes=(
            'Assessment-design reference only. Source Authority Policy does not allow WORKSHEET '
            'content to ground factual lesson claims.'
        ),
        reliability_score=95.0,
        edition_claim='official worksheet 2024; textbook edition not inferred',
    ),
    SourceDiscoveryEntry(
        source_code='PS.G05.SCI.S1.U01.L02.WORKSHEET.2024.OFFICIAL',
        package_code='PS-G05-SCI-S1-2026',
        intended_source_type='WORKSHEET',
        title='ورقة عمل رسمية — الخلية وأنواعها — الصف الخامس — الفصل الأول',
        grade_code='G05',
        subject_code='SCI',
        semester=1,
        academic_year='2024',
        discovery_url=S1_LESSON2_WORKSHEET_URL,
        corroboration_urls=(
            'https://elearn.edu.ps/worksheets/',
            'https://elearn.edu.ps/c5/',
        ),
        discovery_kind='OFFICIAL_DIRECT_FILE',
        authority_claim='PALESTINIAN_EDUCATION_PORTAL',
        file_verified=True,
        ingestion_mode='REMOTE_FETCH_ALLOWED',
        discovered_on='2026-10-27',
        notes=(
            'Lesson-2 assessment and remediation reference only. The direct two-page PDF was verified on the '
            'Palestinian educational portal storage. WORKSHEET authority is intentionally non-factual: this source '
            'may inform question style, comparison/classification practice and remediation, but it must never ground '
            'generated curriculum facts or substitute for the verified current 2026 teaching package.'
        ),
        reliability_score=95.0,
        edition_claim='official worksheet 2024; textbook edition not inferred',
    ),
    SourceDiscoveryEntry(
        source_code='PS.G05.SCI.TEACHER_GUIDE.OFFICIAL',
        package_code='PS-G05-SCI-S1-2026',
        intended_source_type='TEACHER_GUIDE',
        title='دليل معلم العلوم والحياة للصف الخامس',
        grade_code='G05',
        subject_code='SCI',
        semester=1,
        academic_year='historical',
        discovery_url=S1_TEACHER_GUIDE_URL,
        corroboration_urls=(),
        discovery_kind='OFFICIAL_DIRECT_FILE',
        authority_claim='PALESTINIAN_EDUCATION_PORTAL',
        file_verified=True,
        ingestion_mode='REMOTE_FETCH_ALLOWED',
        discovered_on='2026-10-27',
        notes=(
            'Pedagogical guidance only. May inform objectives, sequence and misconceptions; '
            'not factual grounding authority for generated student content.'
        ),
        reliability_score=95.0,
        edition_claim='official historical teacher guide; edition-to-match',
    ),
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


def _entry(source_code: str) -> SourceDiscoveryEntry | None:
    return next((item for item in SOURCE_DISCOVERY_CATALOG if item.source_code == source_code), None)


@router.get('')
def list_source_discoveries(package_code: str | None = None):
    rows = SOURCE_DISCOVERY_CATALOG
    if package_code:
        rows = tuple(item for item in rows if item.package_code == package_code)
    return {
        'catalog_version': 'source-discovery/v4',
        'entries': [asdict(item) for item in rows],
        'policy': {
            'unverified_discovery_creates_source_files': False,
            'verified_direct_file_registration_requires_admin': True,
            'adds_package_coverage_before_fetch': False,
            'authorizes_generation': False,
            'required_next_step': 'REGISTER_VERIFIED_DIRECT_FILE_OR_OBTAIN_AND_UPLOAD_ACTUAL_FILE',
        },
    }


@router.post('/{source_code}/register')
def register_verified_direct_discovery(source_code: str, db: Session = Depends(get_db)):
    entry = _entry(source_code)
    if not entry:
        raise HTTPException(404, 'Discovery source not found')
    if not entry.file_verified or entry.ingestion_mode != 'REMOTE_FETCH_ALLOWED':
        raise HTTPException(409, 'Discovery entry is not a verified direct file and cannot be registered automatically')

    package = db.query(SourcePackage).filter(SourcePackage.package_code == entry.package_code).first()
    if not package:
        raise HTTPException(404, 'Target source package not found')

    row = db.query(SourceFile).filter(
        SourceFile.package_id == package.id,
        SourceFile.source_url == entry.discovery_url,
    ).first()
    created = False
    if not row:
        row = SourceFile(
            package_id=package.id,
            source_type=entry.intended_source_type,
            source_url=entry.discovery_url,
            original_filename=f'{entry.source_code.lower().replace(".", "-")}-direct-source',
            edition=entry.edition_claim,
            reliability_score=entry.reliability_score,
            edition_match_score=0.0,
            status='DISCOVERED',
            extraction_meta={
                'discovery_source_code': entry.source_code,
                'discovery_kind': entry.discovery_kind,
                'authority_claim': entry.authority_claim,
                'file_verified_by_catalog': True,
                'role_note': entry.notes,
            },
        )
        db.add(row)
        db.commit()
        db.refresh(row)
        created = True

    return {
        'source_code': entry.source_code,
        'source_file_id': row.id,
        'package_id': package.id,
        'source_type': row.source_type,
        'source_url': row.source_url,
        'status': row.status,
        'created': created,
        'next_action': f'POST /importer/source-files/{row.id}/fetch-registered',
        'factual_grounding_authorized': False,
        'note': 'Registration does not verify textbook edition and does not authorize factual generation.',
    }
