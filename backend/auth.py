import bcrypt
from jose import JWTError, jwt
from datetime import datetime, timedelta
import os

# read the secret key from the environment — never hardcode this in production
SECRET_KEY = os.environ["JWT_SECRET_KEY"]
ALGORITHM = "HS256"                             # algorithm used to sign the JWT
ACCESS_TOKEN_EXPIRE_MINUTES = 30                # token expires after 30 minutes

def hash_password(password: str) -> str:
    # bcrypt requires bytes, gensalt() generates a random salt
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(plain: str, hashed: str) -> bool:
    # checkpw returns True if the plain password matches the hash
    return bcrypt.checkpw(plain.encode(), hashed.encode())

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes = ACCESS_TOKEN_EXPIRE_MINUTES)  
    to_encode.update({"exp": expire})                      
    return jwt.encode(to_encode, SECRET_KEY, algorithm = ALGORITHM)       # create the JWT token with the user data and expiration time

def decode_access_token(token: str) -> dict:
    return jwt.decode(token, SECRET_KEY, algorithms = [ALGORITHM])          # decode the JWT token and return the data inside (like user id)