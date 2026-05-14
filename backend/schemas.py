from pydantic import BaseModel, Field

class UserCreate(BaseModel):
    first_name: str = Field(max_length=100)
    last_name: str = Field(max_length=100)
    email: str = Field(max_length=255)
    password: str = Field(max_length=16)
    confirm: str = Field(max_length=16)

class UserLookup(BaseModel):
    email: str

class UserLookupResponse(BaseModel):
    first_name: str | None

class UserUpdate(BaseModel):
    first_name: str = Field(max_length=100)
    last_name: str = Field(max_length=100)

class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(max_length=16)
    confirm: str = Field(max_length=16)

class UserResponse(BaseModel):
    id: int
    first_name: str | None
    last_name: str | None
    email: str

    class Config:                   # this for pydantic to read data from SQLAlchemy models
        from_attributes = True

# for user login
class UserLogin(BaseModel):
    email: str
    password:str

# used when we respond back w/ a JWT token after login
class Token(BaseModel):
    access_token: str
    token_type: str        # will always be "bearer"

class ForgotPassword(BaseModel):
    email: str

class ResetPassword(BaseModel):
    token: str
    new_password: str = Field(max_length=16)
    confirm: str = Field(max_length=16)

class PasswordEntryCreate(BaseModel):
    site: str = Field(max_length=255)
    username: str = Field(max_length=255)
    password: str = Field(max_length=1000)
    category: str = Field(default='website', max_length=50)

class PasswordEntryUpdate(BaseModel):
    site: str = Field(max_length=255)
    username: str = Field(max_length=255)
    password: str = Field(max_length=1000)
    category: str = Field(default='website', max_length=50)

class PasswordEntryResponse(BaseModel):
    id: int
    site: str
    username: str
    password: str
    category: str = 'website'

    class Config:
        from_attributes = True



