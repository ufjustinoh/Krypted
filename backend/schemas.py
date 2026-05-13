from pydantic import BaseModel

# used when a user registers, what we expect to receieve from the frontend
class UserCreate(BaseModel):
    email: str
    password: str

# used when we repsond back about a user, no password fields (never send that back)
class UserResponse(BaseModel):
    id: int
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



