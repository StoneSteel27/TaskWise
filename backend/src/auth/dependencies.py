from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from src.config import settings
from src.database import get_db
from src.auth import service as auth_service, schemas, models
from src.auth.models import User
from src.courses.models import Course


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/v1/api/login")

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALG])
        roll_number: str = payload.get("sub")
        if roll_number is None:
            raise credentials_exception
        token_data = schemas.TokenData(roll_number=roll_number)
    except JWTError:
        raise credentials_exception
    user = auth_service.get_user(db, roll_number=token_data.roll_number)
    if user is None:
        raise credentials_exception
    return user

async def get_current_teacher(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.role == models.UserRole.TEACHER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user is not a teacher"
        )
    return current_user

async def get_current_homeroom_teacher(current_user: User = Depends(get_current_teacher), db: Session = Depends(get_db)) -> User:
    # a teacher can be a homeroom teacher of multiple classes
    homeroom_classes = db.query(Course).filter(Course.homeroom_teacher_id == current_user.roll_number).all()
    if not homeroom_classes:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user is not a homeroom teacher"
        )
    return current_user

async def get_current_principal(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.role == models.UserRole.PRINCIPAL:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user is not a principal"
        )
    return current_user
