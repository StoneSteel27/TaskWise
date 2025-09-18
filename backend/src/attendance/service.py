from sqlalchemy.orm import Session
from src.attendance import models, schemas
from src.auth.models import User, UserRole
from src.courses.models import Course
from datetime import date
from typing import Tuple, List

def mark_class_attendance(db: Session, class_code: str, attendance_data: schemas.AttendanceData, teacher: User) -> Tuple[bool, List[str] | str]:
    
    errors = []

    # 1. Validate teacher's role
    if teacher.role != UserRole.TEACHER:
        return False, ["Only teachers can mark attendance."]

    # 2. Find the course associated with the class_code
    course = db.query(Course).filter(Course.class_name == class_code).first()
    if not course:
        return False, [f"Class with code {class_code} not found."]

    # 3. Check if the teacher is the homeroom teacher for this course
    if course.homeroom_teacher_id != teacher.roll_number:
        return False, [f"You are not the homeroom teacher for {class_code} and cannot mark attendance."]

    # 4. Check if attendance has already been marked for this day
    today = date.today()
    existing_attendance = db.query(models.Attendance).filter_by(class_code=class_code, date=today).first()
    if existing_attendance:
        return False, [f"Attendance for {class_code} has already been marked today."]

    # 5. Validate all students before attempting to record attendance
    student_roll_numbers_in_class = {student.roll_number for student in course.students}
    records_to_add = []

    for data in attendance_data.attendance_data:
        if data.student_roll_number not in student_roll_numbers_in_class:
            errors.append(f"Student with roll number {data.student_roll_number} is not in this class.")
        else:
            records_to_add.append(models.Attendance(
                student_roll_number=data.student_roll_number,
                date=today,
                status=data.status,
                class_code=class_code
            ))

    if errors:
        return False, errors

    # 6. If no errors, add all records and commit
    db.add_all(records_to_add)
    db.commit()
    
    return True, f"Attendance for class {class_code} on {today.isoformat()} has been successfully recorded."

def get_student_attendance_history(db: Session, student: User):
    return db.query(models.Attendance).filter(models.Attendance.student_roll_number == student.roll_number).all()

def get_class_attendance_history(db: Session, class_code: str, attendance_date: date):
    return db.query(models.Attendance).filter_by(class_code=class_code, date=attendance_date).all()
