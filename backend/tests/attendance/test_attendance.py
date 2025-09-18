from fastapi.testclient import TestClient
from src.auth.models import User, UserRole
from src.courses.models import Course
from src.attendance.models import Attendance
from datetime import date

def test_mark_class_attendance(client: TestClient, test_teacher: User, test_student: User, db_session):
    # Create a course and associate the teacher and student
    course = Course(
        id="TEST-10A",
        name="Test Course",
        class_name="10-A",
        accent_color="#FFFFFF",
        accent_image="test.png",
        homeroom_teacher_id=test_teacher.roll_number
    )
    course.students.append(test_student)
    course.teachers.append(test_teacher)
    db_session.add(course)
    db_session.commit()

    # Override the get_current_user dependency to use the test_teacher
    from src.main import app
    from src.auth.dependencies import get_current_user
    app.dependency_overrides[get_current_user] = lambda: test_teacher

    attendance_data = {
        "attendance_data": [
            {"student_roll_number": test_student.roll_number, "status": "PRESENT"}
        ]
    }
    response = client.post(f"/v1/api/{course.id}/attendance", json=attendance_data)

    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    today = date.today().isoformat()
    assert data["message"] == f"Attendance for class {course.id} on {today} has been successfully recorded."

    # Verify attendance was recorded
    attendance_record = db_session.query(Attendance).filter_by(student_roll_number=test_student.roll_number).first()
    assert attendance_record is not None
    assert attendance_record.status.value == "PRESENT"

    # Clean up the override
    app.dependency_overrides = {}
