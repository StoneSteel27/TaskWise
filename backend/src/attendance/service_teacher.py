import base64
import webauthn
from datetime import date, datetime
from math import radians, sin, cos, sqrt, atan2
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from src.config import settings
from src.auth.models import User
from src.attendance.models import TeacherAttendance, WebAuthnCredential, RecoveryCode
from webauthn.helpers.structs import RegistrationCredential, AuthenticationCredential

# --- Geofencing ---
def is_within_geofence(lat: float, lon: float) -> bool:
    R = 6371.0  # Earth radius in kilometers

    lat1_rad = radians(settings.SCHOOL_LATITUDE)
    lon1_rad = radians(settings.SCHOOL_LONGITUDE)
    lat2_rad = radians(lat)
    lon2_rad = radians(lon)

    dlon = lon2_rad - lon1_rad
    dlat = lat2_rad - lat1_rad

    a = sin(dlat / 2)**2 + cos(lat1_rad) * cos(lat2_rad) * sin(dlon / 2)**2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    distance_km = R * c
    
    distance_meters = distance_km * 1000
    
    return distance_meters <= settings.SCHOOL_GEOFENCE_RADIUS_METERS

# --- Notification (Placeholder) ---
def trigger_notification_to_admins(message: str):
    # In a real app, this would use an email service, push notification, etc.
    print(f"NOTIFICATION TO ADMIN/PRINCIPAL: {message}")

# --- WebAuthn Credential Management ---
def get_webauthn_credential(db: Session, user: User) -> WebAuthnCredential | None:
    return db.query(WebAuthnCredential).filter_by(user_roll_number=user.roll_number).first()

# --- Teacher Attendance Logic ---
def check_in_teacher(db: Session, user: User, lat: float, lon: float, method: str):
    if not is_within_geofence(lat, lon):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not within the school premises.")
    
    today = date.today()
    existing_record = db.query(TeacherAttendance).filter_by(teacher_roll_number=user.roll_number, date=today).first()
    if existing_record:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="You have already checked in today.")

    new_record = TeacherAttendance(
        teacher_roll_number=user.roll_number,
        date=today,
        check_in_time=datetime.now(),
        check_in_method=method
    )
    db.add(new_record)
    db.commit()
    db.refresh(new_record)
    return new_record

def check_out_teacher(db: Session, user: User, lat: float, lon: float, method: str):
    if not is_within_geofence(lat, lon):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not within the school premises.")

    today = date.today()
    record = db.query(TeacherAttendance).filter_by(teacher_roll_number=user.roll_number, date=today).first()

    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="You have not checked in today.")
    if record.check_out_time:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="You have already checked out today.")

    record.check_out_time = datetime.now()
    record.check_out_method = method
    db.commit()
    db.refresh(record)
    return record

# --- Recovery Code ---
def verify_recovery_code(db: Session, user: User, code: str, lat: float, lon: float):
    # This requires a password hashing library, e.g., passlib from your auth service
    from src.auth.service import pwd_context
    
    codes = db.query(RecoveryCode).filter_by(user_roll_number=user.roll_number, is_used=False).all()
    
    valid_code = None
    for recovery_code in codes:
        if pwd_context.verify(code, recovery_code.code_hash):
            valid_code = recovery_code
            break
            
    if not valid_code:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or used recovery code.")
    
    # Mark as used before checking in
    valid_code.is_used = True
    db.commit()

    # Trigger notification
    trigger_notification_to_admins(f"Teacher {user.name} ({user.roll_number}) used a recovery code to check in.")
    
    # Perform check-in
    return check_in_teacher(db, user, lat, lon, method="RECOVERY_CODE")

def get_teacher_attendance_status(db: Session, user: User):
    today = date.today()
    
    # Check for device registration
    credential = get_webauthn_credential(db, user)
    is_device_registered = credential is not None
    
    # Check for attendance record
    record = db.query(TeacherAttendance).filter_by(teacher_roll_number=user.roll_number, date=today).first()
    
    status = "Not Checked In"
    check_in_time = None
    check_out_time = None
    
    if record:
        status = "Checked In"
        check_in_time = record.check_in_time
        if record.check_out_time:
            status = "Checked Out"
            check_out_time = record.check_out_time
            
    return {
        "status": status,
        "check_in_time": check_in_time,
        "check_out_time": check_out_time,
        "is_device_registered": is_device_registered
    }