from datetime import datetime, UTC
from sqlalchemy import String, Integer, ForeignKey, DateTime, Text, UniqueConstraint, Float, JSON, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from .base import Base


def utcnow():
    return datetime.now(UTC).replace(tzinfo=None)


class User(Base):
    __tablename__ = 'users'
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(Text)
    role: Mapped[str] = mapped_column(String(30), default='STUDENT', index=True)
    status: Mapped[str] = mapped_column(String(30), default='ACTIVE')
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class AuthSession(Base):
    __tablename__ = 'auth_sessions'
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'))
    token_hash: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class Grade(Base):
    __tablename__ = 'grades'
    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(10), unique=True, index=True)
    name_ar: Mapped[str] = mapped_column(String(100))
    order_no: Mapped[int] = mapped_column(Integer)


class Subject(Base):
    __tablename__ = 'subjects'
    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    name_ar: Mapped[str] = mapped_column(String(120))
    name_en: Mapped[str | None] = mapped_column(String(120), nullable=True)


class CurriculumVersion(Base):
    __tablename__ = 'curriculum_versions'
    id: Mapped[int] = mapped_column(primary_key=True)
    country: Mapped[str] = mapped_column(String(80), default='Palestine')
    academic_year: Mapped[str] = mapped_column(String(20))
    edition: Mapped[str] = mapped_column(String(120))
    status: Mapped[str] = mapped_column(String(20), default='ACTIVE')
    source_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)


class Book(Base):
    __tablename__ = 'books'
    id: Mapped[int] = mapped_column(primary_key=True)
    curriculum_version_id: Mapped[int] = mapped_column(ForeignKey('curriculum_versions.id'))
    grade_id: Mapped[int] = mapped_column(ForeignKey('grades.id'))
    subject_id: Mapped[int] = mapped_column(ForeignKey('subjects.id'))
    semester: Mapped[int] = mapped_column(Integer)
    title: Mapped[str] = mapped_column(String(255))
    book_code: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    edition: Mapped[str | None] = mapped_column(String(120), nullable=True)
    source_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(30), default='DRAFT')


class SourcePackage(Base):
    __tablename__ = 'source_packages'
    id: Mapped[int] = mapped_column(primary_key=True)
    book_id: Mapped[int] = mapped_column(ForeignKey('books.id'))
    package_code: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    status: Mapped[str] = mapped_column(String(30), default='DISCOVERED')
    completeness_score: Mapped[float] = mapped_column(Float, default=0.0)
    quality_score: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class SourceFile(Base):
    __tablename__ = 'source_files'
    id: Mapped[int] = mapped_column(primary_key=True)
    package_id: Mapped[int] = mapped_column(ForeignKey('source_packages.id'))
    source_type: Mapped[str] = mapped_column(String(40))
    file_key: Mapped[str | None] = mapped_column(Text, nullable=True)
    source_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    original_filename: Mapped[str | None] = mapped_column(String(255), nullable=True)
    edition: Mapped[str | None] = mapped_column(String(120), nullable=True)
    mime_type: Mapped[str | None] = mapped_column(String(120), nullable=True)
    page_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    reliability_score: Mapped[float] = mapped_column(Float, default=0.0)
    edition_match_score: Mapped[float] = mapped_column(Float, default=0.0)
    checksum: Mapped[str | None] = mapped_column(String(128), nullable=True)
    status: Mapped[str] = mapped_column(String(30), default='PENDING')
    extracted_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    extraction_meta: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class SourceChunk(Base):
    __tablename__ = 'source_chunks'
    id: Mapped[int] = mapped_column(primary_key=True)
    source_file_id: Mapped[int] = mapped_column(ForeignKey('source_files.id'))
    page_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    chunk_index: Mapped[int] = mapped_column(Integer)
    text: Mapped[str] = mapped_column(Text)
    metadata_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    __table_args__ = (UniqueConstraint('source_file_id', 'chunk_index'),)


class Unit(Base):
    __tablename__ = 'units'
    id: Mapped[int] = mapped_column(primary_key=True)
    book_id: Mapped[int] = mapped_column(ForeignKey('books.id'))
    unit_number: Mapped[int] = mapped_column(Integer)
    title: Mapped[str] = mapped_column(String(255))
    order_no: Mapped[int] = mapped_column(Integer)
    __table_args__ = (UniqueConstraint('book_id', 'unit_number'),)


class Lesson(Base):
    __tablename__ = 'lessons'
    id: Mapped[int] = mapped_column(primary_key=True)
    unit_id: Mapped[int] = mapped_column(ForeignKey('units.id'))
    lesson_number: Mapped[int] = mapped_column(Integer)
    lesson_code: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(String(30), default='DRAFT')
    estimated_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)


class LessonSourceLink(Base):
    __tablename__ = 'lesson_source_links'
    id: Mapped[int] = mapped_column(primary_key=True)
    lesson_id: Mapped[int] = mapped_column(ForeignKey('lessons.id'))
    source_chunk_id: Mapped[int] = mapped_column(ForeignKey('source_chunks.id'))
    relation: Mapped[str] = mapped_column(String(40), default='TEACHING_SOURCE')
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    source_method: Mapped[str] = mapped_column(String(40), default='HEURISTIC')
    status: Mapped[str] = mapped_column(String(30), default='CANDIDATE')
    __table_args__ = (UniqueConstraint('lesson_id', 'source_chunk_id', 'relation'),)


class LessonSection(Base):
    __tablename__ = 'lesson_sections'
    id: Mapped[int] = mapped_column(primary_key=True)
    lesson_id: Mapped[int] = mapped_column(ForeignKey('lessons.id'))
    section_number: Mapped[int] = mapped_column(Integer)
    title: Mapped[str] = mapped_column(String(255))
    order_no: Mapped[int] = mapped_column(Integer)
    __table_args__ = (UniqueConstraint('lesson_id', 'section_number'),)


class ContentBlock(Base):
    __tablename__ = 'content_blocks'
    id: Mapped[int] = mapped_column(primary_key=True)
    lesson_section_id: Mapped[int] = mapped_column(ForeignKey('lesson_sections.id'))
    block_type: Mapped[str] = mapped_column(String(40))
    content_json: Mapped[dict] = mapped_column(JSON)
    order_no: Mapped[int] = mapped_column(Integer)
    version: Mapped[int] = mapped_column(Integer, default=1)
    status: Mapped[str] = mapped_column(String(30), default='DRAFT')
    source_refs: Mapped[list | None] = mapped_column(JSON, nullable=True)


class ContentVersion(Base):
    __tablename__ = 'content_versions'
    id: Mapped[int] = mapped_column(primary_key=True)
    lesson_id: Mapped[int] = mapped_column(ForeignKey('lessons.id'))
    version_number: Mapped[str] = mapped_column(String(30))
    status: Mapped[str] = mapped_column(String(30), default='DRAFT')
    generated_by: Mapped[str | None] = mapped_column(String(120), nullable=True)
    prompt_version: Mapped[str | None] = mapped_column(String(80), nullable=True)
    quality_score: Mapped[float] = mapped_column(Float, default=0.0)
    published_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    __table_args__ = (UniqueConstraint('lesson_id', 'version_number'),)


class Skill(Base):
    __tablename__ = 'skills'
    id: Mapped[int] = mapped_column(primary_key=True)
    skill_code: Mapped[str] = mapped_column(String(140), unique=True, index=True)
    subject_id: Mapped[int] = mapped_column(ForeignKey('subjects.id'))
    domain: Mapped[str] = mapped_column(String(120))
    name_ar: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    mastery_threshold: Mapped[float] = mapped_column(Float, default=0.8)
    importance: Mapped[float] = mapped_column(Float, default=1.0)
    status: Mapped[str] = mapped_column(String(30), default='ACTIVE')


class LessonSkill(Base):
    __tablename__ = 'lesson_skills'
    id: Mapped[int] = mapped_column(primary_key=True)
    lesson_id: Mapped[int] = mapped_column(ForeignKey('lessons.id'))
    skill_id: Mapped[int] = mapped_column(ForeignKey('skills.id'))
    relationship: Mapped[str] = mapped_column(String(30), default='TEACHES')
    weight: Mapped[float] = mapped_column(Float, default=1.0)
    __table_args__ = (UniqueConstraint('lesson_id', 'skill_id', 'relationship'),)


class SkillEdge(Base):
    __tablename__ = 'skill_edges'
    id: Mapped[int] = mapped_column(primary_key=True)
    from_skill_id: Mapped[int] = mapped_column(ForeignKey('skills.id'))
    to_skill_id: Mapped[int] = mapped_column(ForeignKey('skills.id'))
    relationship: Mapped[str] = mapped_column(String(30), default='PREREQUISITE')
    confidence: Mapped[float] = mapped_column(Float, default=1.0)
    source_type: Mapped[str] = mapped_column(String(30), default='ADMIN')
    status: Mapped[str] = mapped_column(String(30), default='ACTIVE')
    __table_args__ = (UniqueConstraint('from_skill_id', 'to_skill_id', 'relationship'),)


class Misconception(Base):
    __tablename__ = 'misconceptions'
    id: Mapped[int] = mapped_column(primary_key=True)
    skill_id: Mapped[int] = mapped_column(ForeignKey('skills.id'))
    code: Mapped[str] = mapped_column(String(140), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    remediation_hint: Mapped[str | None] = mapped_column(Text, nullable=True)


class Question(Base):
    __tablename__ = 'questions'
    id: Mapped[int] = mapped_column(primary_key=True)
    lesson_id: Mapped[int | None] = mapped_column(ForeignKey('lessons.id'), nullable=True)
    question_code: Mapped[str] = mapped_column(String(140), unique=True, index=True)
    question_type: Mapped[str] = mapped_column(String(40), default='MCQ')
    prompt: Mapped[str] = mapped_column(Text)
    options_json: Mapped[list | None] = mapped_column(JSON, nullable=True)
    correct_answer_json: Mapped[dict | list | str | int | float | None] = mapped_column(JSON, nullable=True)
    difficulty: Mapped[float] = mapped_column(Float, default=0.5)
    purpose: Mapped[str] = mapped_column(String(30), default='PRACTICE')
    explanation: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(30), default='DRAFT')


class QuestionSkill(Base):
    __tablename__ = 'question_skills'
    id: Mapped[int] = mapped_column(primary_key=True)
    question_id: Mapped[int] = mapped_column(ForeignKey('questions.id'))
    skill_id: Mapped[int] = mapped_column(ForeignKey('skills.id'))
    weight: Mapped[float] = mapped_column(Float, default=1.0)
    __table_args__ = (UniqueConstraint('question_id', 'skill_id'),)


class ReferenceAnswer(Base):
    __tablename__ = 'reference_answers'
    id: Mapped[int] = mapped_column(primary_key=True)
    question_id: Mapped[int] = mapped_column(ForeignKey('questions.id'))
    answer_text: Mapped[str] = mapped_column(Text)
    source_file_id: Mapped[int | None] = mapped_column(ForeignKey('source_files.id'), nullable=True)
    source_page: Mapped[int | None] = mapped_column(Integer, nullable=True)
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    validation_status: Mapped[str] = mapped_column(String(30), default='UNVERIFIED')


class AIJob(Base):
    __tablename__ = 'ai_jobs'
    id: Mapped[int] = mapped_column(primary_key=True)
    job_type: Mapped[str] = mapped_column(String(60), index=True)
    source_type: Mapped[str | None] = mapped_column(String(40), nullable=True)
    source_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(String(30), default='QUEUED', index=True)
    priority: Mapped[int] = mapped_column(Integer, default=100)
    model_route: Mapped[str] = mapped_column(String(30), default='BALANCED')
    prompt_version: Mapped[str | None] = mapped_column(String(60), nullable=True)
    progress: Mapped[int] = mapped_column(Integer, default=0)
    input_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    result_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    started_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class ContentCandidate(Base):
    __tablename__ = 'content_candidates'
    id: Mapped[int] = mapped_column(primary_key=True)
    lesson_id: Mapped[int] = mapped_column(ForeignKey('lessons.id'))
    ai_job_id: Mapped[int | None] = mapped_column(ForeignKey('ai_jobs.id'), nullable=True)
    version_label: Mapped[str] = mapped_column(String(50))
    status: Mapped[str] = mapped_column(String(30), default='DRAFT')
    schema_valid: Mapped[bool] = mapped_column(Boolean, default=False)
    provenance_score: Mapped[float] = mapped_column(Float, default=0.0)
    output_json: Mapped[dict] = mapped_column(JSON)
    validation_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    __table_args__ = (UniqueConstraint('lesson_id', 'version_label'),)


class QAResult(Base):
    __tablename__ = 'qa_results'
    id: Mapped[int] = mapped_column(primary_key=True)
    lesson_id: Mapped[int] = mapped_column(ForeignKey('lessons.id'))
    overall_score: Mapped[float] = mapped_column(Float)
    source_alignment_score: Mapped[float] = mapped_column(Float)
    skill_coverage_score: Mapped[float] = mapped_column(Float)
    question_quality_score: Mapped[float] = mapped_column(Float)
    answer_validation_score: Mapped[float] = mapped_column(Float)
    details_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    status: Mapped[str] = mapped_column(String(30), default='REVIEW')
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class StudentProfile(Base):
    __tablename__ = 'student_profiles'
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey('users.id'), unique=True, nullable=True)
    display_name: Mapped[str] = mapped_column(String(120))
    registered_grade_id: Mapped[int] = mapped_column(ForeignKey('grades.id'))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class QuestionAttempt(Base):
    __tablename__ = 'question_attempts'
    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey('student_profiles.id'))
    question_id: Mapped[int] = mapped_column(ForeignKey('questions.id'))
    answer_json: Mapped[dict | list | str | int | float | None] = mapped_column(JSON, nullable=True)
    is_correct: Mapped[bool] = mapped_column(Boolean, default=False)
    attempt_number: Mapped[int] = mapped_column(Integer, default=1)
    response_time_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    used_hint: Mapped[bool] = mapped_column(Boolean, default=False)
    used_ai_help: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class StudentSkillMastery(Base):
    __tablename__ = 'student_skill_mastery'
    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey('student_profiles.id'))
    skill_id: Mapped[int] = mapped_column(ForeignKey('skills.id'))
    mastery_score: Mapped[float] = mapped_column(Float, default=0.0)
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[str] = mapped_column(String(30), default='NOT_ASSESSED')
    evidence_count: Mapped[int] = mapped_column(Integer, default=0)
    last_assessed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    next_retention_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    __table_args__ = (UniqueConstraint('student_id', 'skill_id'),)


class DiagnosticSession(Base):
    __tablename__ = 'diagnostic_sessions'
    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey('student_profiles.id'))
    target_skill_id: Mapped[int] = mapped_column(ForeignKey('skills.id'))
    current_skill_id: Mapped[int] = mapped_column(ForeignKey('skills.id'))
    status: Mapped[str] = mapped_column(String(30), default='ACTIVE')
    root_gap_skill_id: Mapped[int | None] = mapped_column(ForeignKey('skills.id'), nullable=True)
    trace_json: Mapped[list | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class RemediationUnit(Base):
    __tablename__ = 'remediation_units'
    id: Mapped[int] = mapped_column(primary_key=True)
    skill_id: Mapped[int] = mapped_column(ForeignKey('skills.id'))
    title: Mapped[str] = mapped_column(String(255))
    estimated_minutes: Mapped[int] = mapped_column(Integer, default=7)
    content_json: Mapped[dict] = mapped_column(JSON)
    status: Mapped[str] = mapped_column(String(30), default='DRAFT')
    version: Mapped[int] = mapped_column(Integer, default=1)


class ContentImprovementTask(Base):
    __tablename__ = 'content_improvement_tasks'
    id: Mapped[int] = mapped_column(primary_key=True)
    skill_id: Mapped[int | None] = mapped_column(ForeignKey('skills.id'), nullable=True)
    lesson_id: Mapped[int | None] = mapped_column(ForeignKey('lessons.id'), nullable=True)
    priority_score: Mapped[float] = mapped_column(Float, default=0.0)
    reason_json: Mapped[dict] = mapped_column(JSON)
    status: Mapped[str] = mapped_column(String(30), default='OPEN')
    suggested_action: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class LearningEvent(Base):
    __tablename__ = 'learning_events'
    id: Mapped[int] = mapped_column(primary_key=True)
    event_uuid: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    student_id: Mapped[int] = mapped_column(ForeignKey('student_profiles.id'))
    event_type: Mapped[str] = mapped_column(String(60), index=True)
    lesson_id: Mapped[int | None] = mapped_column(ForeignKey('lessons.id'), nullable=True)
    skill_id: Mapped[int | None] = mapped_column(ForeignKey('skills.id'), nullable=True)
    question_id: Mapped[int | None] = mapped_column(ForeignKey('questions.id'), nullable=True)
    metadata_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    client_timestamp: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    server_timestamp: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    device_id: Mapped[str | None] = mapped_column(String(120), nullable=True)
