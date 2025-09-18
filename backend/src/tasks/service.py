from sqlalchemy.orm import Session
from fastapi import UploadFile, HTTPException
from fastapi.responses import FileResponse, StreamingResponse
import io
import zipfile
from src.tasks import models
from src.tasks.models import Grade
from src.auth.models import User
from typing import List, Optional
import shutil
from pathlib import Path
from datetime import datetime
from src.exceptions import TaskNotFound, SubmissionAlreadyExists

from src.exceptions import TaskNotFound, SubmissionAlreadyExists, SubmissionAlreadyExists

def get_task(db: Session, task_id: str):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise TaskNotFound(task_id=task_id)
    return task

def get_submissions_for_task(db: Session, task_id: str):
    task = get_task(db, task_id)
    return task.submissions

def create_task(db: Session, course_id: str, title: str, description: str, deadline: datetime, author: User, files: Optional[List[UploadFile]], uploads_dir: Path):
    task = models.Task(
        course_id=course_id,
        title=title,
        description=description,
        deadline=deadline,
        author_id=author.roll_number,
        created_at=datetime.now()
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    if files:
        task_attachments_dir = uploads_dir / "courses" / course_id / "tasks" / str(task.id) / "attachments"
        task_attachments_dir.mkdir(parents=True, exist_ok=True)
        for file in files:
            file_path = task_attachments_dir / file.filename
            with file_path.open("wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            attachment = models.TaskAttachment(task_id=task.id, file_path=str(file_path))
            db.add(attachment)
        db.commit()

    return task

def update_task(db: Session, task_id: str, title: str, description: str, deadline: datetime, attachments_to_keep: List[str], files: Optional[List[UploadFile]], uploads_dir: Path):
    task = get_task(db, task_id)

    task.title = title
    task.description = description
    task.deadline = deadline

    current_attachments = {attachment.file_path for attachment in task.attachments}
    attachments_to_keep_set = set(attachments_to_keep)
    
    for attachment in task.attachments:
        if attachment.file_path not in attachments_to_keep_set:
            db.delete(attachment)
            Path(attachment.file_path).unlink(missing_ok=True)

    if files:
        task_attachments_dir = uploads_dir / "courses" / task.course_id / "tasks" / str(task.id) / "attachments"
        task_attachments_dir.mkdir(parents=True, exist_ok=True)
        for file in files:
            file_path = task_attachments_dir / file.filename
            with file_path.open("wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            attachment = models.TaskAttachment(task_id=task.id, file_path=str(file_path))
            db.add(attachment)
    
    db.commit()
    db.refresh(task)
    return task

def delete_task(db: Session, task_id: str):
    task = get_task(db, task_id)
    for attachment in task.attachments:
        Path(attachment.file_path).unlink(missing_ok=True)
        db.delete(attachment)
    # Also delete submissions if any
    for submission in task.submissions:
        Path(submission.file_path).unlink(missing_ok=True)
        db.delete(submission)
    db.delete(task)
    db.commit()
    return True

def submit_task(db: Session, task_id: str, student: User, files: List[UploadFile], uploads_dir: Path):
    task = get_task(db, task_id)

    submission_dir = uploads_dir / "courses" / task.course_id / "tasks" / task_id / "submissions" / str(student.roll_number)
    submission_dir.mkdir(parents=True, exist_ok=True)

    existing_submission = db.query(models.Submission).filter_by(task_id=task_id, student_id=student.roll_number).first()

    # Determine submission status
    current_time = datetime.now()
    status = models.TaskStatus.SUBMITTED
    if task.deadline and current_time > task.deadline:
        status = models.TaskStatus.DELAYED

    if existing_submission:
        if existing_submission.status == models.TaskStatus.SUBMITTED or existing_submission.status == models.TaskStatus.APPROVED:
            raise SubmissionAlreadyExists(task_id=task_id)
        
        # Clear old attachments
        for attachment in existing_submission.attachments:
            db.delete(attachment)
            Path(attachment.file_path).unlink(missing_ok=True)

        existing_submission.submitted_at = current_time
        existing_submission.status = status
        existing_submission.rejection_reason = None
        submission = existing_submission

    else:
        submission = models.Submission(
            task_id=task.id,
            student_id=student.roll_number,
            submitted_at=current_time,
            status=status
        )
        db.add(submission)
    
    db.commit()
    db.refresh(submission)

    for file in files:
        file_path = submission_dir / file.filename
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        attachment = models.SubmissionAttachment(submission_id=submission.id, file_path=str(file_path))
        db.add(attachment)
    
    db.commit()
    db.refresh(submission)

    return submission, "Files uploaded successfully."

def edit_task_submission(db: Session, task_id: str, student: User, attachments_to_keep: List[str], files: Optional[List[UploadFile]], uploads_dir: Path):
    submission = db.query(models.Submission).filter_by(task_id=task_id, student_id=student.roll_number).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    # Delete attachments that are not in attachments_to_keep
    for attachment in submission.attachments:
        if Path(attachment.file_path).name not in attachments_to_keep:
            db.delete(attachment)
            Path(attachment.file_path).unlink(missing_ok=True)

    if files:
        submission_dir = uploads_dir / "courses" / submission.task.course_id / "tasks" / task_id / "submissions" / str(student.roll_number)
        submission_dir.mkdir(parents=True, exist_ok=True)
        for file in files:
            file_path = submission_dir / file.filename
            with file_path.open("wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            attachment = models.SubmissionAttachment(submission_id=submission.id, file_path=str(file_path))
            db.add(attachment)
    
    submission.submitted_at = datetime.now()
    db.commit()
    db.refresh(submission)
    return submission

def delete_task_submission(db: Session, task_id: str, student: User):
    submission = db.query(models.Submission).filter_by(task_id=task_id, student_id=student.roll_number).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    for attachment in submission.attachments:
        db.delete(attachment)
        Path(attachment.file_path).unlink(missing_ok=True)
    
    db.delete(submission)
    db.commit()
    return True

def approve_task_submission(db: Session, task_id: str, student_roll_number: str, grade: Grade, remarks: Optional[str]):
    submission = db.query(models.Submission).filter_by(task_id=task_id, student_id=student_roll_number).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    submission.status = models.TaskStatus.APPROVED
    submission.grade = grade
    submission.remarks = remarks
    db.commit()
    db.refresh(submission)
    return submission

def reject_task_submission(db: Session, task_id: str, student_roll_number: str, reason: str):
    submission = db.query(models.Submission).filter_by(task_id=task_id, student_id=student_roll_number).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    submission.status = models.TaskStatus.PENDING
    submission.rejection_reason = reason
    db.commit()
    db.refresh(submission)
    return submission

def download_submission(db: Session, task_id: str, student_roll_number: str):
    submission = db.query(models.Submission).filter_by(task_id=task_id, student_id=student_roll_number).first()
    if not submission or not submission.attachments:
        raise HTTPException(status_code=404, detail="Submission not found or is empty.")

    if len(submission.attachments) == 1:
        attachment = submission.attachments[0]
        return FileResponse(attachment.file_path, filename=Path(attachment.file_path).name)

    zip_io = io.BytesIO()
    with zipfile.ZipFile(zip_io, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for attachment in submission.attachments:
            file_path = Path(attachment.file_path)
            if file_path.is_file():
                zipf.write(file_path, file_path.name)
    
    zip_io.seek(0)
    return StreamingResponse(zip_io, media_type="application/zip", headers={"Content-Disposition": f"attachment; filename=submission_{student_roll_number}_{task_id}.zip"})

def download_own_submission(db: Session, task_id: str, student: User):
    return download_submission(db, task_id, student.roll_number)

def delete_submission_attachment(db: Session, task_id: str, student: User, file_name: str):
    submission = db.query(models.Submission).filter_by(task_id=task_id, student_id=student.roll_number).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found.")

    attachment_to_delete = None
    for attachment in submission.attachments:
        if Path(attachment.file_path).name == file_name:
            attachment_to_delete = attachment
            break

    if not attachment_to_delete:
        raise HTTPException(status_code=404, detail=f"File '{file_name}' not found in submission.")

    # Delete the file from disk and the DB record
    Path(attachment_to_delete.file_path).unlink(missing_ok=True)
    db.delete(attachment_to_delete)

    # If that was the last file, delete the submission itself
    if len(submission.attachments) == 0:
        db.delete(submission)
        message = "The last file was removed, and the submission has been deleted."
    else:
        message = f"File '{file_name}' has been deleted from the submission."

    db.commit()
    return message
