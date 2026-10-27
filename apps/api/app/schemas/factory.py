from typing import Literal
from pydantic import BaseModel, ConfigDict, Field, model_validator


BlockType = Literal[
    'TEXT','INFO_CARD','IMAGE','AUDIO','VIDEO','MATCHING','DRAG_DROP','QUESTION',
    'FLASHCARD','SUMMARY','ACTIVITY','CLASSIFY','COMPARE_GRID'
]
QuestionPurpose = Literal['DIAGNOSTIC','PRACTICE','MASTERY','REMEDIATION','RETENTION','TRANSFER']


class StrictGeneratedModel(BaseModel):
    model_config = ConfigDict(extra='forbid')


class GeneratedBlock(StrictGeneratedModel):
    block_type: BlockType
    title: str | None = None
    body: str | None = None
    content: dict = Field(default_factory=dict)
    source_chunk_ids: list[int] = Field(min_length=1, max_length=12)

    @model_validator(mode='after')
    def validate_interactive_content(self):
        if self.block_type == 'CLASSIFY':
            categories = self.content.get('categories')
            items = self.content.get('items')
            if not isinstance(categories, list) or not categories:
                raise ValueError('CLASSIFY content.categories must be a non-empty array')
            if not isinstance(items, list) or not items:
                raise ValueError('CLASSIFY content.items must be a non-empty array')

            category_ids: list[str] = []
            for category in categories:
                if not isinstance(category, dict):
                    raise ValueError('CLASSIFY categories must be objects')
                category_id = category.get('id')
                label = category.get('label')
                if not isinstance(category_id, str) or not category_id.strip():
                    raise ValueError('CLASSIFY category.id must be a non-empty string')
                if not isinstance(label, str) or not label.strip():
                    raise ValueError('CLASSIFY category.label must be a non-empty string')
                category_ids.append(category_id)
            if len(set(category_ids)) != len(category_ids):
                raise ValueError('CLASSIFY category ids must be unique')

            item_ids: list[str] = []
            allowed_categories = set(category_ids)
            for item in items:
                if not isinstance(item, dict):
                    raise ValueError('CLASSIFY items must be objects')
                item_id = item.get('id')
                label = item.get('label')
                category_id = item.get('category_id')
                if not isinstance(item_id, str) or not item_id.strip():
                    raise ValueError('CLASSIFY item.id must be a non-empty string')
                if not isinstance(label, str) or not label.strip():
                    raise ValueError('CLASSIFY item.label must be a non-empty string')
                if category_id not in allowed_categories:
                    raise ValueError('CLASSIFY item.category_id must reference a declared category')
                item_ids.append(item_id)
            if len(set(item_ids)) != len(item_ids):
                raise ValueError('CLASSIFY item ids must be unique')

        if self.block_type == 'COMPARE_GRID':
            columns = self.content.get('columns')
            rows = self.content.get('rows')
            if not isinstance(columns, list) or len(columns) < 2:
                raise ValueError('COMPARE_GRID content.columns must contain at least two columns')
            if not isinstance(rows, list) or not rows:
                raise ValueError('COMPARE_GRID content.rows must be a non-empty array')

            column_ids: list[str] = []
            for column in columns:
                if not isinstance(column, dict):
                    raise ValueError('COMPARE_GRID columns must be objects')
                column_id = column.get('id')
                label = column.get('label')
                if not isinstance(column_id, str) or not column_id.strip():
                    raise ValueError('COMPARE_GRID column.id must be a non-empty string')
                if not isinstance(label, str) or not label.strip():
                    raise ValueError('COMPARE_GRID column.label must be a non-empty string')
                column_ids.append(column_id)
            if len(set(column_ids)) != len(column_ids):
                raise ValueError('COMPARE_GRID column ids must be unique')

            required_columns = set(column_ids)
            for row in rows:
                if not isinstance(row, dict) or not isinstance(row.get('label'), str) or not row.get('label', '').strip():
                    raise ValueError('COMPARE_GRID row.label must be a non-empty string')
                values = row.get('values')
                if not isinstance(values, dict):
                    raise ValueError('COMPARE_GRID row.values must be an object')
                if set(values) != required_columns:
                    raise ValueError('COMPARE_GRID row.values must contain exactly all declared column ids')
                if any(not isinstance(value, str) for value in values.values()):
                    raise ValueError('COMPARE_GRID values must be strings')
        return self


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
