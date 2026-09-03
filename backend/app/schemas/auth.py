from typing import Optional
from pydantic import BaseModel, EmailStr


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class TokenData(BaseModel):
    user_id: Optional[str] = None
    email: Optional[str] = None


class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: Optional[str] = "Project Owner"
    organization: Optional[str] = "ReleaseIQ Technologies"


class UserLogin(BaseModel):
    email: EmailStr
    password: str
    role: Optional[str] = None


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    organization: Optional[str] = None
    two_factor_enabled: Optional[bool] = None


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    organization: str
    avatar_initials: str
    two_factor_enabled: bool
    api_token: str

    class Config:
        from_attributes = True
