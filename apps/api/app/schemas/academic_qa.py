from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class StrictAcademicModel(BaseModel):
    model_config = ConfigDict(extra='forbid')


Severity = Literal['INFO', 'WARNING', 'ERROR', 'CRITICAL']
Recommendation = Literal['PASS', 'REVIEW', 'BLOCK']


class AcademicQAIssue(StrictAcademicModel):
    code: str
    severity: Severity
    category: str
    message: str
    source_chunk_ids: list[int] = Field(default_factory=list, max_length=12)


class AcademicQAResult(StrictAcademicModel):
    errors: list[AcademicQAIssue] = Field(default_factory=list, max_length=100)
    conflicts: list[AcademicQAIssue] = Field(default_factory=list, max_length=100)
    unsupported_claims: list[AcademicQAIssue] = Field(default_factory=list, max_length=100)
    question_issues: list[AcademicQAIssue] = Field(default_factory=list, max_length=120)
    age_appropriateness_issues: list[AcademicQAIssue] = Field(default_factory=list, max_length=100)
    confidence: float = Field(ge=0, le=100)
    recommendation: Recommendation
    summary: str = Field(min_length=1, max_length=4000)
