from fastapi import APIRouter, Depends, Query, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from src.database import get_db
from src.auth.dependencies import get_current_user
from src.auth.models import User
from src.users import schemas
from src.courses import service
from src.courses import schemas as course_schemas

router = APIRouter()

@router.get("/courses/{course_id}")
async def get_course(course_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Retrieves details for a specific course.
    """
    course = service.get_course(db, course_id=course_id, user=current_user)
    return course

@router.put("/me/{course_id}/accent_image")
async def update_course_accent_image(course_id: str, accent_image: UploadFile = File(...), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Updates the accent_image for a specific course.
    """
    service.update_course_accent_image(db, course_id=course_id, accent_image=accent_image, user=current_user)
    return {"message": "Course accent_image updated successfully"}

@router.get("/me/{course_id}/dashboard", response_model=schemas.CourseDashboard)
async def get_course_dashboard(course_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Retrieves all the announcements and tasks for a specific course.
    """
    dashboard = service.get_course_dashboard(db, course_id=course_id, user=current_user)
    return dashboard

@router.get("/me/{course_id}/search", response_model=schemas.CourseDashboard)
async def search_in_course(course_id: str, q: str = Query(..., min_length=1), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Searches for announcements and tasks within a specific course.
    """
    results = service.search_in_course(db, course_id=course_id, query=q, user=current_user)
    return results

@router.get("/{course_id}/students", response_model=schemas.StudentList)
async def list_students_in_class(course_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Retrieves a list of all students enrolled in a specific course.
    """
    students = service.list_students_in_class(db, course_id=course_id, user=current_user)
    
    formatted_students = [
        {
            "name": student.name,
            "roll_number": student.roll_number,
            "profile_picture_url": f"{student.roll_number}.png" # Placeholder
        } for student in students
    ]
    
    return {"students": formatted_students}
