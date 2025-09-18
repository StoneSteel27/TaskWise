from sqlalchemy import Column, String, ForeignKey, Table
from sqlalchemy.orm import relationship
from src.database import Base

student_course_association = Table(
    'student_course_association', Base.metadata,
    Column('student_roll_number', String, ForeignKey('users.roll_number'), primary_key=True),
    Column('course_id', String, ForeignKey('courses.id'), primary_key=True)
)

teacher_course_association = Table(
    'teacher_course_association', Base.metadata,
    Column('teacher_roll_number', String, ForeignKey('users.roll_number'), primary_key=True),
    Column('course_id', String, ForeignKey('courses.id'), primary_key=True)
)

class Course(Base):
    __tablename__ = "courses"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True)
    class_name = Column(String)
    accent_color = Column(String)
    accent_image = Column(String, nullable=True)
    homeroom_teacher_id = Column(String, ForeignKey("users.roll_number"))

    tasks = relationship("Task", back_populates="course")
    announcements = relationship("CourseAnnouncement", back_populates="course")
    students = relationship("User", secondary=student_course_association, back_populates="student_courses")
    teachers = relationship("User", secondary=teacher_course_association, back_populates="teacher_courses")
    homeroom_teacher = relationship("User", foreign_keys=[homeroom_teacher_id])
