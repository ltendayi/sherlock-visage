"""
Authentication schemas for JWT and user management
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, validator


class Token(BaseModel):
    """JWT token response schema"""
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class TokenData(BaseModel):
    """Token payload data schema"""
    user_id: int
    tenant_id: int
    username: str
    email: str
    is_superuser: bool = False
    exp: Optional[datetime] = None


class UserBase(BaseModel):
    """Base user schema"""
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=100)
    full_name: Optional[str] = None


class UserCreate(UserBase):
    """User creation schema"""
    password: str = Field(..., min_length=8)
    tenant_id: int


class UserUpdate(BaseModel):
    """User update schema"""
    email: Optional[EmailStr] = None
    username: Optional[str] = Field(None, min_length=3, max_length=100)
    full_name: Optional[str] = None
    is_active: Optional[bool] = None


class User(UserBase):
    """User response schema"""
    id: int
    tenant_id: int
    is_active: bool
    is_superuser: bool
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    """User login schema"""
    username: str
    password: str


class PasswordChange(BaseModel):
    """Password change schema"""
    current_password: str
    new_password: str = Field(..., min_length=8)


class APIKeyBase(BaseModel):
    """Base API key schema"""
    name: str = Field(..., min_length=1, max_length=100)


class APIKeyCreate(APIKeyBase):
    """API key creation schema"""
    expires_days: Optional[int] = Field(None, ge=1, le=365)


class APIKey(APIKeyBase):
    """API key response schema"""
    id: int
    key: str
    user_id: int
    is_active: bool
    last_used: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class APIKeyResponse(BaseModel):
    """API key full response schema"""
    api_key: APIKey
    full_key: str  # Only shown on creation


class TenantBase(BaseModel):
    """Base tenant schema"""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None


class TenantCreate(TenantBase):
    """Tenant creation schema"""
    pass


class TenantUpdate(BaseModel):
    """Tenant update schema"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    is_active: Optional[bool] = None


class Tenant(TenantBase):
    """Tenant response schema"""
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True