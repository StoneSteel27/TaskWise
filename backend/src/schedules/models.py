from sqlalchemy import Column, String, Integer, Enum as SQLAlchemyEnum
from src.database import Base
import enum

class DayOfWeek(str, enum.Enum):
    MONDAY = "MONDAY"
    TUESDAY = "TUESDAY"
    WEDNESDAY = "WEDNESDAY"
    THURSDAY = "THURSDAY"
    FRIDAY = "FRIDAY"
    SATURDAY = "SATURDAY"

class Schedule(Base):
    __tablename__ = "schedules"
    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(String, index=True) # e.g., "10-A"
    day_of_week = Column(SQLAlchemyEnum(DayOfWeek))
    period = Column(Integer) # 1st period, 2nd period, etc.
    course_id = Column(String) # e.g., "MATH-10A"
