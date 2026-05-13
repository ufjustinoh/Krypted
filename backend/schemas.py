from pydantic import BaseModel

class UserCreate(BaseModel):
    first_name: str
    last_name: str
    email: str
    password: str
    confirm: str

class UserLookup(BaseModel):
    email: str

class UserLookupResponse(BaseModel):
    first_name: str | None

class UserUpdate(BaseModel):
    first_name: str
    last_name: str

class PasswordChange(BaseModel):
    current_password: str
    new_password: str
    confirm: str

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

class PasswordEntryCreate(BaseModel):
    site: str
    username: str
    password: str         # plain text password we get from frontend, we will encrypt it before storing in DB

class PasswordEntryUpdate(BaseModel):
    site: str
    username: str
    password: str

class PasswordEntryResponse(BaseModel):
    id: int
    site: str
    username: str        
    password:str        # decrypted password 

    class Config:
        from_attributes = True      #pydantic read data from SQLAlchemy models



