from pydantic import BaseModel, Field


class SourceFileCreate(BaseModel):
    source_type: str
    source_url: str | None = None
    file_key: str | None = None
    original_filename: str | None = None
    edition: str | None = None
    page_count: int | None = None
    reliability_score: float = Field(default=0, ge=0, le=100)
    edition_match_score: float = Field(default=0, ge=0, le=100)


class SourcePackageCreate(BaseModel):
    book_id: int
    package_code: str


class AIJobCreate(BaseModel):
    job_type: str
    source_type: str | None = None
    source_id: int | None = None
    priority: int = 100
    model_route: str = 'BALANCED'
    prompt_version: str | None = None
