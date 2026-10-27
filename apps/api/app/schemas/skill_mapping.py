from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class SkillProposal(BaseModel):
    model_config = ConfigDict(extra='forbid')

    name_ar: str = Field(min_length=4, max_length=220)
    domain: str = Field(pattern=r'^[A-Z][A-Z0-9_]{1,39}$')
    measurable_outcome_ar: str = Field(min_length=8, max_length=360)
    description_ar: str | None = Field(default=None, max_length=600)
    mastery_threshold: float = Field(default=0.8, ge=0.5, le=0.98)
    importance: float = Field(default=1.0, ge=0.1, le=2.0)
    source_chunk_ids: list[int] = Field(min_length=1, max_length=8)


class SkillMappingPayload(BaseModel):
    model_config = ConfigDict(extra='forbid')

    skills: list[SkillProposal] = Field(min_length=1, max_length=20)


class SkillApprovalRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')

    proposal_indices: list[int] = Field(min_length=1, max_length=20)
