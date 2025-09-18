from sqlalchemy import Column, String, Enum as SQLAlchemyEnum
from sqlalchemy.orm import relationship
from src.database import Base
from src.courses.models import student_course_association, teacher_course_association
import enum

class UserRole(str, enum.Enum):
    STUDENT = "STUDENT"
    TEACHER = "TEACHER"
    PRINCIPAL = "PRINCIPAL"
    ADMIN = "ADMIN"

class User(Base):
    __tablename__ = "users"

    roll_number = Column(String, primary_key=True, index=True)
    password = Column(String)
    role = Column(SQLAlchemyEnum(UserRole))
    name = Column(String)
    classroom = Column(String, nullable=True) # e.g. 10-A
    email = Column(String, nullable=True)
    phone_personal = Column(String, nullable=True)
    phone_mother = Column(String, nullable=True)
    phone_father = Column(String, nullable=True)
    home_address = Column(String, nullable=True)

    student_courses = relationship("Course", secondary=student_course_association, back_populates="students")
    teacher_courses = relationship("Course", secondary=teacher_course_association, back_populates="teachers")
    submissions = relationship("Submission", back_populates="student")
