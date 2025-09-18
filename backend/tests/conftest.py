import pytest
import os
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

os.environ["TESTING"] = "True"

from src.main import app
from src.database import Base, get_db
from src.auth.models import User, UserRole
from src.auth.service import get_password_hash

SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

@pytest.fixture(scope="function")
def db_session():
    """
    Create a new database session for each test.
    """
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


from src.auth.dependencies import get_current_user


@pytest.fixture(scope="function")
def client(db_session, test_student: User):
    """
    A client to test the API.
    """

    def override_get_db():
        try:
            db = TestingSessionLocal()
            yield db
        finally:
            db.close()

    def override_get_current_user():
        return test_student

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user
    yield TestClient(app)


@pytest.fixture(scope="function")
def test_student(db_session):
    """
    A student user for testing.
    """
    student = User(
        roll_number="student",
        password=get_password_hash("password"),
        role=UserRole.STUDENT,
        name="Test Student",
        classroom="10-A"
    )
    db_session.add(student)
    db_session.commit()
    return student


@pytest.fixture(scope="function")
def test_teacher(db_session):
    """
    A teacher user for testing.
    """
    teacher = User(
        roll_number="teacher",
        password=get_password_hash("password"),
        role=UserRole.TEACHER,
        name="Test Teacher"
    )
    db_session.add(teacher)
    db_session.commit()
    return teacher
