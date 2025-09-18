import uuid
from sqlalchemy import Column, String, ForeignKey, DateTime, Text, Integer
from sqlalchemy.orm import relationship
from src.database import Base
from sqlalchemy.dialects.postgresql import UUID


class SchoolAnnouncement(Base):
    __tablename__ = "school_announcements"
    id = Column(String, primary_key=True, default=lambda: f"SCH-ANC-{uuid.uuid4().hex[:6].upper()}")
    title = Column(String, index=True)
    description = Column(Text)
    created_at = Column(DateTime)
    author_id = Column(String, ForeignKey("users.roll_number"))
    author = relationship("User")
    attachments = relationship("SchoolAnnouncementAttachment", back_populates="announcement")


class SchoolAnnouncementAttachment(Base):
    __tablename__ = "school_announcement_attachments"
    id = Column(Integer, primary_key=True, index=True)
    announcement_id = Column(String, ForeignKey("school_announcements.id"))
    file_path = Column(String)
    announcement = relationship("SchoolAnnouncement", back_populates="attachments")


class CourseAnnouncement(Base):
    __tablename__ = "course_announcements"
    id = Column(String, primary_key=True, default=lambda: f"ANC-{uuid.uuid4().hex[:6].upper()}")
    title = Column(String, index=True)
    description = Column(Text)
    created_at = Column(DateTime)
    course_id = Column(String, ForeignKey("courses.id"))
    author_id = Column(String, ForeignKey("users.roll_number"))

    course = relationship("Course", back_populates="announcements")
    author = relationship("User")
    attachments = relationship("CourseAnnouncementAttachment", back_populates="announcement")


class CourseAnnouncementAttachment(Base):
    __tablename__ = "course_announcement_attachments"
    id = Column(Integer, primary_key=True, index=True)
    announcement_id = Column(String, ForeignKey("course_announcements.id"))
    file_path = Column(String)
    announcement = relationship("CourseAnnouncement", back_populates="attachments")
