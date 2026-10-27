from pydantic import BaseModel, ConfigDict, Field


class AttemptCreate(BaseModel):
    model_config = ConfigDict(extra='forbid')
    answer: str | int | float | list | dict | None = None
    response_time_ms: int | None = Field(default=None, ge=0)
    used_hint: bool = False
    used_ai_help: bool = False


class DiagnosticStart(BaseModel):
    model_config = ConfigDict(extra='forbid')
    target_skill_id: int


class LearningEventCreate(BaseModel):
    model_config = ConfigDict(extra='forbid')
    event_uuid: str
    event_type: str
    lesson_id: int | None = None
    skill_id: int | None = None
    question_id: int | None = None
    metadata: dict | None = None
    device_id: str | None = None


class SyncEvent(BaseModel):
    model_config = ConfigDict(extra='forbid')
    event_uuid: str
    event_type: str
    lesson_id: int | None = None
    skill_id: int | None = None
    question_id: int | None = None
    metadata: dict | None = None
    device_id: str | None = None


class SyncBatch(BaseModel):
    model_config = ConfigDict(extra='forbid')
    events: list[SyncEvent] = Field(default_factory=list, max_length=500)
