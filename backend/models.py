from pydantic import BaseModel, Field, EmailStr, ConfigDict, BeforeValidator
from typing import List, Dict, Any, Optional, Annotated
from datetime import datetime, timezone
from bson import ObjectId

# Helper for MongoDB ObjectId
PyObjectId = Annotated[str, BeforeValidator(str)]

# Base Model with MongoDB support
class MongoBaseModel(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )

# Profile sub-model (embedded in User)
class ProfileDetails(BaseModel):
    name: str = ""
    age: int = 18
    education: str = ""
    skills: List[str] = []
    experience: int = 0  # years
    region: str = ""
    target_career: str = ""

# ── Auth request models ──────────────────────────────────────
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: str  # learner, trainer, policymaker

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    role: Optional[str] = None  # learner, trainer, policymaker

# ── Unified User model (single collection) ───────────────────
class User(MongoBaseModel):
    user_id: str
    email: EmailStr
    hashed_password: str
    role: str
    first_login: bool = True
    profile: ProfileDetails = Field(default_factory=ProfileDetails)

    # Learner-specific fields
    nsqf_level: int = 0
    courses_enrolled: List[str] = []
    course_progress: Dict[str, int] = {}
    learning_path: List[Any] = []
    certifications: List[Any] = []
    skill_gap_analysis: Dict[str, Any] = {}

    # Trainer-specific fields
    assigned_learners: List[str] = []
    courses_created: List[str] = []

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserResponse(BaseModel):
    user_id: str
    email: EmailStr
    role: str
    first_login: bool
    created_at: datetime

# ── Course models ─────────────────────────────────────────────
class Module(BaseModel):
    module_id: str
    title: str
    description: str
    duration_hours: int
    content: List[str] = []
    assessments: List[str] = []
    video_url: Optional[str] = None
    pdf_resources: List[str] = []
    assignments: List[str] = []
    completed_by: List[str] = []

class CourseCreate(BaseModel):
    course_id: str
    title: str
    description: str
    nsqf_level: int
    trainer_id: str
    modules: List[Module] = []
    prerequisites: List[str] = []
    status: str = "draft"
    domain_tags: List[str] = []
    difficulty_level: str = "Beginner"

class Question(BaseModel):
    question_id: str
    text: str
    question_type: str = "mcq"  # mcq, true_false, short_answer, coding
    options: List[str] = []
    correct_option: Optional[int] = None  # Index of correct option (0-3) for mcq
    correct_answer: Optional[str] = None  # Text for descriptive/short answer

class Assessment(MongoBaseModel):
    assessment_id: str
    course_id: str
    title: str
    description: str
    questions: List[Question]
    passing_score: int = 60
    retake_limit: int = 1
    time_duration_minutes: int = 60
    deadline: Optional[datetime] = None
    randomize_questions: bool = False
    shuffle_options: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AssessmentSubmission(MongoBaseModel):
    submission_id: str
    assessment_id: str
    learner_id: str
    course_id: str
    score: int
    passed: bool
    answers: Dict[str, Any] = {}
    grading_status: str = "auto_graded"  # auto_graded, pending_manual_grade
    submitted_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Course(MongoBaseModel):
    course_id: str
    title: str
    description: str
    nsqf_level: int
    trainer_id: str
    modules: List[Module]
    prerequisites: List[str]
    skills_gained: List[str] = []
    enrolled_learners: List[str] = []
    assessments: List[str] = []  # List of assessment_ids
    completion_rate: float = 0.0
    status: str = "draft"
    domain_tags: List[str] = []
    difficulty_level: str = "Beginner"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ── Certification models ─────────────────────────────────────
class CertificationCreate(BaseModel):
    certification_id: str
    learner_id: str
    course_id: str
    nsqf_level: int

class Certification(MongoBaseModel):
    certification_id: str
    learner_id: str
    course_id: str
    nsqf_level: int
    issued_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: str = "issued"  # issued, revoked, expired

# ── JWT Token model ───────────────────────────────────────────
class Token(BaseModel):
    access_token: str
    token_type: str
    user_data: UserResponse

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

# ── API Response models ───────────────────────────────────────
class APIResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )

class NSQFCalculationRequest(BaseModel):
    profile_details: ProfileDetails

class NSQFCalculationResponse(BaseModel):
    nsqf_level: int
    reasoning: str
    recommendations: List[str]
