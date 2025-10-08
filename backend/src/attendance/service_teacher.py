import base64
import webauthn
from datetime import date, datetime
from sqlalchemy.orm import Session
from sqlalchemy import extract
from fastapi import HTTPException, status

from src.auth.models import User
from src.attendance.models import TeacherAttendance, WebAuthnCredential, RecoveryCode
from webauthn.helpers.structs import RegistrationCredential, AuthenticationCredential

from src.geofence import service as geofence_service


# --- Geofencing ---
def is_within_geofence(db: Session, lat: float, lon: float) -> bool:
    all_geofences = geofence_service.get_all_geofences(db)
    if not all_geofences:
        # If no geofence is defined, deny access for safety.
        return False

    for geofence in all_geofences:
        if geofence_service.is_point_in_geofence(geofence, lat, lon):
            return True

    return False


# --- Notification (Placeholder) ---
def trigger_notification_to_admins(message: str):
    # In a real app, this would use an email service, push notification, etc.
    print(f"NOTIFICATION TO ADMIN/PRINCIPAL: {message}")


# --- WebAuthn Credential Management ---
def get_webauthn_credential(db: Session, user: User) -> WebAuthnCredential | None:
    return db.query(WebAuthnCredential).filter_by(user_roll_number=user.roll_number).first()


# --- Teacher Attendance Logic ---
def check_in_teacher(db: Session, user: User, lat: float, lon: float, method: str):
    if not is_within_geofence(db, lat, lon):
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
    if not is_within_geofence(db, lat, lon):
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
def verify_recovery_code(db: Session, user: User, code: str, lat: float, lon: float, reason: str):
    # This requires a password hashing library, e.g., passlib from your auth service
    from src.auth.service import pwd_context

    if not is_within_geofence(db, lat, lon):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not within the school premises.")

    codes = db.query(RecoveryCode).filter_by(user_roll_number=user.roll_number, is_used=False).all()

    valid_code = None
    for recovery_code in codes:
        if pwd_context.verify(code, recovery_code.code_hash):
            valid_code = recovery_code
            break

    if not valid_code:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or used recovery code.")

    # Mark as used and save the reason before checking in
    valid_code.is_used = True
    valid_code.reason = reason
    db.commit()

    # Trigger notification
    trigger_notification_to_admins(
        f"Teacher {user.name} ({user.roll_number}) used a recovery code to check in for the following reason: {reason}")

    # Perform check-in
    return check_in_teacher(db, user, lat, lon, method="RECOVERY_CODE")


def verify_recovery_code_for_checkout(db: Session, user: User, code: str, lat: float, lon: float,
                                      reason: str | None = None):
    # This requires a password hashing library, e.g., passlib from your auth service
    from src.auth.service import pwd_context

    if not is_within_geofence(db, lat, lon):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not within the school premises.")

    codes = db.query(RecoveryCode).filter_by(user_roll_number=user.roll_number, is_used=False).all()

    valid_code = None
    for recovery_code in codes:
        if pwd_context.verify(code, recovery_code.code_hash):
            valid_code = recovery_code
            break

    if not valid_code:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or used recovery code.")

    # Mark as used and save the reason before checking out
    valid_code.is_used = True
    if reason:
        valid_code.reason = reason
    db.commit()

    # Trigger notification
    trigger_notification_to_admins(f"Teacher {user.name} ({user.roll_number}) used a recovery code to check out.")

    # Perform check-out
    return check_out_teacher(db, user, lat, lon, method="RECOVERY_CODE")


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


def get_teacher_attendance_history(db: Session, user: User, year: int, month: int):
    records = db.query(TeacherAttendance).filter(
        TeacherAttendance.teacher_roll_number == user.roll_number,
        extract('year', TeacherAttendance.date) == year,
        extract('month', TeacherAttendance.date) == month
    ).all()

    for record in records:
        if record.check_in_time:
            record.check_in_time = record.check_in_time.isoformat()
        if record.check_out_time:
            record.check_out_time = record.check_out_time.isoformat()

    return records
