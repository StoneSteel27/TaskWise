import base64
import webauthn
from fastapi import APIRouter, Depends, Request, HTTPException, Body
from pydantic import BaseModel, Field, validator
from sqlalchemy.orm import Session
from webauthn.helpers import options_to_json_dict
from webauthn.helpers.structs import (
    RegistrationCredential, AuthenticationCredential,
    PublicKeyCredentialCreationOptions, PublicKeyCredentialRequestOptions,
    AuthenticatorSelectionCriteria, AuthenticatorAttachment, UserVerificationRequirement,
    AuthenticatorAttestationResponse, AuthenticatorAssertionResponse, PublicKeyCredentialDescriptor
)
from datetime import datetime

from src.database import get_db
from src.auth.dependencies import get_current_teacher
from src.auth.models import User
from src.attendance import service_teacher
from src.attendance.models import WebAuthnCredential

router = APIRouter(prefix="/attendance/teacher", tags=["teacher-attendance"])

RP_ID = "localhost" # In production, this MUST be your domain name (e.g., "school.com")
RP_NAME = "TaskWise"
ORIGIN = "http://localhost:5173" # In production, this MUST be your frontend's URL (e.g., "https://school.com")

# --- Pydantic Models for WebAuthn ---
def b64url_to_bytes(s: str) -> bytes:
    return base64.urlsafe_b64decode(s.replace('_', '/').replace('-', '+') + '==')

class WebAuthnRegistrationRequest(BaseModel):
    id: str
    raw_id: str = Field(alias="rawId")
    response: dict
    type: str

class WebAuthnAuthenticationRequest(BaseModel):
    id: str
    raw_id: str = Field(alias="rawId")
    response: dict
    type: str

class Geolocation(BaseModel):
    latitude: float
    longitude: float

# --- Registration Endpoints ---

@router.get("/webauthn/register-options")
def get_registration_options(request: Request, current_user: User = Depends(get_current_teacher), db: Session = Depends(get_db)):
    if service_teacher.get_webauthn_credential(db, current_user):
        raise HTTPException(status_code=409, detail="A device is already registered for this user.")

    options = webauthn.generate_registration_options(
        rp_id=RP_ID,
        rp_name=RP_NAME,
        user_id=current_user.roll_number.encode('utf-8'),
        user_name=current_user.name,
        authenticator_selection=AuthenticatorSelectionCriteria(
            authenticator_attachment=AuthenticatorAttachment.PLATFORM, # Prefers mobile built-in (e.g., Face/Touch ID)
            user_verification=UserVerificationRequirement.REQUIRED,
        ),
    )
    request.session["challenge"] = base64.b64encode(options.challenge).decode()
    return options_to_json_dict(options)

@router.post("/webauthn/register-verify")
def verify_registration(
    request: Request,
    credential_data: WebAuthnRegistrationRequest,
    current_user: User = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    challenge = base64.b64decode(request.session.pop("challenge", None))
    if not challenge:
        raise HTTPException(status_code=400, detail="No registration challenge found in session.")

    verified = webauthn.verify_registration_response(
        credential=RegistrationCredential(
            id=credential_data.id, raw_id=b64url_to_bytes(credential_data.raw_id),
            response=AuthenticatorAttestationResponse(
                client_data_json=b64url_to_bytes(credential_data.response['clientDataJSON']),
                attestation_object=b64url_to_bytes(credential_data.response['attestationObject']),
            ), type=credential_data.type
        ),
        expected_challenge=challenge,
        expected_origin=ORIGIN,
        expected_rp_id=RP_ID,
        require_user_verification=True
    )

    new_credential = WebAuthnCredential(
        user_roll_number=current_user.roll_number,
        credential_id=verified.credential_id,
        public_key=verified.credential_public_key,
        sign_count=verified.sign_count
    )
    db.add(new_credential)
    db.commit()
    return {"message": "Device registered successfully."}

# --- Check-In/Out Endpoints ---

@router.get("/webauthn/auth-options")
def get_auth_options(request: Request, current_user: User = Depends(get_current_teacher), db: Session = Depends(get_db)):
    credential = service_teacher.get_webauthn_credential(db, current_user)
    if not credential:
        raise HTTPException(status_code=404, detail="No WebAuthn device registered for this user.")

    options = webauthn.generate_authentication_options(
        rp_id=RP_ID,
        allow_credentials=[PublicKeyCredentialDescriptor(id=credential.credential_id)],
        user_verification=UserVerificationRequirement.REQUIRED,
    )
    request.session["challenge"] = base64.b64encode(options.challenge).decode()
    return options_to_json_dict(options)


class CheckInPayload(BaseModel):
    credential: WebAuthnAuthenticationRequest
    location: Geolocation

@router.post("/check-in")
def verify_check_in(
    request: Request,
    payload: CheckInPayload,
    current_user: User = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    challenge = base64.b64decode(request.session.pop("challenge", None))
    if not challenge:
        raise HTTPException(status_code=400, detail="No authentication challenge found.")
        
    credential_record = service_teacher.get_webauthn_credential(db, current_user)
    if not credential_record:
        raise HTTPException(status_code=404, detail="Credential not found.")

    verified = webauthn.verify_authentication_response(
        credential=AuthenticationCredential(
            id=payload.credential.id, raw_id=b64url_to_bytes(payload.credential.raw_id),
            response=AuthenticatorAssertionResponse(
                client_data_json=b64url_to_bytes(payload.credential.response['clientDataJSON']),
                authenticator_data=b64url_to_bytes(payload.credential.response['authenticatorData']),
                signature=b64url_to_bytes(payload.credential.response['signature']),
            ), type=payload.credential.type
        ),
        expected_challenge=challenge,
        expected_origin=ORIGIN,
        expected_rp_id=RP_ID,
        credential_public_key=credential_record.public_key,
        credential_current_sign_count=credential_record.sign_count,
        require_user_verification=True
    )

    # Update sign count
    credential_record.sign_count = verified.new_sign_count
    db.commit()

    # Perform check-in
    result = service_teacher.check_in_teacher(db, current_user, payload.location.latitude, payload.location.longitude, "WEBAUTHN")
    return {"message": "Check-in successful.", "check_in_time": result.check_in_time}

class CheckOutPayload(BaseModel):
    credential: WebAuthnAuthenticationRequest
    location: Geolocation

@router.post("/check-out")
def verify_check_out(
    request: Request,
    payload: CheckOutPayload,
    current_user: User = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    challenge = base64.b64decode(request.session.pop("challenge", None))
    if not challenge:
        raise HTTPException(status_code=400, detail="No authentication challenge found.")
        
    credential_record = service_teacher.get_webauthn_credential(db, current_user)
    if not credential_record:
        raise HTTPException(status_code=404, detail="Credential not found.")

    verified = webauthn.verify_authentication_response(
        credential=AuthenticationCredential(
            id=payload.credential.id, raw_id=b64url_to_bytes(payload.credential.raw_id),
            response=AuthenticatorAssertionResponse(
                client_data_json=b64url_to_bytes(payload.credential.response['clientDataJSON']),
                authenticator_data=b64url_to_bytes(payload.credential.response['authenticatorData']),
                signature=b64url_to_bytes(payload.credential.response['signature']),
            ), type=payload.credential.type
        ),
        expected_challenge=challenge,
        expected_origin=ORIGIN,
        expected_rp_id=RP_ID,
        credential_public_key=credential_record.public_key,
        credential_current_sign_count=credential_record.sign_count,
        require_user_verification=True
    )

    # Update sign count
    credential_record.sign_count = verified.new_sign_count
    db.commit()

    # Perform check-out
    result = service_teacher.check_out_teacher(db, current_user, payload.location.latitude, payload.location.longitude, "WEBAUTHN")
    return {"message": "Check-out successful.", "check_out_time": result.check_out_time}


# --- Recovery Code Endpoint ---
class RecoveryCheckInPayload(BaseModel):
    code: str
    location: Geolocation

@router.post("/recovery-check-in")
def recovery_check_in(
    payload: RecoveryCheckInPayload,
    current_user: User = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    result = service_teacher.verify_recovery_code(db, current_user, payload.code, payload.location.latitude, payload.location.longitude)
    return {"message": "Check-in successful using recovery code.", "check_in_time": result.check_in_time}


class TeacherAttendanceStatus(BaseModel):
    status: str
    check_in_time: datetime | None
    check_out_time: datetime | None
    is_device_registered: bool

@router.get("/status", response_model=TeacherAttendanceStatus)
def get_status(
    current_user: User = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    return service_teacher.get_teacher_attendance_status(db, current_user)