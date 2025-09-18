from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from src.database import get_db
from src.auth import service as auth_service, schemas, constants
from src.users.schemas import User as UserSchema
from src.auth.models import UserRole
from src.courses.models import Course

router = APIRouter()

@router.post("/login", response_model=schemas.LoginResponse)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = auth_service.get_user(db, roll_number=form_data.username)
    if not user or not auth_service.verify_password(form_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect roll number or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=constants.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth_service.create_access_token(
        data={"sub": user.roll_number, "role": user.role.value}, expires_delta=access_token_expires
    )

    homeroom_class = None
    if user.role == UserRole.TEACHER:
        classroom = db.query(Course).filter(Course.homeroom_teacher_id == user.roll_number).first()
        if classroom:
            homeroom_class = classroom.class_name

    user_details = UserSchema(
        name=user.name,
        roll_number=user.roll_number,
        role=user.role,
        homeroom_class=homeroom_class
    )
    return schemas.LoginResponse(access_token=access_token, token_type="bearer", user=user_details)
