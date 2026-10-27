from typing import Literal
from pydantic import BaseModel, ConfigDict, Field


BlockType = Literal['TEXT','INFO_CARD','IMAGE','AUDIO','VIDEO','MATCHING','DRAG_DROP','QUESTION','FLASHCARD','SUMMARY','ACTIVITY']
QuestionPurpose = Literal['DIAGNOSTIC','PRACTICE','MASTERY','REMEDIATION','RETENTION','TRANSFER']


class StrictGeneratedModel(BaseModel):
    model_config = ConfigDict(extra='forbid')


class GeneratedBlock(StrictGeneratedModel):
    block_type: BlockType
    title: str | None = None
    body: str | None = None
    content: dict = Field(default_factory=dict)
    source_chunk_ids: list[int] = Field(min_length=1, max_length=12)


class GeneratedSection(StrictGeneratedModel):
    title: str
    learning_goal: str | None = None
    blocks: list[GeneratedBlock] = Field(min_length=1, max_length=20)


class GeneratedQuestion(StrictGeneratedModel):
    question_type: str = 'MCQ'
    prompt: str
    options: list[str] | None = None
    correct_answer: str | int | float | list | dict
    explanation: str
    purpose: QuestionPurpose = 'PRACTICE'
    difficulty: float = Field(default=0.5, ge=0, le=1)
    skill_codes: list[str] = Field(min_length=1, max_length=6)
    source_chunk_ids: list[int] = Field(min_length=1, max_length=12)


class GeneratedSummaryItem(StrictGeneratedModel):
    text: str
    source_chunk_ids: list[int] = Field(min_length=1, max_length=12)


class GeneratedFlashcard(StrictGeneratedModel):
    front: str
    back: str
    source_chunk_ids: list[int] = Field(min_length=1, max_length=12)


class GeneratedMisconception(StrictGeneratedModel):
    title: str
    incorrect_idea: str
    correction: str
    skill_codes: list[str] = Field(min_length=1, max_length=6)
    source_chunk_ids: list[int] = Field(min_length=1, max_length=12)


class GeneratedRemediationCandidate(StrictGeneratedModel):
    title: str
    trigger: str
    explanation: str
    practice_prompt: str
    mastery_check: str
    skill_codes: list[str] = Field(min_length=1, max_length=6)
    source_chunk_ids: list[int] = Field(min_length=1, max_length=12)


class GeneratedLessonPayload(StrictGeneratedModel):
    learning_objectives: list[str] = Field(min_length=1, max_length=20)
    concepts: list[str] = Field(min_length=1, max_length=40)
    sections: list[GeneratedSection] = Field(min_length=1, max_length=20)
    questions: list[GeneratedQuestion] = Field(default_factory=list, max_length=120)
    summary: list[GeneratedSummaryItem] = Field(min_length=1, max_length=20)
    flashcards: list[GeneratedFlashcard] = Field(default_factory=list, max_length=60)
    misconceptions: list[GeneratedMisconception] = Field(default_factory=list, max_length=40)
    remediation_candidates: list[GeneratedRemediationCandidate] = Field(default_factory=list, max_length=40)
