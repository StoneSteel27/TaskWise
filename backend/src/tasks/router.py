from fastapi import APIRouter, Depends, Form, UploadFile, File, HTTPException
from typing import List, Optional, Union
import json
from sqlalchemy.orm import Session
from src.database import get_db
from src.auth.dependencies import get_current_user, get_current_teacher
from src.dependencies import get_uploads_dir
from pathlib import Path
from src.auth.models import User, UserRole
from src.users import schemas
from src.tasks import service, models
from src.tasks.models import Grade
from src.tasks.schemas import TaskSubmission
from datetime import datetime
from src.exceptions import CourseNotFound

router = APIRouter()

def format_task(task, current_user: User, db: Session):
    task_details = {
        "task_id": task.id,
        "name": task.author.name,
        "time": task.created_at,
        "title": task.title,
        "description": task.description,
        "attachements": [Path(att.file_path).name for att in task.attachments],
        "deadline": task.deadline,
    }

    if current_user.role == UserRole.TEACHER:
        submissions_list = []
        # Create a dictionary for quick lookup of submissions
        submissions_by_student = {sub.student_id: sub for sub in task.submissions}
        
        # Iterate over all students in the course
        for student in task.course.students:
            submission = submissions_by_student.get(student.roll_number)
            if submission:
                status = submission.status.value
                submitted_at = submission.submitted_at
                grade = submission.grade.value if submission.grade else None
                remarks = submission.remarks
            else:
                status = models.TaskStatus.PENDING.value
                submitted_at = None
                grade = None
                remarks = None
            
            submissions_list.append({
                "student_name": student.name,
                "student_roll_number": student.roll_number,
                "profile_picture_url": f"{student.roll_number}.png", # Placeholder
                "status": status,
                "submitted_at": submitted_at,
                "grade": grade,
                "remarks": remarks
            })
        task_details["submissions"] = submissions_list
    else: # For students
        status = models.TaskStatus.PENDING.value
        rejection_reason = None
        submission_attachments = []
        grade = None
        remarks = None
        submission = db.query(models.Submission).filter_by(task_id=task.id, student_id=current_user.roll_number).first()
        if submission:
            status = submission.status.value
            submission_attachments = [Path(att.file_path).name for att in submission.attachments]
            if submission.status == models.TaskStatus.PENDING and submission.rejection_reason:
                rejection_reason = submission.rejection_reason
            if submission.status == models.TaskStatus.APPROVED:
                grade = submission.grade.value if submission.grade else None
                remarks = submission.remarks

        task_details["status"] = status
        task_details["submission_attachments"] = submission_attachments
        if rejection_reason:
            task_details["rejection_reason"] = rejection_reason
        if grade:
            task_details["grade"] = grade
        if remarks:
            task_details["remarks"] = remarks
    
    return task_details

@router.post("/{course_id}/tasks/{task_id}/upload")
async def upload_task_submission(
    course_id: str,
    task_id: str,
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    uploads_dir: Path = Depends(get_uploads_dir)
):
    submission, message = service.submit_task(db, task_id, current_user, files, uploads_dir)
    
    return {
        "message": message,
        "task_id": task_id,
        "new_status": submission.status.value
    }

@router.put("/{course_id}/tasks/{task_id}/submission/edit")
async def edit_task_submission(
    course_id: str,
    task_id: str,
    attachments_to_keep: Optional[str] = Form("[]"),
    files: Optional[List[UploadFile]] = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    uploads_dir: Path = Depends(get_uploads_dir)
):
    attachments_to_keep_list = json.loads(attachments_to_keep)
    submission = service.edit_task_submission(db, task_id, current_user, attachments_to_keep_list, files, uploads_dir)
    
    return {
        "message": "Submission updated successfully.",
        "submission_id": submission.id,
        "current_attachments": [Path(att.file_path).name for att in submission.attachments]
    }

@router.delete("/{course_id}/tasks/{task_id}/submission/delete")
async def delete_task_submission(
    course_id: str,
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service.delete_task_submission(db, task_id, current_user)
    return {"message": "Submission deleted successfully."}

@router.delete("/{course_id}/tasks/{task_id}/submission/attachments/{file_name}")
async def delete_submission_attachment(
    course_id: str,
    task_id: str,
    file_name: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    message = service.delete_submission_attachment(db, task_id, current_user, file_name)
    return {"message": message}

@router.get("/{course_id}/tasks/{task_id}", response_model=Union[schemas.TeacherTask, schemas.Task])
async def get_task_details(
    course_id: str,
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = service.get_task(db, task_id)
    if task.course_id != course_id:
        raise CourseNotFound(course_id=course_id)
    return format_task(task, current_user, db)

@router.get("/{course_id}/tasks/{task_id}/submissions", response_model=List[TaskSubmission])
async def get_task_submissions(
    course_id: str,
    task_id: str,
    current_user: User = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    return service.get_submissions_for_task(db, task_id)

@router.post("/{course_id}/tasks/create")
async def create_task(
    course_id: str,
    title: str = Form(...),
    description: str = Form(...),
    deadline: str = Form(...),
    files: Optional[List[UploadFile]] = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    uploads_dir: Path = Depends(get_uploads_dir)
):
    deadline_dt = datetime.fromisoformat(deadline)
    task = service.create_task(db, course_id, title, description, deadline_dt, current_user, files, uploads_dir)
    return {
        "message": "Task created successfully.",
        "task_id": task.id,
        "uploaded_files": [file.filename for file in files] if files else []
    }

@router.put("/{course_id}/tasks/{task_id}/update")
async def update_task(
    course_id: str,
    task_id: str,
    title: str = Form(...),
    description: str = Form(...),
    deadline: str = Form(...),
    attachments_to_keep: Optional[str] = Form("[]"),
    files: Optional[List[UploadFile]] = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    uploads_dir: Path = Depends(get_uploads_dir)
):
    deadline_dt = datetime.fromisoformat(deadline)
    attachments_to_keep_list = json.loads(attachments_to_keep)
    task = service.update_task(db, task_id, title, description, deadline_dt, attachments_to_keep_list, files, uploads_dir)
    
    return {
        "message": "Task updated successfully.",
        "task_id": task.id,
        "current_attachments": [Path(att.file_path).name for att in task.attachments]
    }

@router.delete("/{course_id}/tasks/{task_id}/delete")
async def delete_task(
    course_id: str,
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service.delete_task(db, task_id)
    return {"message": "Task deleted successfully.", "task_id": task_id}

@router.put("/{course_id}/tasks/{task_id}/submissions/{student_roll_number}/approve")
async def approve_task_submission(
    course_id: str,
    task_id: str,
    student_roll_number: str,
    grade: Grade = Form(...),
    remarks: Optional[str] = Form(None),
    current_user: User = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    submission = service.approve_task_submission(db, task_id, student_roll_number, grade, remarks)
    return {
        "message": "Submission approved successfully.",
        "student_roll_number": submission.student_id,
        "new_status": "APPROVED"
    }

@router.put("/{course_id}/tasks/{task_id}/submissions/{student_roll_number}/reject")
async def reject_task_submission(
    course_id: str,
    task_id: str,
    student_roll_number: str,
    reason: str = Form(...),
    current_user: User = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    submission = service.reject_task_submission(db, task_id, student_roll_number, reason)
    return {
        "message": "Submission rejected successfully.",
        "student_roll_number": submission.student_id,
        "new_status": "PENDING"
    }

@router.get("/{course_id}/tasks/{task_id}/submissions/{student_roll_number}/download")
async def download_submission(
    course_id: str,
    task_id: str,
    student_roll_number: str,
    current_user: User = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    return service.download_submission(db, task_id, student_roll_number)
