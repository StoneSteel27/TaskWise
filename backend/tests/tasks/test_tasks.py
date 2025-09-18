from fastapi.testclient import TestClient
from src.auth.models import User
from src.courses.models import Course
from src.tasks.models import Task
from datetime import datetime, timedelta
import io

def test_create_task(client: TestClient, test_teacher: User, db_session):
    # Create a course
    course = Course(
        id="TEST-101",
        name="Test Course",
        class_name="10-A",
        accent_color="#FFFFFF",
        accent_image="test.png",
        homeroom_teacher_id=test_teacher.roll_number
    )
    db_session.add(course)
    db_session.commit()

    # Override the get_current_user dependency to use the test_teacher
    from src.main import app
    from src.auth.dependencies import get_current_user
    app.dependency_overrides[get_current_user] = lambda: test_teacher

    deadline = (datetime.now() + timedelta(days=7)).isoformat()
    response = client.post(
        f"/v1/api/{course.id}/tasks/create",
        data={"title": "Test Task", "description": "Test Description", "deadline": deadline},
    )

    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "task_id" in data
    assert data["message"] == "Task created successfully."

    # Clean up the override
    app.dependency_overrides = {}

def test_get_task_details(client: TestClient, test_student: User, test_teacher: User, db_session):
    # Create a course and a task
    course = Course(id="TEST-101", name="Test Course", class_name="10-A", homeroom_teacher_id=test_teacher.roll_number)
    task = Task(id="TSK-01", title="Test Task", description="Test Description", course_id=course.id, author_id=test_teacher.roll_number, created_at=datetime.now(), deadline=datetime.now())
    db_session.add_all([course, task, test_teacher])
    db_session.commit()

    response = client.get(f"/v1/api/{course.id}/tasks/{task.id}")

    assert response.status_code == 200
    data = response.json()
    assert data["task_id"] == "TSK-01"
    assert data["title"] == "Test Task"

def test_upload_task_submission(client: TestClient, test_student: User, db_session):
    # Create a course and a task
    course = Course(id="TEST-101", name="Test Course", class_name="10-A", homeroom_teacher_id="teacher")
    task = Task(id="TSK-01", title="Test Task", description="Test Description", course_id=course.id, author_id="teacher", created_at=datetime.now(), deadline=datetime.now())
    db_session.add_all([course, task])
    db_session.commit()

    file_content = b"test file content"
    response = client.post(
        f"/v1/api/{course.id}/tasks/{task.id}/upload",
        files={"file": ("test.txt", io.BytesIO(file_content), "text/plain")},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "File uploaded successfully."
    assert data["new_status"] == "SUBMITTED"

def test_update_task(client: TestClient, test_teacher: User, db_session):
    # Create a course and a task
    course = Course(id="TEST-101", name="Test Course", class_name="10-A", homeroom_teacher_id=test_teacher.roll_number)
    task = Task(id="TSK-01", title="Old Title", description="Old Description", course_id=course.id, author_id=test_teacher.roll_number, created_at=datetime.now(), deadline=datetime.now())
    db_session.add_all([course, task])
    db_session.commit()

    # Override the get_current_user dependency to use the test_teacher
    from src.main import app
    from src.auth.dependencies import get_current_user
    app.dependency_overrides[get_current_user] = lambda: test_teacher

    deadline = (datetime.now() + timedelta(days=8)).isoformat()
    response = client.put(
        f"/v1/api/{course.id}/tasks/{task.id}/update",
        data={"title": "New Title", "description": "New Description", "deadline": deadline},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Task updated successfully."
    
    db_session.refresh(task)
    assert task.title == "New Title"

    # Clean up the override
    app.dependency_overrides = {}

def test_delete_task(client: TestClient, test_teacher: User, db_session):
    # Create a course and a task
    course = Course(id="TEST-101", name="Test Course", class_name="10-A", homeroom_teacher_id=test_teacher.roll_number)
    task = Task(id="TSK-01", title="Test Task", description="Test Description", course_id=course.id, author_id=test_teacher.roll_number, created_at=datetime.now(), deadline=datetime.now())
    db_session.add_all([course, task])
    db_session.commit()

    # Override the get_current_user dependency to use the test_teacher
    from src.main import app
    from src.auth.dependencies import get_current_user
    app.dependency_overrides[get_current_user] = lambda: test_teacher

    response = client.delete(f"/v1/api/{course.id}/tasks/{task.id}/delete")

    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Task deleted successfully."

    # Verify the task is deleted
    deleted_task = db_session.query(Task).filter(Task.id == "TSK-01").first()
    assert deleted_task is None

    # Clean up the override
    app.dependency_overrides = {}

def test_create_and_download_task_attachment(client: TestClient, test_teacher: User, db_session):
    # Create a course
    course = Course(
        id="TEST-101",
        name="Test Course",
        class_name="10-A",
        accent_color="#FFFFFF",
        accent_image="test.png",
        homeroom_teacher_id=test_teacher.roll_number
    )
    db_session.add(course)
    db_session.commit()

    # Override the get_current_user dependency to use the test_teacher
    from src.main import app
    from src.auth.dependencies import get_current_user
    app.dependency_overrides[get_current_user] = lambda: test_teacher

    deadline = (datetime.now() + timedelta(days=7)).isoformat()
    file_content = b"task attachment content"
    file_name = "task_attachment.txt"

    response = client.post(
        f"/v1/api/{course.id}/tasks/create",
        data={"title": "Task with Attachment", "description": "Test Description", "deadline": deadline},
        files={"files": (file_name, io.BytesIO(file_content), "text/plain")}
    )

    assert response.status_code == 200
    data = response.json()
    task_id = data["task_id"]

    # Now, download the attachment
    download_response = client.get(f"/v1/api/courses/{course.id}/tasks/{task_id}/attachments/{file_name}")
    
    assert download_response.status_code == 200
    assert download_response.content == file_content

    # Clean up the override
    app.dependency_overrides = {}