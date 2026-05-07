from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
import os

# read the secret key from the environment — never hardcode this in production
SECRET_KEY = os.environ["JWT_SECRET_KEY"]
ALGORITHM = "HS256"                             # algorithm used to sign the JWT
ACCESS_TOKEN_EXPIRE_MINUTES = 30                # token expires after 30 minutes

pwd_context = CryptContext(schemes = ["bcrypt"], deprecated = "auto")       # tells passlib to use bcrypt to hash passwords

def hash_password(password: str) -> str:
    return pwd_context.hash(password)                  # hash the password using bcrypt

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)            # return True if password matches the hash, False otherwise

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes = ACCESS_TOKEN_EXPIRE_MINUTES)  
    to_encode.update({"exp": expire})                      
    return jwt.encode(to_encode, SECRET_KEY, algorithm = ALGORITHM)       # create the JWT token with the user data and expiration time

def decode_access_token(token: str) -> dict:
    return jwt.decode(token, SECRET_KEY, algorithms = [ALGORITHM])          # decode the JWT token and return the data inside (like user id)