from __future__ import annotations

from dataclasses import dataclass, asdict


AUTHORITY_CAPABILITIES = (
    'factual_grounding',
    'current_scope_evidence',
    'answer_validation',
    'pedagogy_guidance',
    'assessment_style',
    'remediation_support',
    'enrichment_only',
)


@dataclass(frozen=True)
class SourceAuthority:
    factual_grounding: bool = False
    current_scope_evidence: bool = False
    answer_validation: bool = False
    pedagogy_guidance: bool = False
    assessment_style: bool = False
    remediation_support: bool = False
    enrichment_only: bool = False


SOURCE_AUTHORITY_POLICY: dict[str, SourceAuthority] = {
    'OFFICIAL_PACKAGE': SourceAuthority(
        factual_grounding=True,
        current_scope_evidence=True,
        assessment_style=True,
    ),
    'STUDENT_BOOK': SourceAuthority(
        factual_grounding=True,
        assessment_style=True,
    ),
    'SOLUTIONS': SourceAuthority(
        answer_validation=True,
        assessment_style=True,
    ),
    'TEACHER_GUIDE': SourceAuthority(
        pedagogy_guidance=True,
        assessment_style=True,
        remediation_support=True,
    ),
    'WORKSHEET': SourceAuthority(
        assessment_style=True,
        remediation_support=True,
    ),
    'EXAM': SourceAuthority(
        assessment_style=True,
    ),
    'REMEDIAL': SourceAuthority(
        remediation_support=True,
    ),
    'INTERACTIVE': SourceAuthority(
        enrichment_only=True,
    ),
    'VIDEO_REFERENCE': SourceAuthority(
        enrichment_only=True,
    ),
    'CURRICULUM_PLAN': SourceAuthority(
        current_scope_evidence=True,
    ),
    # Catalog discovery proves authority at a broad grade/subject level only.
    # It has no downstream authority until scope verification promotes it.
    'CATALOG_CANDIDATE': SourceAuthority(),
}


def source_authority(source_type: str | None) -> SourceAuthority:
    # Unknown source types are intentionally fail-closed.
    return SOURCE_AUTHORITY_POLICY.get(source_type or '', SourceAuthority())


def source_allows(source_type: str | None, capability: str) -> bool:
    if capability not in AUTHORITY_CAPABILITIES:
        return False
    return bool(getattr(source_authority(source_type), capability, False))


def allowed_source_types(capability: str) -> set[str]:
    if capability not in AUTHORITY_CAPABILITIES:
        return set()
    return {
        source_type
        for source_type, authority in SOURCE_AUTHORITY_POLICY.items()
        if bool(getattr(authority, capability, False))
    }


def can_ground_facts(source_type: str | None) -> bool:
    return source_allows(source_type, 'factual_grounding')


def can_prove_current_scope(source_type: str | None) -> bool:
    return source_allows(source_type, 'current_scope_evidence')


def can_validate_answers(source_type: str | None) -> bool:
    return source_allows(source_type, 'answer_validation')


def public_source_policy() -> dict[str, dict]:
    return {
        key: {
            'source_type': key,
            **asdict(value),
        }
        for key, value in SOURCE_AUTHORITY_POLICY.items()
    }
