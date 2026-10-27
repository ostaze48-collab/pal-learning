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
        if self.block_type == 'IMAGE':
            alt_text = self.content.get('alt_text')
            asset_kind = self.content.get('asset_kind')
            rights_status = self.content.get('rights_status')
            source_page = self.content.get('source_page')
            source_label = self.content.get('source_label')
            src = self.content.get('src')
            hotspots = self.content.get('hotspots', [])

            if not isinstance(alt_text, str) or not alt_text.strip():
                raise ValueError('IMAGE content.alt_text must be a non-empty string')
            if asset_kind not in {'TEXTBOOK_FIGURE','TEXTBOOK_PAGE_CROP','REDRAWN_DIAGRAM','PLATFORM_ILLUSTRATION'}:
                raise ValueError('IMAGE content.asset_kind is invalid')
            if rights_status not in {'CLEARED','REVIEW_REQUIRED','REDRAW_REQUIRED'}:
                raise ValueError('IMAGE content.rights_status is invalid')
            if not isinstance(source_label, str) or not source_label.strip():
                raise ValueError('IMAGE content.source_label must identify the source')
            if not isinstance(source_page, int) or source_page < 1:
                raise ValueError('IMAGE content.source_page must be a positive integer')
            if rights_status != 'REDRAW_REQUIRED' and (not isinstance(src, str) or not src.strip()):
                raise ValueError('IMAGE content.src is required unless the original must be redrawn')
            if not isinstance(hotspots, list):
                raise ValueError('IMAGE content.hotspots must be an array')
            hotspot_ids: list[str] = []
            for hotspot in hotspots:
                if not isinstance(hotspot, dict):
                    raise ValueError('IMAGE hotspots must be objects')
                hotspot_id = hotspot.get('id')
                label = hotspot.get('label')
                x = hotspot.get('x')
                y = hotspot.get('y')
                if not isinstance(hotspot_id, str) or not hotspot_id.strip():
                    raise ValueError('IMAGE hotspot.id must be a non-empty string')
                if not isinstance(label, str) or not label.strip():
                    raise ValueError('IMAGE hotspot.label must be a non-empty string')
                if not isinstance(x, (int, float)) or not 0 <= x <= 100:
                    raise ValueError('IMAGE hotspot.x must be between 0 and 100')
                if not isinstance(y, (int, float)) or not 0 <= y <= 100:
                    raise ValueError('IMAGE hotspot.y must be between 0 and 100')
                hotspot_ids.append(hotspot_id)
            if len(set(hotspot_ids)) != len(hotspot_ids):
                raise ValueError('IMAGE hotspot ids must be unique')

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
