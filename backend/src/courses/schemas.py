from pydantic import BaseModel, Field
from typing import Optional

class StudentCourseView(BaseModel):
    name: str
    course_id: str = Field(..., alias='id')
    teacher_name: str
    accent_color: str
    accent_image: Optional[str] = None

    class Config:
        from_attributes = True
        populate_by_name = True

class TeacherCourseView(BaseModel):
    class_name: str
    course_name: str = Field(..., alias='name')
    course_id: str = Field(..., alias='id')
    student_count: int
    accent_color: str
    accent_image: Optional[str] = None

    class Config:
        from_attributes = True
        populate_by_name = True