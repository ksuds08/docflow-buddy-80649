from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    email: EmailStr


class UserCreate(UserBase):
    password: str


class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        orm_mode = True


class ProjectBase(BaseModel):
    name: str
    framework: str
    repo_url: Optional[str] = None
    api_style: Optional[str] = None


class ProjectCreate(ProjectBase):
    pass


class Project(ProjectBase):
    id: int
    last_synced_at: Optional[datetime]
    created_at: datetime

    class Config:
        orm_mode = True


class SyncEventBase(BaseModel):
    description: str


class SyncEventCreate(SyncEventBase):
    pass


class SyncEvent(SyncEventBase):
    id: int
    status: str
    created_at: datetime

    class Config:
        orm_mode = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[int] = None


class Message(BaseModel):
    detail: str
