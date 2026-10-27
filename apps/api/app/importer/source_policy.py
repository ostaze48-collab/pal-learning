from __future__ import annotations

from dataclasses import dataclass, asdict


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
    'CATALOG_CANDIDATE': SourceAuthority(),
}


def source_authority(source_type: str | None) -> SourceAuthority:
    return SOURCE_AUTHORITY_POLICY.get(source_type or '', SourceAuthority())


def can_ground_facts(source_type: str | None) -> bool:
    return source_authority(source_type).factual_grounding


def can_prove_current_scope(source_type: str | None) -> bool:
    return source_authority(source_type).current_scope_evidence


def public_source_policy() -> dict[str, dict]:
    return {key: asdict(value) for key, value in SOURCE_AUTHORITY_POLICY.items()}
