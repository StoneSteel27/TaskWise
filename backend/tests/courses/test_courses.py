from fastapi.testclient import TestClient
from src.auth.models import User
from src.courses.models import Course
from src.announcements.models import CourseAnnouncement
from src.tasks.models import Task
from datetime import datetime
import io

def test_get_course_dashboard(client: TestClient, test_student: User, db_session):
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

    # Create an announcement and a task for the course
    announcement = CourseAnnouncement(
        id="ANC-01",
        title="Test Announcement",
        description="Test Description",
        course_id=course.id,
        author_id=test_student.roll_number,
        created_at=datetime.now()
    )
    task = Task(
        id="TSK-01",
        title="Test Task",
        description="Test Description",
        course_id=course.id,
        author_id=test_student.roll_number,
        created_at=datetime.now(),
        deadline=datetime.now()
    )
    db_session.add_all([announcement, task])
    db_session.commit()

    response = client.get(f"/v1/api/courses/me/{course.id}/dashboard")

    assert response.status_code == 200
    data = response.json()
    assert "announcements" in data
    assert "tasks" in data
    assert len(data["announcements"]) == 1
    assert len(data["tasks"]) == 1
    assert data["announcements"][0]["title"] == "Test Announcement"
    assert data["tasks"][0]["title"] == "Test Task"

def test_search_in_course(client: TestClient, test_student: User, db_session):
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

    # Create an announcement and a task for the course
    announcement = CourseAnnouncement(
        id="ANC-01",
        title="Searchable Announcement",
        description="This is a test.",
        course_id=course.id,
        author_id=test_student.roll_number,
        created_at=datetime.now()
    )
    task = Task(
        id="TSK-01",
        title="Searchable Task",
        description="This is another test.",
        course_id=course.id,
        author_id=test_student.roll_number,
        created_at=datetime.now(),
        deadline=datetime.now()
    )
    db_session.add_all([announcement, task])
    db_session.commit()

    response = client.get(f"/v1/api/courses/me/{course.id}/search?q=Searchable")

    assert response.status_code == 200
    data = response.json()
    assert "announcements" in data
    assert "tasks" in data
    assert len(data["announcements"]) == 1
    assert len(data["tasks"]) == 1
    assert data["announcements"][0]["title"] == "Searchable Announcement"
    assert data["tasks"][0]["title"] == "Searchable Task"

def test_list_students_in_class(client: TestClient, test_student: User, db_session):
    # Create a course and add a student
    course = Course(
        id="TEST-101",
        name="Test Course",
        class_name="10-A",
        accent_color="#FFFFFF",
        accent_image="test.png",
        homeroom_teacher_id="teacher"
    )
    course.students.append(test_student)
    db_session.add(course)
    db_session.commit()

    response = client.get(f"/v1/api/courses/{course.id}/students")

    assert response.status_code == 200
    data = response.json()
    assert "students" in data
    assert len(data["students"]) == 1
    assert data["students"][0]["name"] == "Test Student"
    assert data["students"][0]["roll_number"] == "student"

def test_update_course_accent_image(client: TestClient, test_teacher: User, db_session):
    # Create a course and add a teacher
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

    accent_image_content = b"test accent image data"
    accent_image = io.BytesIO(accent_image_content)
    accent_image.name = "test_accent_image.png"

    response = client.put(
        f"/v1/api/courses/me/{course.id}/accent_image",
        files={"accent_image": (accent_image.name, accent_image, "image/png")}
    )

    assert response.status_code == 200
    db_session.refresh(course)
    assert course.accent_image == f"/assets/{course.id}/accent_image.png"