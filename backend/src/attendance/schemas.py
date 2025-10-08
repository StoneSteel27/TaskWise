from pydantic import BaseModel
from typing import List
from datetime import date

class AttendanceStatus(BaseModel):
    student_roll_number: str
    status: str # PRESENT, ABSENT, LEAVE

class AttendanceData(BaseModel):
    attendance_data: List[AttendanceStatus]

class PastAttendanceRecord(BaseModel):
    date: date
    status: str

class AttendanceHistory(BaseModel):
    history: List[PastAttendanceRecord]

class ClassAttendanceRecord(BaseModel):
    student_roll_number: str
    status: str

class ClassAttendanceHistory(BaseModel):
    records: List[ClassAttendanceRecord]

class TeacherAttendanceRecord(BaseModel):
    date: date
    check_in_time: str | None
    check_out_time: str | None

class TeacherAttendanceHistory(BaseModel):
    history: List[TeacherAttendanceRecord]
