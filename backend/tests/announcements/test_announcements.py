from fastapi.testclient import TestClient
from src.auth.models import User
from src.announcements.models import SchoolAnnouncement, CourseAnnouncement
from src.courses.models import Course
from datetime import datetime
import io

def test_get_school_announcements(client: TestClient, test_student: User, db_session):
    # Create a school-wide announcement
    announcement = SchoolAnnouncement(
        id="SCH-ANC-001",
        title="Independence Day Celebration",
        description="All students are requested to assemble in the main ground tomorrow at 9:00 AM for the Independence Day flag hoisting ceremony.",
        author_id=test_student.roll_number,
        created_at=datetime.now()
    )
    db_session.add(announcement)
    db_session.commit()

    response = client.get("/v1/api/me/school-announcements")

    assert response.status_code == 200
    data = response.json()
    # This is a list of announcements, not a dict with an "announcements" key
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["announcement_id"] == "SCH-ANC-001"
    assert data[0]["title"] == "Independence Day Celebration"

def test_get_school_announcement(client: TestClient, test_student: User, db_session):
    announcement = SchoolAnnouncement(
        id="SCH-ANC-002",
        title="Test Announcement",
        description="Test Description",
        author_id=test_student.roll_number,
        created_at=datetime.now()
    )
    db_session.add(announcement)
    db_session.commit()

    response = client.get(f"/v1/api/school-announcements/{announcement.id}")

    assert response.status_code == 200
    data = response.json()
    assert data["announcement_id"] == "SCH-ANC-002"
    assert data["title"] == "Test Announcement"

def test_create_school_announcement(client: TestClient, test_teacher: User, db_session):
    from src.main import app
    from src.auth.dependencies import get_current_user
    app.dependency_overrides[get_current_user] = lambda: test_teacher

    response = client.post(
        "/v1/api/school-announcements/create",
        data={"title": "New School Announcement", "description": "This is a test"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "School-wide announcement created successfully."
    assert "announcement_id" in data

    app.dependency_overrides = {}

def test_update_school_announcement(client: TestClient, test_teacher: User, db_session):
    announcement = SchoolAnnouncement(
        id="SCH-ANC-003",
        title="Old Title",
        description="Old Description",
        author_id=test_teacher.roll_number,
        created_at=datetime.now()
    )
    db_session.add(announcement)
    db_session.commit()

    from src.main import app
    from src.auth.dependencies import get_current_user
    app.dependency_overrides[get_current_user] = lambda: test_teacher

    response = client.put(
        f"/v1/api/school-announcements/{announcement.id}/update",
        data={"title": "New Title", "description": "New Description"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "School-wide announcement updated successfully."
    db_session.refresh(announcement)
    assert announcement.title == "New Title"

    app.dependency_overrides = {}

def test_delete_school_announcement(client: TestClient, test_teacher: User, db_session):
    announcement = SchoolAnnouncement(
        id="SCH-ANC-004",
        title="To Be Deleted",
        description="To Be Deleted",
        author_id=test_teacher.roll_number,
        created_at=datetime.now()
    )
    db_session.add(announcement)
    db_session.commit()

    from src.main import app
    from src.auth.dependencies import get_current_user
    app.dependency_overrides[get_current_user] = lambda: test_teacher

    response = client.delete(f"/v1/api/school-announcements/{announcement.id}/delete")

    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "School-wide announcement deleted successfully."
    
    deleted_ann = db_session.query(SchoolAnnouncement).filter_by(id="SCH-ANC-004").first()
    assert deleted_ann is None

    app.dependency_overrides = {}

def test_create_course_announcement(client: TestClient, test_teacher: User, db_session):
    course = Course(id="COURSE-1", name="Test Course", class_name="10-A", homeroom_teacher_id=test_teacher.roll_number)
    db_session.add(course)
    db_session.commit()

    from src.main import app
    from src.auth.dependencies import get_current_user
    app.dependency_overrides[get_current_user] = lambda: test_teacher

    response = client.post(
        f"/v1/api/{course.id}/announcements/create",
        data={"title": "Course Announcement", "description": "For the course"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Announcement created successfully."
    assert "announcement_id" in data

    app.dependency_overrides = {}

def test_create_and_download_school_announcement_attachment(client: TestClient, test_teacher: User, db_session):
    from src.main import app
    from src.auth.dependencies import get_current_user
    app.dependency_overrides[get_current_user] = lambda: test_teacher

    file_content = b"school announcement attachment"
    file_name = "school_attachment.txt"

    response = client.post(
        "/v1/api/school-announcements/create",
        data={"title": "School Announcement with Attachment", "description": "Test Description"},
        files={"files": (file_name, io.BytesIO(file_content), "text/plain")}
    )

    assert response.status_code == 200
    data = response.json()
    announcement_id = data["announcement_id"]

    # Now, download the attachment
    download_response = client.get(f"/v1/api/school-announcements/{announcement_id}/attachments/{file_name}")
    
    assert download_response.status_code == 200
    assert download_response.content == file_content

    app.dependency_overrides = {}

def test_create_and_download_course_announcement_attachment(client: TestClient, test_teacher: User, db_session):
    course = Course(id="COURSE-2", name="Another Test Course", class_name="10-B", homeroom_teacher_id=test_teacher.roll_number)
    db_session.add(course)
    db_session.commit()

    from src.main import app
    from src.auth.dependencies import get_current_user
    app.dependency_overrides[get_current_user] = lambda: test_teacher

    file_content = b"course announcement attachment"
    file_name = "course_attachment.txt"

    response = client.post(
        f"/v1/api/{course.id}/announcements/create",
        data={"title": "Course Announcement with Attachment", "description": "Test Description"},
        files={"files": (file_name, io.BytesIO(file_content), "text/plain")}
    )

    assert response.status_code == 200
    data = response.json()
    announcement_id = data["announcement_id"]

    # Now, download the attachment
    download_response = client.get(f"/v1/api/courses/{course.id}/announcements/{announcement_id}/attachments/{file_name}")
    
    assert download_response.status_code == 200
    assert download_response.content == file_content

    app.dependency_overrides = {}
