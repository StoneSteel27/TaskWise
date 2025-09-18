import pytest
from fastapi.testclient import TestClient
from src.main import app
from src.database import get_db
from src.auth.dependencies import get_current_user
from src.auth.models import User
from tests.conftest import TestingSessionLocal, test_student, test_teacher

from src.dependencies import get_uploads_dir
from pathlib import Path

@pytest.fixture
def client_factory(db_session):
    def _factory(user: User, uploads_dir: Path):
        def override_get_db():
            try:
                db = TestingSessionLocal()
                yield db
            finally:
                db.close()

        def override_get_current_user():
            return user
        
        def override_get_uploads_dir():
            return uploads_dir

        app.dependency_overrides[get_db] = override_get_db
        app.dependency_overrides[get_current_user] = override_get_current_user
        app.dependency_overrides[get_uploads_dir] = override_get_uploads_dir
        return TestClient(app)
    
    yield _factory
    
    # Clean up overrides after test
    app.dependency_overrides = {}


def test_download_school_announcement_attachment(client_factory, test_student, tmp_path):
    # Setup: Create dummy file in tmp_path
    announcement_id = "SCH-ANC-001"
    file_name = "test_attachment.pdf"
    file_content = b"test content"
    
    uploads_dir = tmp_path / "school_announcements" / announcement_id
    uploads_dir.mkdir(parents=True)
    (uploads_dir / file_name).write_bytes(file_content)

    client = client_factory(test_student, tmp_path)
    response = client.get(f"/v1/api/school-announcements/{announcement_id}/attachments/{file_name}")
    
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert response.content == file_content

def test_download_school_announcement_attachment_not_found(client_factory, test_student, tmp_path):
    client = client_factory(test_student, tmp_path)
    response = client.get("/v1/api/school-announcements/SCH-ANC-001/attachments/non_existent.pdf")
    assert response.status_code == 404

def test_download_course_announcement_attachment(client_factory, test_student, tmp_path):
    course_id = "MATH-10A"
    announcement_id = "ANC-01"
    file_name = "course_attachment.txt"
    file_content = b"test content"

    uploads_dir = tmp_path / "courses" / course_id / "announcements" / announcement_id
    uploads_dir.mkdir(parents=True)
    (uploads_dir / file_name).write_bytes(file_content)

    client = client_factory(test_student, tmp_path)
    response = client.get(f"/v1/api/courses/{course_id}/announcements/{announcement_id}/attachments/{file_name}")
    
    assert response.status_code == 200
    assert response.headers["content-type"] == "text/plain; charset=utf-8"
    assert response.content == file_content

def test_download_task_attachment(client_factory, test_student, tmp_path):
    course_id = "MATH-10A"
    task_id = "TSK-01"
    file_name = "task_attachment.jpg"
    file_content = b"test content"

    uploads_dir = tmp_path / "courses" / course_id / "tasks" / task_id / "attachments"
    uploads_dir.mkdir(parents=True)
    (uploads_dir / file_name).write_bytes(file_content)

    client = client_factory(test_student, tmp_path)
    response = client.get(f"/v1/api/courses/{course_id}/tasks/{task_id}/attachments/{file_name}")
    
    assert response.status_code == 200
    assert response.headers["content-type"] == "image/jpeg"
    assert response.content == file_content

def test_download_own_task_submission(client_factory, test_student, tmp_path):
    course_id = "MATH-10A"
    task_id = "TSK-01"
    file_name = "submission.txt"
    file_content = b"test content"

    uploads_dir = tmp_path / "courses" / course_id / "tasks" / task_id / "submissions" / test_student.roll_number
    uploads_dir.mkdir(parents=True)
    (uploads_dir / file_name).write_bytes(file_content)

    client = client_factory(test_student, tmp_path)
    response = client.get(f"/v1/api/courses/{course_id}/tasks/{task_id}/submission/download")
    
    assert response.status_code == 200
    assert response.headers["content-type"] == "text/plain; charset=utf-8"
    assert response.content == file_content

def test_download_student_task_submission_as_teacher(client_factory, test_teacher, test_student, tmp_path):
    course_id = "MATH-10A"
    task_id = "TSK-01"
    student_roll_number = test_student.roll_number
    file_name = "submission.txt"
    file_content = b"test content"

    uploads_dir = tmp_path / "courses" / course_id / "tasks" / task_id / "submissions" / student_roll_number
    uploads_dir.mkdir(parents=True)
    (uploads_dir / file_name).write_bytes(file_content)

    client = client_factory(test_teacher, tmp_path)
    response = client.get(f"/v1/api/courses/{course_id}/tasks/{task_id}/submissions/{student_roll_number}/download")
    
    assert response.status_code == 200
    assert response.headers["content-type"] == "text/plain; charset=utf-8"
    assert response.content == file_content

def test_download_student_task_submission_as_student_forbidden(client_factory, test_student, tmp_path):
    course_id = "MATH-10A"
    task_id = "TSK-01"
    # Note: The student is trying to access a submission for a user named "teacher"
    # This is to test the authorization logic.
    student_roll_number_to_access = "teacher" 
    file_name = "submission.txt"
    file_content = b"test content"

    uploads_dir = tmp_path / "courses" / course_id / "tasks" / task_id / "submissions" / student_roll_number_to_access
    uploads_dir.mkdir(parents=True)
    (uploads_dir / file_name).write_bytes(file_content)

    client = client_factory(test_student, tmp_path)
    response = client.get(f"/v1/api/courses/{course_id}/tasks/{task_id}/submissions/{student_roll_number_to_access}/download")
    
    assert response.status_code == 403
