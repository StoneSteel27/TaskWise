# TaskWise Backend

This is a FastAPI backend for a School Tasks and Announcements application.

## Setup

1.  **Install dependencies:**
    ```bash
    uv pip install -e .
    ```

2.  **Run the server:**
    ```bash
    uvicorn src.main:app --reload
    ```

The server will be running at `http://127.0.0.1:8000`.

## API Documentation

API documentation is available at `http://127.0.0.1:8000/docs` when the server is running.

## Default Users

Two default users are created on startup:
-   **Student:**
    -   `roll_number`: student
    -   `password`: password
-   **Teacher:**
    -   `roll_number`: teacher
    -   `password`: password
