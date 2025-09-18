# Taskwise - School Task and Announcement Management System

Taskwise is a comprehensive web application designed to streamline communication and task management within a school environment. It provides a centralized platform for teachers, students, and administrators to manage announcements, tasks, attendance, and more.

## Features

*   **User Authentication:** Secure login for students, teachers, and principals with role-based access control.
*   **Announcements:**
    *   Principals can create and manage school-wide announcements.
    *   Teachers can post announcements for their specific courses.
*   **Course Management:**
    *   Teachers can view and manage their assigned courses.
    *   Students can view their enrolled courses.
*   **Task Management:**
    *   Teachers can create, assign, and grade tasks for their courses.
    *   Students can submit their work, view grades, and receive feedback.
*   **Attendance Tracking:**
    *   Teachers can take attendance for their classes.
    *   Students can view their attendance history.
    *   Teachers can check-in and check-out using WebAuthn for secure attendance.
*   **File Attachments:** Support for attaching files to announcements and task submissions.
*   **Dashboards:**
    *   Personalized dashboards for students and teachers to view their schedule, courses, and tasks.
    *   Course-specific dashboards with announcements and tasks.
*   **Admin Panel:** A powerful admin interface to manage users, courses, tasks, announcements, and other aspects of the system.

## Tech Stack

### Backend

*   **Framework:** FastAPI
*   **Language:** Python
*   **Database:** SQLAlchemy
*   **Authentication:** JWT (JSON Web Tokens) and WebAuthn
*   **Testing:** Pytest

### Frontend

*   **Framework:** React
*   **Language:** TypeScript
*   **Build Tool:** Vite
*   **Styling:** Tailwind CSS
*   **Data Fetching:** TanStack Query

## Getting Started

### Prerequisites

*   Python 3.11+
*   Node.js 20.x+

### Backend Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/taskwise.git
    cd taskwise/backend
    ```

2.  **Create a virtual environment and install dependencies:**
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
    pip install -e .
    ```

3.  **Run the development server:**
    ```bash
    uvicorn src.main:app --reload
    ```
    The backend server will be running at `http://127.0.0.1:8000`.

### Frontend Setup

1.  **Navigate to the frontend directory:**
    ```bash
    cd ../frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The frontend development server will be running at `http://localhost:5173`.

## Demo Data

The application includes a seeding script (`backend/src/seed.py`) that populates the database with a comprehensive set of demo data. This is useful for quickly setting up a development environment and exploring the application's features.

The seed script creates the following:

*   **Users:**
    *   A principal (`principal`)
    *   Multiple teachers with different subjects
    *   Students for each class
*   **Courses:** A variety of subjects for different classes.
*   **Announcements:** School-wide and course-specific announcements.
*   **Tasks:** Tasks for various courses.
*   **Attendance:** Sample attendance records for students.
*   **Schedules:** A daily schedule for each class.

When the backend server starts for the first time, it will automatically check if the database is empty and, if so, run the seed script to populate it.

## API Endpoints

The backend API provides the following main endpoints:

*   `POST /v1/api/login`: User login.
*   `GET /v1/api/me/schedule`: Get user's schedule.
*   `GET /v1/api/me/courses`: Get user's courses.
*   `GET /v1/api/me/school-announcements`: Get school-wide announcements.
*   `POST /v1/api/school-announcements/create`: Create a school-wide announcement.
*   `GET /v1/api/{course_id}/announcements`: Get course-specific announcements.
*   `POST /v1/api/{course_id}/announcements/create`: Create a course announcement.
*   `GET /v1/api/{course_id}/tasks`: Get tasks for a course.
*   `POST /v1/api/{course_id}/tasks/create`: Create a task.
*   `POST /v1/api/{course_id}/tasks/{task_id}/upload`: Submit a task.
*   `POST /v1/api/{class_code}/attendance`: Mark class attendance.
*   `GET /v1/api/me/attendance-history`: Get student attendance history.
*   `GET /v1/api/attendance/teacher/status`: Get teacher attendance status.
*   `POST /v1/api/attendance/teacher/check-in`: Teacher check-in.
*   `POST /v1/api/attendance/teacher/check-out`: Teacher check-out.

For a full list of API endpoints and their details, see the API documentation at `http://127.0.0.1:8000/docs` when the backend server is running.

## Running Tests

To run the backend tests, use the following command:

```bash
pytest
```

## Project Structure

The project is organized into two main directories: `backend` and `frontend`.

### Backend

```
backend/
├── src/
│   ├── announcements/
│   ├── assets/
│   ├── attachments/
│   ├── attendance/
│   ├── auth/
│   ├── courses/
│   ├── schedules/
│   ├── tasks/
│   ├── users/
│   ├── config.py
│   ├── database.py
│   ├── main.py
│   └── seed.py
└── tests/
```

*   **`src/`**: Contains the main application code, organized by feature.
*   **`tests/`**: Contains the tests for the backend.

### Frontend

```
frontend/
├── public/
└── src/
    ├── components/
    ├── context/
    ├── features/
    ├── services/
    ├── types/
    └── utils/
```

*   **`src/components/`**: Reusable UI components.
*   **`src/context/`**: React context providers.
*   **`src/features/`**: Application features, organized by domain.
*   **`src/services/`**: API client and related services.
*   **`src/types/`**: TypeScript type definitions.
*   **`src/utils/`**: Utility functions.

## Default Users

The application is seeded with two default users:

*   **Student:**
    *   **Roll Number:** `student`
    *   **Password:** `password`
*   **Teacher:**
    *   **Roll Number:** `teacher`
    *   **Password:** `password`

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue.