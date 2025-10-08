from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from src.database import get_db
from src.auth.dependencies import get_current_user, get_current_homeroom_teacher, get_current_student_or_homeroom_teacher
from src.auth.models import User, UserRole
from src.users import schemas, service

router = APIRouter()

@router.get("/me/schedule", response_model=schemas.Schedule)
async def get_user_schedule(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Retrieves the daily schedule for the logged-in user.
    """
    print(f"Current user: {current_user.name}, Role: {current_user.role}")
    print(service.get_user_schedule(db, user=current_user))
    return service.get_user_schedule(db, user=current_user)

@router.get("/me/courses", response_model=schemas.CourseList)
async def get_user_courses(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Retrieves the list of subjects a student is enrolled in.
    """
    courses = service.get_user_courses(db, user=current_user)
    
    # The service returns ORM objects, so we need to format them.
    # In a real app, you'd have a more robust way to handle this,
    # perhaps by having the service return dicts or Pydantic models.
    
    formatted_courses = []
    for course in courses:
        teacher_name = "N/A"
        if course.teachers:
            teacher_name = course.teachers[0].name

        if current_user.role == UserRole.TEACHER:
            formatted_courses.append({
                "name": course.name,
                "course_id": course.id,
                "teacher_name": teacher_name,
                "accent_color": course.accent_color,
                "accent_image": course.accent_image,
                "class_name": course.class_name,
                "student_count": len(course.students)
            })
        else: # Student view
            formatted_courses.append({
                "name": course.name,
                "course_id": course.id,
                "teacher_name": teacher_name,
                "accent_color": course.accent_color,
                "accent_image": course.accent_image,
            })

    return {"courses": formatted_courses}


@router.get("/me/attendance-records", response_model=schemas.AttendanceRecord)
async def get_attendance_records(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Retrieves the attendance records for the logged-in student.
    """
    return service.get_attendance_records(db, user=current_user)

@router.get("/me/classes", response_model=schemas.ClassList)
async def get_teacher_classes(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Retrieves the list of classes and subjects the logged-in teacher is assigned to teach.
    """
    classes = service.get_teacher_classes(db, user=current_user)
    return {"classes": classes}

@router.get("/students/{student_roll_number}", response_model=schemas.StudentProfile)
async def get_student_profile(student_roll_number: str, current_user: User = Depends(get_current_student_or_homeroom_teacher), db: Session = Depends(get_db)):
    """
    Retrieves the detailed profile of a specific student.
    Accessible by the student themselves or their homeroom teacher.
    """
    return service.get_student_profile(db, student_roll_number)

@router.get("/{class_id}/students", response_model=schemas.StudentList)
async def get_students_in_classroom(class_id: str, current_user: User = Depends(get_current_homeroom_teacher), db: Session = Depends(get_db)):
    """
    Retrieves the list of students in a specific classroom.
    Only accessible by homeroom teachers.
    """
    students = service.get_students_in_classroom(db, class_id, current_user)
    return {"students": students}
