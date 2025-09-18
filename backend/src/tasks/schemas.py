from pydantic import BaseModel
from src.users.schemas import User


class TaskSubmission(BaseModel):
    id: int
    task_id: int
    student_id: int
    content: str | None = None
    attachment_url: str | None = None
    student: User

    class Config:
        from_attributes = True
