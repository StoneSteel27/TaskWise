from pydantic import BaseModel
from datetime import date, datetime
from src.auth.models import UserRole
from src.tasks.models import Grade
from typing import Optional


class User(BaseModel):
    name: str
    roll_number: str
    profile_picture_url: str | None = None
    role: UserRole
    homeroom_class: Optional[str] = None


class Schedule(BaseModel):
    morning_subs: list[str]
    aftnoon_subs: list[str]


class Course(BaseModel):
    name: str
    course_id: str
    teacher_name: str
    accent_color: str
    accent_image: str
    class_name: Optional[str] = None
    student_count: Optional[int] = None


class CourseList(BaseModel):
    courses: list[Course]


class AttendanceRecord(BaseModel):
    total_days: int
    days_attended: int
    attendance_percentage: float
    leave_days: list[date]


class Announcement(BaseModel):
    announcement_id: str
    name: str
    time: datetime
    title: str
    description: str
    attachements: list[str]


class Task(BaseModel):
    task_id: str
    name: str
    time: datetime
    title: str
    description: str
    attachements: list[str]
    deadline: datetime
    status: Optional[str] = None
    submission_attachments: Optional[list[str]] = None
    rejection_reason: Optional[str] = None
    grade: Optional[Grade] = None
    remarks: Optional[str] = None


class CourseDashboard(BaseModel):
    announcements: list[Announcement]
    tasks: list[Task]


class Student(BaseModel):
    name: str
    roll_number: str
    profile_picture_url: str | None = None


class StudentList(BaseModel):
    students: list[Student]


class ClassInfo(BaseModel):
    class_name: str
    course_name: str
    course_id: str
    student_count: int
    accent_color: str
    accent_image: str


class ClassList(BaseModel):
    classes: list[ClassInfo]


class TaskSubmissionDetail(BaseModel):
    student_name: str
    student_roll_number: str
    profile_picture_url: str
    status: str
    submitted_at: Optional[datetime]
    grade: Optional[Grade] = None
    remarks: Optional[str] = None


class TeacherTask(BaseModel):
    task_id: str
    name: str
    time: datetime
    title: str
    description: str
    attachements: list[str]
    deadline: datetime
    submissions: list[TaskSubmissionDetail]


class Progress(BaseModel):
    attendance_percentage: int
    tasks_completed: int
    tasks_total: int


class ContactInfo(BaseModel):
    email: str
    phone_personal: str
    phone_mother: str
    phone_father: str


class StudentProfile(BaseModel):
    profile_picture_url: str
    name: str
    roll_number: str
    classroom: str
    progress: Progress
    contact_info: ContactInfo
    home_address: str
