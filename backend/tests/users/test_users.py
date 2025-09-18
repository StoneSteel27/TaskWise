from unittest.mock import patch
from fastapi.testclient import TestClient
from src.auth.models import User, UserRole
from src.courses.models import Course
from src.schedules.models import Schedule, DayOfWeek
from src.attendance.models import Attendance, AttendanceStatusEnum
from datetime import date
from src.main import app
from src.auth.dependencies import get_current_user

def test_get_user_courses(client: TestClient, test_student: User, db_session):
    # Create a course
    course = Course(
        id="TEST-101",
        name="Test Course",
        class_name="10-A",
        accent_color="#FFFFFF",
        accent_image="test.png",
        homeroom_teacher_id="teacher"
    )
    db_session.add(course)
    db_session.commit()

    # Associate the student with the course
    course.students.append(test_student)
    db_session.commit()

    response = client.get("/v1/api/me/courses")

    assert response.status_code == 200
    data = response.json()
    assert "courses" in data
    assert len(data["courses"]) == 1
    assert data["courses"][0]["name"] == "Test Course"
    assert data["courses"][0]["course_id"] == "TEST-101"

def test_get_user_schedule(client: TestClient, test_student: User, db_session):
    # Create a schedule
    schedule = Schedule(
        class_id="10-A",
        day_of_week=DayOfWeek.MONDAY,
        period=1,
        course_id="MATH-10A"
    )
    db_session.add(schedule)
    db_session.commit()

    with patch('src.users.service.date') as mock_date:
        mock_date.today.return_value = date(2024, 7, 29) # A Monday
        response = client.get("/v1/api/me/schedule")

    assert response.status_code == 200
    data = response.json()
    assert "morning_subs" in data
    assert "aftnoon_subs" in data
    assert "MATH-10A" in data["morning_subs"]

def test_get_attendance_records(client: TestClient, test_student: User, db_session):
    # Create attendance records
    attendance = Attendance(
        student_roll_number=test_student.roll_number,
        date=date(2024, 7, 29),
        status=AttendanceStatusEnum.PRESENT,
        class_code="10-A"
    )
    db_session.add(attendance)
    db_session.commit()

    response = client.get("/v1/api/me/attendance-records")

    assert response.status_code == 200
    data = response.json()
    assert "total_days" in data
    assert "days_attended" in data
    assert "attendance_percentage" in data
    assert "leave_days" in data
    assert data["days_attended"] == 1

def test_get_teacher_classes(client: TestClient, test_teacher: User, db_session):
    # Create a course and associate it with the teacher
    course = Course(
        id="TEST-101",
        name="Test Course",
        class_name="10-A",
        accent_color="#FFFFFF",
        accent_image="test.png",
        homeroom_teacher_id=test_teacher.roll_number
    )
    course.teachers.append(test_teacher)
    db_session.add(course)
    db_session.commit()

    # Override the get_current_user dependency to use the test_teacher
    app.dependency_overrides[get_current_user] = lambda: test_teacher
    
    response = client.get("/v1/api/me/classes")

    assert response.status_code == 200
    data = response.json()
    assert "classes" in data
    assert len(data["classes"]) == 1
    assert data["classes"][0]["course_name"] == "Test Course"
    assert data["classes"][0]["course_id"] == "TEST-101"

    # Clean up the override
    app.dependency_overrides = {}