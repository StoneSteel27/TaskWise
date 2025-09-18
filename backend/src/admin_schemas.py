from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date
from src.auth.models import UserRole
from src.attendance.models import AttendanceStatusEnum
from src.tasks.models import TaskStatus
from src.schedules.models import DayOfWeek

# --- User Admin Schemas ---
class UserAdminCreate(BaseModel):
    roll_number: str = Field(..., description="Unique Roll Number or ID")
    password: str = Field(..., min_length=8, description="User's password")
    name: str
    role: UserRole
    classroom: Optional[str] = None

class UserAdminUpdate(BaseModel):
    password: Optional[str] = Field(None, min_length=8, description="Leave blank to keep current password")
    name: Optional[str] = None
    role: Optional[UserRole] = None
    classroom: Optional[str] = None

# --- Course Admin Schemas ---
class CourseAdmin(BaseModel):
    id: str = Field(..., description="Unique Course ID, e.g., 'MATH-10A'")
    name: str
    class_name: str
    accent_color: Optional[str] = "#FFFFFF"
    accent_image: Optional[str] = "default.png"
    homeroom_teacher_id: str

# --- Announcement Admin Schemas ---
class SchoolAnnouncementAdmin(BaseModel):
    title: str
    description: str
    author_id: str
    created_at: datetime = Field(default_factory=datetime.now)

class CourseAnnouncementAdmin(BaseModel):
    title: str
    description: str
    course_id: str
    author_id: str
    created_at: datetime = Field(default_factory=datetime.now)

# --- Task & Submission Admin Schemas ---
class TaskAdmin(BaseModel):
    title: str
    description: str
    course_id: str
    author_id: str
    deadline: datetime
    created_at: datetime = Field(default_factory=datetime.now)

class SubmissionAdminUpdate(BaseModel):
    status: TaskStatus
    rejection_reason: Optional[str] = None

# --- Attendance Admin Schema ---
class AttendanceAdmin(BaseModel):
    student_roll_number: str
    date: date
    status: AttendanceStatusEnum
    class_code: str

# --- Schedule Admin Schema ---
class ScheduleAdmin(BaseModel):
    class_id: str
    day_of_week: DayOfWeek
    period: int = Field(..., ge=1, le=10)
    course_id: str