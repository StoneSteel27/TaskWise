from pydantic import BaseModel
from src.users.schemas import User

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: User

class TokenData(BaseModel):
    roll_number: str | None = None

class UserLogin(BaseModel):
    roll_number: str
    password: str
