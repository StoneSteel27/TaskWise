from fastapi import APIRouter, Depends, Form, UploadFile, File, HTTPException
from typing import List, Optional
import json
from sqlalchemy.orm import Session
from src.database import get_db
from src.auth.dependencies import get_current_user, get_current_teacher, get_current_principal
from src.dependencies import get_uploads_dir
from pathlib import Path
from src.auth.models import User
from src.users import schemas
from src.announcements import service

router = APIRouter()

def format_announcement(announcement):
    return {
        "announcement_id": announcement.id,
        "name": announcement.author.name,
        "time": announcement.created_at,
        "title": announcement.title,
        "description": announcement.description,
        "attachements": [Path(att.file_path).name for att in announcement.attachments]
    }

@router.get("/me/school-announcements", response_model=List[schemas.Announcement])
async def get_school_announcements(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    announcements = service.get_school_announcements(db)
    return [format_announcement(ann) for ann in announcements]

@router.get("/school-announcements/{announcement_id}", response_model=schemas.Announcement)
async def get_school_announcement(announcement_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    announcement = service.get_school_announcement(db, announcement_id)
    return format_announcement(announcement)

@router.post("/school-announcements/create")
async def create_school_announcement(
    title: str = Form(...),
    description: str = Form(...),
    files: Optional[List[UploadFile]] = File(None),
    current_user: User = Depends(get_current_principal),
    db: Session = Depends(get_db),
    uploads_dir: Path = Depends(get_uploads_dir)
):
    announcement = service.create_school_announcement(db, title, description, current_user, files, uploads_dir)
    return {
        "message": "School-wide announcement created successfully.",
        "announcement_id": announcement.id,
        "uploaded_files": [file.filename for file in files] if files else []
    }

@router.put("/school-announcements/{announcement_id}/update")
async def update_school_announcement(
    announcement_id: str,
    title: str = Form(...),
    description: str = Form(...),
    attachments_to_keep: Optional[str] = Form("[]"),
    files: Optional[List[UploadFile]] = File(None),
    current_user: User = Depends(get_current_principal),
    db: Session = Depends(get_db),
    uploads_dir: Path = Depends(get_uploads_dir)
):
    attachments_to_keep_list = json.loads(attachments_to_keep)
    announcement = service.update_school_announcement(db, announcement_id, title, description, attachments_to_keep_list, files, uploads_dir)
    
    return {
        "message": "School-wide announcement updated successfully.",
        "announcement_id": announcement.id,
        "current_attachments": [Path(att.file_path).name for att in announcement.attachments]
    }

@router.delete("/school-announcements/{announcement_id}/delete")
async def delete_school_announcement(announcement_id: str, current_user: User = Depends(get_current_principal), db: Session = Depends(get_db)):
    service.delete_school_announcement(db, announcement_id)
    return {"message": "School-wide announcement deleted successfully.", "announcement_id": announcement_id}

@router.post("/{course_id}/announcements/create")
async def create_course_announcement(
    course_id: str,
    title: str = Form(...),
    description: str = Form(...),
    files: Optional[List[UploadFile]] = File(None),
    current_user: User = Depends(get_current_teacher),
    db: Session = Depends(get_db),
    uploads_dir: Path = Depends(get_uploads_dir)
):
    announcement = service.create_course_announcement(db, course_id, title, description, current_user, files, uploads_dir)
    return {
        "message": "Announcement created successfully.",
        "announcement_id": announcement.id,
        "uploaded_files": [file.filename for file in files] if files else []
    }

@router.put("/{course_id}/announcements/{announcement_id}/update")
async def update_course_announcement(
    course_id: str,
    announcement_id: str,
    title: str = Form(...),
    description: str = Form(...),
    attachments_to_keep: Optional[str] = Form("[]"),
    files: Optional[List[UploadFile]] = File(None),
    current_user: User = Depends(get_current_teacher),
    db: Session = Depends(get_db),
    uploads_dir: Path = Depends(get_uploads_dir)
):
    attachments_to_keep_list = json.loads(attachments_to_keep)
    announcement = service.update_course_announcement(db, announcement_id, title, description, attachments_to_keep_list, files, uploads_dir)
    
    return {
        "message": "Announcement updated successfully.",
        "announcement_id": announcement.id,
        "current_attachments": [Path(att.file_path).name for att in announcement.attachments]
    }

@router.delete("/{course_id}/announcements/{announcement_id}/delete")
async def delete_course_announcement(
    course_id: str,
    announcement_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service.delete_course_announcement(db, announcement_id)
    return {"message": "Announcement deleted successfully.", "announcement_id": announcement_id}

@router.get("/{course_id}/announcements/{announcement_id}", response_model=schemas.Announcement)
async def get_course_announcement(
    course_id: str,
    announcement_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    announcement = service.get_course_announcement(db, announcement_id)
    if announcement.course_id != course_id:
        raise CourseNotFound(course_id=course_id)
    return format_announcement(announcement)
