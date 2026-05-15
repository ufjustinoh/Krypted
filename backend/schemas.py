from pydantic import BaseModel, Field, field_validator
import re

def _check_password_strength(v: str) -> str:
    errors = []
    if len(v) < 8:
        errors.append('at least 8 characters')
    if not re.search(r'[A-Z]', v):
        errors.append('an uppercase letter')
    if not re.search(r'[a-z]', v):
        errors.append('a lowercase letter')
    if not re.search(r'\d', v):
        errors.append('a number')
    if errors:
        raise ValueError('Password must contain ' + ', '.join(errors))
    return v

class UserCreate(BaseModel):
    first_name: str = Field(max_length=100)
    last_name: str = Field(max_length=100)
    email: str = Field(max_length=255)
    password: str = Field(max_length=128)
    confirm: str = Field(max_length=128)

    @field_validator('password')
    @classmethod
    def password_strength(cls, v):
        return _check_password_strength(v)

class UserLookup(BaseModel):
    email: str

class UserLookupResponse(BaseModel):
    first_name: str | None

class UserUpdate(BaseModel):
    first_name: str = Field(max_length=100)
    last_name: str = Field(max_length=100)

class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(max_length=128)
    confirm: str = Field(max_length=128)

    @field_validator('new_password')
    @classmethod
    def password_strength(cls, v):
        return _check_password_strength(v)

class UserResponse(BaseModel):
    id: int
    first_name: str | None
    last_name: str | None
    email: str

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class ForgotPassword(BaseModel):
    email: str

class ResetPassword(BaseModel):
    token: str
    new_password: str = Field(max_length=128)
    confirm: str = Field(max_length=128)

    @field_validator('new_password')
    @classmethod
    def password_strength(cls, v):
        return _check_password_strength(v)

class PasswordEntryCreate(BaseModel):
    site: str = Field(max_length=255)
    username: str = Field(max_length=5000)
    password: str = Field(max_length=5000)
    category: str = Field(default='website', max_length=50)
    client_encrypted: bool = False

class PasswordEntryUpdate(BaseModel):
    site: str = Field(max_length=255)
    username: str = Field(max_length=5000)
    password: str = Field(max_length=5000)
    category: str = Field(default='website', max_length=50)
    client_encrypted: bool = False

class PasswordEntryResponse(BaseModel):
    id: int
    site: str
    username: str
    password: str
    category: str = 'website'
    client_encrypted: bool = False

    class Config:
        from_attributes = True
