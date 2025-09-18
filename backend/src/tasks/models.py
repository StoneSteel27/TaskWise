import uuid
from sqlalchemy import Column, String, ForeignKey, Integer, DateTime, Text, Enum as SQLAlchemyEnum
from sqlalchemy.orm import relationship
from src.database import Base
import enum


class TaskStatus(str, enum.Enum):
    PENDING = "PENDING"
    SUBMITTED = "SUBMITTED"
    APPROVED = "APPROVED"
    DELAYED = "DELAYED"


class Grade(str, enum.Enum):
    S = "S"
    A = "A"
    B = "B"
    C = "C"
    D = "D"


class Task(Base):
    __tablename__ = "tasks"
    id = Column(String, primary_key=True, default=lambda: f"TSK-{uuid.uuid4().hex[:6].upper()}")
    title = Column(String, index=True)
    description = Column(Text)
    created_at = Column(DateTime)
    deadline = Column(DateTime)
    course_id = Column(String, ForeignKey("courses.id"))
    author_id = Column(String, ForeignKey("users.roll_number"))

    course = relationship("Course", back_populates="tasks")
    author = relationship("User")
    attachments = relationship("TaskAttachment", back_populates="task")
    submissions = relationship("Submission", back_populates="task")


class TaskAttachment(Base):
    __tablename__ = "task_attachments"
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(String, ForeignKey("tasks.id"))
    file_path = Column(String)
    task = relationship("Task", back_populates="attachments")


class Submission(Base):
    __tablename__ = "submissions"
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(String, ForeignKey("tasks.id"))
    student_id = Column(String, ForeignKey("users.roll_number"))
    submitted_at = Column(DateTime)
    status = Column(SQLAlchemyEnum(TaskStatus), default=TaskStatus.SUBMITTED)
    rejection_reason = Column(Text, nullable=True)
    grade = Column(SQLAlchemyEnum(Grade), nullable=True)
    remarks = Column(Text, nullable=True)

    task = relationship("Task", back_populates="submissions")
    student = relationship("User", back_populates="submissions")
    attachments = relationship("SubmissionAttachment", back_populates="submission")

class SubmissionAttachment(Base):
    __tablename__ = "submission_attachments"
    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("submissions.id"))
    file_path = Column(String)
    submission = relationship("Submission", back_populates="attachments")

#TODO: Implement post-deadline submission logic
