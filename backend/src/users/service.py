from sqlalchemy.orm import Session
from fastapi import HTTPException
from src.auth.models import User, UserRole
from src.courses.models import Course
from src.tasks.models import Submission, TaskStatus, Grade
from src.attendance.models import Attendance, AttendanceStatusEnum
from src.schedules.models import Schedule, DayOfWeek
from datetime import date, timedelta
import calendar

def get_user_schedule(db: Session, user: User):
    today_name = calendar.day_name[date.today().weekday()].upper()
    
    if user.role == UserRole.STUDENT:
        if not user.classroom:
            return {"morning_subs": [], "aftnoon_subs": []}
        
        schedule_entries = db.query(Schedule).filter_by(class_id=user.classroom, day_of_week=today_name).order_by(Schedule.period).all()
        
        morning_subs = [s.course_id for s in schedule_entries if s.period <= 3]
        aftnoon_subs = [s.course_id for s in schedule_entries if s.period > 3]
        
        return {"morning_subs": morning_subs, "aftnoon_subs": aftnoon_subs}

    elif user.role == UserRole.TEACHER:
        teacher_courses = {course.id for course in user.teacher_courses}
        if not teacher_courses:
            return {"morning_subs": [], "aftnoon_subs": []}

        schedule_entries = db.query(Schedule).filter(
            Schedule.day_of_week == today_name,
            Schedule.course_id.in_(teacher_courses)
        ).order_by(Schedule.period).all()

        # Create a full day schedule with breaks
        total_periods = 6
        full_schedule = {i: "BREAK" for i in range(1, total_periods + 1)}
        for entry in schedule_entries:
            full_schedule[entry.period] = entry.course_id

        morning_subs = [full_schedule[p] for p in range(1, 4)]
        aftnoon_subs = [full_schedule[p] for p in range(4, total_periods + 1)]

        return {"morning_subs": morning_subs, "aftnoon_subs": aftnoon_subs}

    return {"morning_subs": [], "aftnoon_subs": []}

def get_user_courses(db: Session, user: User):
    if user.role == UserRole.STUDENT:
        return user.student_courses
    elif user.role == UserRole.TEACHER:
        return user.teacher_courses
    return []

def get_attendance_records(db: Session, user: User):
    if user.role != UserRole.STUDENT:
        return {
            "total_days": 0,
            "days_attended": 0,
            "attendance_percentage": 0.0,
            "leave_days": []
        }

    attendance_records = db.query(Attendance).filter(Attendance.student_roll_number == user.roll_number).all()

    days_present = len([rec for rec in attendance_records if rec.status == AttendanceStatusEnum.PRESENT])
    days_absent = len([rec for rec in attendance_records if rec.status == AttendanceStatusEnum.ABSENT])
    days_leave = len([rec for rec in attendance_records if rec.status == AttendanceStatusEnum.LEAVE])

    total_days = days_present + days_absent + days_leave
    days_attended = days_present

    leave_days = [rec.date.isoformat() for rec in attendance_records if rec.status == AttendanceStatusEnum.LEAVE]

    attendance_percentage = 0.0
    if total_days > 0:
        attendance_percentage = round((days_attended / total_days) * 100, 1)

    return {
        "total_days": total_days,
        "days_attended": days_attended,
        "attendance_percentage": attendance_percentage,
        "leave_days": leave_days
    }

def get_teacher_classes(db: Session, user: User):
    if user.role != UserRole.TEACHER:
        return []
    
    courses = user.teacher_courses
    
    return [
        {
            "class_name": course.class_name,
            "course_name": course.name,
            "course_id": course.id,
            "student_count": len(course.students),
            "accent_color": course.accent_color,
            "accent_image": course.accent_image
        } for course in courses
    ]

def get_student_profile(db: Session, student_roll_number: str):
    student = db.query(User).filter(User.roll_number == student_roll_number, User.role == UserRole.STUDENT).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Calculate total tasks for the student's class
    courses = db.query(Course).filter(Course.class_name == student.classroom).all()
    tasks_total = sum(len(course.tasks) for course in courses)

    # Calculate completed tasks for the student
    submissions = db.query(Submission).filter(
        Submission.student_id == student.roll_number,
        Submission.status == TaskStatus.APPROVED
    ).all()
    tasks_completed = len(submissions)

    # Calculate grades
    grade_to_numeric = {Grade.S: 5, Grade.A: 4, Grade.B: 3, Grade.C: 2, Grade.D: 1}
    grade_counts = {grade: 0 for grade in Grade}
    for sub in submissions:
        if sub.grade:
            grade_counts[sub.grade] += 1

    total_submissions = sum(grade_counts.values())
    if total_submissions > 0:
        overall_grade_value = sum(grade_to_numeric[g] * count for g, count in grade_counts.items()) / total_submissions
        if overall_grade_value >= 4.5:
            overall_grade = Grade.S
        elif overall_grade_value >= 3.5:
            overall_grade = Grade.A
        elif overall_grade_value >= 2.5:
            overall_grade = Grade.B
        elif overall_grade_value >= 1.5:
            overall_grade = Grade.C
        else:
            overall_grade = Grade.D
    else:
        overall_grade = Grade.D

    return {
        "profile_picture_url": f"{student.roll_number}.png",
        "name": student.name,
        "roll_number": student.roll_number,
        "classroom": student.classroom,
        "progress": {
            "attendance_percentage": int(get_attendance_records(db, student)['attendance_percentage']),
            "tasks_completed": tasks_completed,
            "tasks_total": tasks_total
        },
        "grades": {
            "s": grade_counts.get(Grade.S, 0),
            "a": grade_counts.get(Grade.A, 0),
            "b": grade_counts.get(Grade.B, 0),
            "c": grade_counts.get(Grade.C, 0),
            "d": grade_counts.get(Grade.D, 0),
            "overall": overall_grade
        },
        "contact_info": {
            "email": student.email,
            "phone_personal": student.phone_personal,
            "phone_mother": student.phone_mother,
            "phone_father": student.phone_father
        },
        "home_address": student.home_address
    }

def get_students_in_classroom(db: Session, class_id: str, current_user: User):
    course = db.query(Course).filter(Course.class_name == class_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Class not found")

    if course.homeroom_teacher_id != current_user.roll_number:
        raise HTTPException(status_code=403, detail="You are not the homeroom teacher of this class")

    students = []
    for student in course.students:
        students.append({
            "name": student.name,
            "roll_number": student.roll_number,
            "profile_picture_url": f"{student.roll_number}.png"
        })
    return students
