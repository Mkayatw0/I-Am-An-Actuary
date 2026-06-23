"""Auth-related Pydantic schemas."""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, EmailStr, Field


class UserType(str, Enum):
    student = "student"
    actuary = "actuary"
    investor = "investor"
    general = "general_user"


class SignUpRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str = Field(min_length=1, max_length=200)
    user_type: UserType


class SignUpResponse(BaseModel):
    user_id: str
    email: str
    message: str = "Account created. Please verify your email."


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str | None = None
    user_id: str
    email: str


class UserProfileResponse(BaseModel):
    id: str
    email: str
    full_name: str
    user_type: UserType
    created_at: datetime | None = None
    updated_at: datetime | None = None


class UpdateProfileRequest(BaseModel):
    full_name: str | None = Field(None, min_length=1, max_length=200)
    user_type: UserType | None = None