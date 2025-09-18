from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.database import get_db
from src.auth.dependencies import get_current_user, get_current_teacher
from src.auth.models import User
from src.attendance import schemas, service
from datetime import date

router = APIRouter()

@router.post("/{class_code}/attendance")
async def mark_class_attendance(
    class_code: str,
    attendance_data: schemas.AttendanceData,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mark Class Attendance
    """
    success, result = service.mark_class_attendance(db, class_code, attendance_data, current_user)
    
    if not success:
        raise HTTPException(status_code=400, detail=result)
        
    return {"message": result}

@router.get("/me/attendance-history", response_model=schemas.AttendanceHistory)
async def get_student_attendance_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get Student Attendance History
    """
    history = service.get_student_attendance_history(db, current_user)
    return {"history": history}

@router.get("/{class_code}/attendance-history", response_model=schemas.ClassAttendanceHistory)
async def get_class_attendance_history(
    class_code: str,
    attendance_date: date,
    current_user: User = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    """
    Get Class Attendance History for a specific date
    """
    records = service.get_class_attendance_history(db, class_code, attendance_date)
    return {"records": records}
