import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from starlette.middleware.sessions import SessionMiddleware
from src.database import engine, Base, SessionLocal, get_db, get_async_db
from src.auth.router import router as auth_router
from src.users.router import router as users_router
from src.announcements.router import router as announcements_router
from src.courses.router import router as courses_router
from src.tasks.router import router as tasks_router
from src.attendance.router import router as attendance_router
from src.attendance.router_teacher import router as teacher_attendance_router
from src.attachments.router import router as attachments_router
from src.assets.router import router as assets_router
from src.seed import seed_data
from src.exceptions import TaskNotFound, CourseNotFound, AnnouncementNotFound, NotAuthorized, SubmissionAlreadyExists

# --- START: Added imports for Admin Panel ---
from crudadmin import CRUDAdmin
from crudadmin.admin_interface.model_view import PasswordTransformer

# Import all models to make them available to the admin panel
from src.auth.models import User
from src.courses.models import Course
from src.announcements.models import SchoolAnnouncement, CourseAnnouncement
from src.tasks.models import Task, Submission
from src.attendance.models import Attendance
from src.schedules.models import Schedule

# Import the new admin schemas and the password hasher
from src.admin_schemas import (
    UserAdminCreate, UserAdminUpdate, CourseAdmin, SchoolAnnouncementAdmin,
    CourseAnnouncementAdmin, TaskAdmin, SubmissionAdminUpdate, AttendanceAdmin, ScheduleAdmin
)
from src.auth.service import get_password_hash
# --- END: Added imports for Admin Panel ---


# --- START: Admin Panel Configuration ---
# 1. Define a password hasher for the admin panel to use when creating/updating users
def hash_password(password: str) -> str:
    return get_password_hash(password)


# 2. Create the PasswordTransformer to securely handle user passwords in the admin form
password_transformer = PasswordTransformer(
    password_field="password",  # Field name in the Pydantic schema
    hashed_field="password",  # Field name in the SQLAlchemy User model
    hash_function=hash_password,
    required_fields=["roll_number", "name", "role"]
)

# 3. Create the CRUDAdmin instance
# It will use a separate SQLite database ('school_admin.db') for its own users and sessions.
admin = CRUDAdmin(
    session=get_async_db,  # Use your app's existing database session dependency
    SECRET_KEY=os.environ.get("ADMIN_SECRET_KEY", "a-very-secret-key-for-dev"),
    admin_db_path="./school_admin.db",  # A separate SQLite DB for admin users
    initial_admin={
        "username": "admin",
        "password": "admin"  # IMPORTANT: Change this in production!
    }
)

# 4. Add "views" for each of your models to give the admin full control
# User Management (Students, Teachers, Principals)
admin.add_view(
    model=User,
    create_schema=UserAdminCreate,
    update_schema=UserAdminUpdate,
    password_transformer=password_transformer
)

# Course Management
admin.add_view(model=Course, create_schema=CourseAdmin, update_schema=CourseAdmin)

# Task Management
admin.add_view(model=Task, create_schema=TaskAdmin, update_schema=TaskAdmin)

# Submission Management (Admins can view, update status, or delete)
admin.add_view(
    model=Submission,
    create_schema=None,  # Admins shouldn't create submissions from scratch
    update_schema=SubmissionAdminUpdate,
    allowed_actions={"view", "update", "delete"}
)

# School-wide Announcements
admin.add_view(
    model=SchoolAnnouncement,
    create_schema=SchoolAnnouncementAdmin,
    update_schema=SchoolAnnouncementAdmin
)

# Course-specific Announcements
admin.add_view(
    model=CourseAnnouncement,
    create_schema=CourseAnnouncementAdmin,
    update_schema=CourseAnnouncementAdmin
)

# Attendance Management
admin.add_view(
    model=Attendance,
    create_schema=AttendanceAdmin,
    update_schema=AttendanceAdmin
)

# Class Schedule Management
admin.add_view(
    model=Schedule,
    create_schema=ScheduleAdmin,
    update_schema=ScheduleAdmin
)


# --- END: Admin Panel Configuration ---


# --- MODIFIED: Use lifespan for startup tasks ---
# NOTE: The database creation and data seeding from your original file have been moved here.
# This is the modern, correct way to handle startup tasks in FastAPI and is necessary
# for the admin panel's async initialization to work properly.
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create database tables for your main application
    Base.metadata.create_all(bind=engine)

    # Create seed data only if not in a test environment
    if os.environ.get("TESTING") != "True":
        seed_data()

    # Initialize the admin interface (creates the admin DB and initial user)
    await admin.initialize()

    # Let the app run
    yield
    # (Code for shutdown tasks can go here)
app = FastAPI(lifespan=lifespan)

# Add middleware for session support (needed for challenge storage)
app.add_middleware(SessionMiddleware, secret_key="a-very-secret-key-for-dev-change-it")


@app.exception_handler(TaskNotFound)
async def task_not_found_exception_handler(request: Request, exc: TaskNotFound):
    return JSONResponse(
        status_code=exc.status_code,
        content=exc.detail,
    )


@app.exception_handler(CourseNotFound)
async def course_not_found_exception_handler(request: Request, exc: CourseNotFound):
    return JSONResponse(
        status_code=exc.status_code,
        content=exc.detail,
    )


@app.exception_handler(AnnouncementNotFound)
async def announcement_not_found_exception_handler(request: Request, exc: AnnouncementNotFound):
    return JSONResponse(
        status_code=exc.status_code,
        content=exc.detail,
    )


@app.exception_handler(NotAuthorized)
async def not_authorized_exception_handler(request: Request, exc: NotAuthorized):
    return JSONResponse(
        status_code=exc.status_code,
        content=exc.detail,
    )


@app.exception_handler(SubmissionAlreadyExists)
async def submission_already_exists_exception_handler(request: Request, exc: SubmissionAlreadyExists):
    return JSONResponse(
        status_code=exc.status_code,
        content=exc.detail,
    )


app.include_router(auth_router, prefix="/v1/api", tags=["auth"])
app.include_router(users_router, prefix="/v1/api", tags=["users"])
app.include_router(announcements_router, prefix="/v1/api", tags=["announcements"])
app.include_router(courses_router, prefix="/v1/api", tags=["courses"])
app.include_router(tasks_router, prefix="/v1/api", tags=["tasks"])
app.include_router(attendance_router, prefix="/v1/api", tags=["attendance"])
app.include_router(attachments_router, prefix="/v1/api", tags=["attachments"])
app.include_router(assets_router,prefix="/v1/api", tags=["assets"])
app.include_router(teacher_attendance_router, prefix="/v1/api")

app.mount("/admin", admin.app)

@app.get("/")
def read_root():
    return {"message": "Welcome to TaskWise Backend"}
