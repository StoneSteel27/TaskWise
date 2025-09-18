import os
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from src.auth.dependencies import get_current_user
from src.auth.models import User, UserRole
from src.database import get_db
from src.tasks.models import Submission
from src.dependencies import get_uploads_dir
from src.tasks import service as tasks_service

router = APIRouter(
    tags=["attachments"],
    responses={404: {"description": "Not found"}},
)

@router.get("/school-announcements/{announcement_id}/attachments/{file_name}")
async def download_school_announcement_attachment(
    announcement_id: str, file_name: str, current_user: User = Depends(get_current_user), uploads_dir: Path = Depends(get_uploads_dir)
):
    file_path = uploads_dir / "school_announcements" / announcement_id / file_name
    if not file_path.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
    return FileResponse(file_path)

@router.get("/courses/{course_id}/announcements/{announcement_id}/attachments/{file_name}")
async def download_course_announcement_attachment(
    course_id: str, announcement_id: str, file_name: str, current_user: User = Depends(get_current_user), uploads_dir: Path = Depends(get_uploads_dir)
):
    file_path = uploads_dir / "courses" / course_id / "announcements" / announcement_id / file_name
    if not file_path.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
    return FileResponse(file_path)

@router.get("/courses/{course_id}/tasks/{task_id}/attachments/{file_name}")
async def download_task_attachment(
    course_id: str, task_id: str, file_name: str, current_user: User = Depends(get_current_user), uploads_dir: Path = Depends(get_uploads_dir)
):
    file_path = uploads_dir / "courses" / course_id / "tasks" / task_id / "attachments" / file_name
    if not file_path.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
    return FileResponse(file_path)

@router.get("/courses/{course_id}/tasks/{task_id}/submission/download")
async def download_own_task_submission(
    course_id: str, task_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    return tasks_service.download_own_submission(db, task_id, current_user)

@router.get("/courses/{course_id}/tasks/{task_id}/submissions/{student_roll_number}/download")
async def download_student_task_submission(
    course_id: str, task_id: str, student_roll_number: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    if current_user.role != UserRole.TEACHER:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    return tasks_service.download_submission(db, task_id, student_roll_number)
