from sqlalchemy.orm import Session
from src.announcements import models
from src.auth.models import User
from typing import List, Optional
from fastapi import UploadFile
import shutil
from pathlib import Path
from src.exceptions import AnnouncementNotFound

def get_school_announcements(db: Session):
    return db.query(models.SchoolAnnouncement).all()

def get_school_announcement(db: Session, announcement_id: str):
    announcement = db.query(models.SchoolAnnouncement).filter(models.SchoolAnnouncement.id == announcement_id).first()
    if not announcement:
        raise AnnouncementNotFound(announcement_id=announcement_id)
    return announcement

def create_school_announcement(db: Session, title: str, description: str, author: User, files: Optional[List[UploadFile]], uploads_dir: Path):
    announcement = models.SchoolAnnouncement(title=title, description=description, author_id=author.roll_number)
    db.add(announcement)
    db.commit()
    db.refresh(announcement)

    if files:
        announcement_attachments_dir = uploads_dir / "school_announcements" / str(announcement.id)
        announcement_attachments_dir.mkdir(parents=True, exist_ok=True)
        for file in files:
            file_path = announcement_attachments_dir / file.filename
            with file_path.open("wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            attachment = models.SchoolAnnouncementAttachment(announcement_id=announcement.id, file_path=str(file_path))
            db.add(attachment)
        db.commit()

    return announcement

def update_school_announcement(db: Session, announcement_id: str, title: str, description: str, attachments_to_keep: List[str], files: Optional[List[UploadFile]], uploads_dir: Path):
    announcement = get_school_announcement(db, announcement_id)

    announcement.title = title
    announcement.description = description

    # Handle attachments
    # This is a simplified logic. A real app would need more robust handling of file names and paths.
    current_attachments = {attachment.file_path for attachment in announcement.attachments}
    attachments_to_keep_set = set(attachments_to_keep)
    
    for attachment in announcement.attachments:
        if attachment.file_path not in attachments_to_keep_set:
            db.delete(attachment)
            Path(attachment.file_path).unlink(missing_ok=True)

    if files:
        announcement_attachments_dir = uploads_dir / "school_announcements" / str(announcement.id)
        announcement_attachments_dir.mkdir(parents=True, exist_ok=True)
        for file in files:
            file_path = announcement_attachments_dir / file.filename
            with file_path.open("wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            attachment = models.SchoolAnnouncementAttachment(announcement_id=announcement.id, file_path=str(file_path))
            db.add(attachment)
    
    db.commit()
    db.refresh(announcement)
    return announcement

def delete_school_announcement(db: Session, announcement_id: str):
    announcement = get_school_announcement(db, announcement_id)
    for attachment in announcement.attachments:
        Path(attachment.file_path).unlink(missing_ok=True)
        db.delete(attachment)
    db.delete(announcement)
    db.commit()
    return True


def get_course_announcements(db: Session, course_id: str):
    return db.query(models.CourseAnnouncement).filter(models.CourseAnnouncement.course_id == course_id).all()

def get_course_announcement(db: Session, announcement_id: str):
    announcement = db.query(models.CourseAnnouncement).filter(models.CourseAnnouncement.id == announcement_id).first()
    if not announcement:
        raise AnnouncementNotFound(announcement_id=announcement_id)
    return announcement

def create_course_announcement(db: Session, course_id: str, title: str, description: str, author: User, files: Optional[List[UploadFile]], uploads_dir: Path):
    announcement = models.CourseAnnouncement(course_id=course_id, title=title, description=description, author_id=author.roll_number)
    db.add(announcement)
    db.commit()
    db.refresh(announcement)

    if files:
        announcement_attachments_dir = uploads_dir / "courses" / course_id / "announcements" / str(announcement.id)
        announcement_attachments_dir.mkdir(parents=True, exist_ok=True)
        for file in files:
            file_path = announcement_attachments_dir / file.filename
            with file_path.open("wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            attachment = models.CourseAnnouncementAttachment(announcement_id=announcement.id, file_path=str(file_path))
            db.add(attachment)
        db.commit()

    return announcement

def update_course_announcement(db: Session, announcement_id: str, title: str, description: str, attachments_to_keep: List[str], files: Optional[List[UploadFile]], uploads_dir: Path):
    announcement = get_course_announcement(db, announcement_id)

    announcement.title = title
    announcement.description = description

    current_attachments = {attachment.file_path for attachment in announcement.attachments}
    attachments_to_keep_set = set(attachments_to_keep)
    
    for attachment in announcement.attachments:
        if attachment.file_path not in attachments_to_keep_set:
            db.delete(attachment)
            Path(attachment.file_path).unlink(missing_ok=True)

    if files:
        announcement_attachments_dir = uploads_dir / "courses" / announcement.course_id / "announcements" / str(announcement.id)
        announcement_attachments_dir.mkdir(parents=True, exist_ok=True)
        for file in files:
            file_path = announcement_attachments_dir / file.filename
            with file_path.open("wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            attachment = models.CourseAnnouncementAttachment(announcement_id=announcement.id, file_path=str(file_path))
            db.add(attachment)
    
    db.commit()
    db.refresh(announcement)
    return announcement

def delete_course_announcement(db: Session, announcement_id: str):
    announcement = get_course_announcement(db, announcement_id)
    for attachment in announcement.attachments:
        Path(attachment.file_path).unlink(missing_ok=True)
        db.delete(attachment)
    db.delete(announcement)
    db.commit()
    return True
