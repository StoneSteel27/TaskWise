from fastapi.testclient import TestClient
from src.auth.models import User, UserRole
from src.auth.service import get_password_hash

def test_login_for_access_token(client: TestClient, db_session):
    # Create a test user in the database
    user = User(
        roll_number="testuser",
        password=get_password_hash("password"),
        role=UserRole.STUDENT,
        name="Test User"
    )
    db_session.add(user)
    db_session.commit()

    # Attempt to login
    response = client.post(
        "/v1/api/login",
        data={"username": "testuser", "password": "password"}
    )

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "token_type" in data
    assert data["token_type"] == "bearer"

def test_login_invalid_credentials(client: TestClient):
    response = client.post(
        "/v1/api/login",
        data={"username": "wronguser", "password": "wrongpassword"}
    )
    assert response.status_code == 401
    data = response.json()
    assert data["detail"] == "Incorrect roll number or password"
