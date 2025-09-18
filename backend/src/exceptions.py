from fastapi import HTTPException, status

class TaskNotFound(HTTPException):
    def __init__(self, task_id: str):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"message": "Task not found", "task_id": task_id},
        )

class CourseNotFound(HTTPException):
    def __init__(self, course_id: str):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"message": "Course not found", "course_id": course_id},
        )

class AnnouncementNotFound(HTTPException):
    def __init__(self, announcement_id: str):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"message": "Announcement not found", "announcement_id": announcement_id},
        )

class NotAuthorized(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"message": "You are not authorized to perform this action"},
        )

class SubmissionAlreadyExists(HTTPException):
    def __init__(self, task_id: str):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail={"message": "You have already submitted this task", "task_id": task_id},
        )

class NotACourseTeacher(HTTPException):
    def __init__(self, course_id: str):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"message": "You are not a teacher of this course", "course_id": course_id},
        )