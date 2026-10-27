from pydantic import BaseModel, Field

EMAIL_PATTERN = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'


class LoginRequest(BaseModel):
    email: str = Field(min_length=5, max_length=255, pattern=EMAIL_PATTERN)
    password: str = Field(min_length=8, max_length=200)


class StudentRegisterRequest(BaseModel):
    email: str = Field(min_length=5, max_length=255, pattern=EMAIL_PATTERN)
    password: str = Field(min_length=8, max_length=200)
    display_name: str = Field(min_length=1, max_length=120)
    grade_id: int
