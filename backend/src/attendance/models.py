from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, Date, Enum as SQLAlchemyEnum, LargeBinary, Boolean
from sqlalchemy.orm import relationship
from src.database import Base
import enum


class AttendanceStatusEnum(str, enum.Enum):
    PRESENT = "PRESENT"
    ABSENT = "ABSENT"
    LEAVE = "LEAVE"

class Attendance(Base):
    __tablename__ = "attendance"
    id = Column(Integer, primary_key=True, index=True)
    student_roll_number = Column(String, ForeignKey("users.roll_number"))
    date = Column(Date)
    status = Column(SQLAlchemyEnum(AttendanceStatusEnum))
    class_code = Column(String) # e.g., "10-A"


class TeacherAttendance(Base):
    __tablename__ = "teacher_attendance"
    id = Column(Integer, primary_key=True, index=True)
    teacher_roll_number = Column(String, ForeignKey("users.roll_number"))
    date = Column(Date, index=True)
    check_in_time = Column(DateTime)
    check_out_time = Column(DateTime, nullable=True)
    check_in_method = Column(String) # e.g., 'WEBAUTHN_MOBILE', 'RECOVERY_CODE'
    check_out_method = Column(String, nullable=True)

    teacher = relationship("User")

class WebAuthnCredential(Base):
    __tablename__ = "webauthn_credentials"
    id = Column(Integer, primary_key=True, index=True)
    user_roll_number = Column(String, ForeignKey("users.roll_number"), unique=True) # Assuming one credential per teacher for simplicity
    credential_id = Column(LargeBinary, unique=True, index=True)
    public_key = Column(LargeBinary)
    sign_count = Column(Integer, default=0)
    # Storing transports can help enforce mobile-only, but client-side hints are more practical
    transports = Column(String, nullable=True) 
    
    user = relationship("User")

class RecoveryCode(Base):
    __tablename__ = "recovery_codes"
    id = Column(Integer, primary_key=True, index=True)
    user_roll_number = Column(String, ForeignKey("users.roll_number"))
    code_hash = Column(String, unique=True) # Store hash, not plaintext
    is_used = Column(Boolean, default=False)

    user = relationship("User")
