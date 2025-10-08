from sqlalchemy.orm import Session
from sqlalchemy import or_
from src.courses import models as course_models
from src.auth.models import User, UserRole
from src.announcements.models import CourseAnnouncement
from src.tasks.models import Task
from src.announcements.router import format_announcement
from src.tasks.router import format_task
from src.exceptions import CourseNotFound, NotACourseTeacher
from fastapi import UploadFile
import shutil
from pathlib import Path
from src.courses import schemas as course_schemas

def get_course(db: Session, course_id: str, user: User) -> dict:
    course = db.query(course_models.Course).filter(course_models.Course.id == course_id).first()
    if not course:
        raise CourseNotFound(course_id=course_id)

    if user.role == UserRole.TEACHER:
        return {
            "class_name": course.class_name,
            "course_name": course.name,
            "course_id": course.id,
            "student_count": len(course.students),
            "accent_color": course.accent_color,
            "accent_image": course.accent_image,
        }
    else: # For students and other roles
        teacher_name = course.homeroom_teacher.name if course.homeroom_teacher else "N/A"
        return {
            "name": course.name,
            "course_id": course.id,
            "teacher_name": teacher_name,
            "accent_color": course.accent_color,
            "accent_image": course.accent_image,
        }

def update_course_accent_image(db: Session, course_id: str, accent_image: UploadFile, user: User):
    course = db.query(course_models.Course).filter(course_models.Course.id == course_id).first()
    if not course:
        raise CourseNotFound(course_id=course_id)

    if user not in course.teachers:
        raise NotACourseTeacher(course_id=course_id)

    upload_dir = Path(f"uploads/courses/{course_id}")
    upload_dir.mkdir(parents=True, exist_ok=True)

    accent_image_path = upload_dir / "icon.png"
    with open(accent_image_path, "wb") as buffer:
        shutil.copyfileobj(accent_image.file, buffer)

    course.accent_image = f"v1/api/{course_id}/icon.png"
    db.commit()

def get_course_dashboard(db: Session, course_id: str, user: User):
    course = db.query(course_models.Course).filter(course_models.Course.id == course_id).first()
    if not course:
        raise CourseNotFound(course_id=course_id)
    
    return {
        "announcements": [format_announcement(ann) for ann in course.announcements],
        "tasks": [format_task(task, user, db) for task in course.tasks]
    }

def search_in_course(db: Session, course_id: str, query: str, user: User):
    course = db.query(course_models.Course).filter(course_models.Course.id == course_id).first()
    if not course:
        raise CourseNotFound(course_id=course_id)
        
    announcements = db.query(CourseAnnouncement).filter(
        CourseAnnouncement.course_id == course_id,
        or_(
            CourseAnnouncement.title.ilike(f"%{query}%"),
            CourseAnnouncement.description.ilike(f"%{query}%")
        )
    ).all()

    tasks = db.query(Task).filter(
        Task.course_id == course_id,
        or_(
            Task.title.ilike(f"%{query}%"),
            Task.description.ilike(f"%{query}%")
        )
    ).all()
    
    return {
        "announcements": [format_announcement(ann) for ann in announcements],
        "tasks": [format_task(task, user, db) for task in tasks]
    }

def list_students_in_class(db: Session, course_id: str, user: User):
    course = db.query(course_models.Course).filter(course_models.Course.id == course_id).first()
    if not course:
        raise CourseNotFound(course_id=course_id)
    return course.students

def get_students_count_in_class(db: Session, course_id: str):
    course = db.query(course_models.Course).filter(course_models.Course.id == course_id).first()
    if not course:
        raise CourseNotFound(course_id=course_id)
    return len(course.students)
