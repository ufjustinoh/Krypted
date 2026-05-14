from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from jose import JWTError
from fastapi.security import OAuth2PasswordBearer
from datetime import datetime, timedelta
import uuid

from sqlalchemy import text
import models, schemas, auth, crypto
from database import engine, SessionLocal

models.Base.metadata.create_all(bind = engine)

with engine.connect() as conn:
    conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR"))
    conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR"))
    conn.commit()

def is_password_reused(new_password: str, user: models.User, db: Session) -> bool:
    if auth.verify_password(new_password, user.password_hash):
        return True
    history = db.query(models.PasswordHistory).filter(models.PasswordHistory.user_id == user.id).all()
    return any(auth.verify_password(new_password, h.password_hash) for h in history)

def archive_password(user: models.User, db: Session):
    db.add(models.PasswordHistory(user_id=user.id, password_hash=user.password_hash))

app = FastAPI()                                                     # create the app
app.add_middleware(     
    CORSMiddleware,                                                 # this tells backend its ok to accept requests from localhost:5172 (react app) otherwise browser would block this
    allow_origins = [
        "http://localhost:5173",
        "https://kryptedvault.vercel.app",
    ],
    allow_credentials = True,
    allow_methods = ["*"],
    allow_headers = ["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl = "auth/login")       # tells FastAPI where the login endpoint is

def get_db():                                                       # dependency, gets a database session for each request and closes it when its done
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):      # dependency, gets current logged in user from JWT token
    try:
        payload = auth.decode_access_token(token)
        email = payload.get("sub")                          # sub is standard JWT for the user
        if email is None:
            raise HTTPException(status_code = 401, detail = "Invalid token")
    except JWTError:
        raise HTTPException(status_code = 401, detail = "Invalid token")
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise HTTPException(status_code = 401, detail = "User not found")
    return user


"""
Auth Routes
"""

@app.post("/auth/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    if user.password != user.confirm:
        raise HTTPException(status_code=400, detail="Passwords do not match")
    existing = db.query(models.User).filter(models.User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    new_user = models.User(
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        password_hash=auth.hash_password(user.password)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user                                                                                                                                                                                       
   
@app.post("/auth/forgot-password")
def forgot_password(data: schemas.ForgotPassword, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == data.email).first()
    if not user:
        return {"token": None}
    token = str(uuid.uuid4())
    expires_at = (datetime.utcnow() + timedelta(hours=1)).isoformat()
    db.add(models.PasswordReset(email=data.email, token=token, expires_at=expires_at))
    db.commit()
    return {"token": token}

@app.post("/auth/reset-password")
def reset_password(data: schemas.ResetPassword, db: Session = Depends(get_db)):
    if data.new_password != data.confirm:
        raise HTTPException(status_code=400, detail="Passwords do not match")
    reset = db.query(models.PasswordReset).filter(
        models.PasswordReset.token == data.token,
        models.PasswordReset.used == False
    ).first()
    if not reset or datetime.utcnow().isoformat() > reset.expires_at:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    user = db.query(models.User).filter(models.User.email == reset.email).first()
    if is_password_reused(data.new_password, user, db):
        raise HTTPException(status_code=400, detail="You cannot reuse a previous password")
    archive_password(user, db)
    user.password_hash = auth.hash_password(data.new_password)
    reset.used = True
    db.commit()
    return {"message": "Password reset successfully"}

@app.post("/auth/lookup", response_model=schemas.UserLookupResponse)
def lookup_user(data: schemas.UserLookup, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == data.email).first()
    return {"first_name": user.first_name if user else None}

@app.post("/auth/login", response_model=schemas.Token)
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()                                                                                                                       
    if not db_user or not auth.verify_password(user.password, db_user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")                                                                                                                          
    token = auth.create_access_token({"sub": db_user.email})
    return {"access_token": token, "token_type": "bearer"} 

"""
Password Routes
"""
@app.get("/passwords", response_model=list[schemas.PasswordEntryResponse])                                                                                                                                
def get_passwords(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    entries = db.query(models.PasswordEntry).filter(models.PasswordEntry.user_id == current_user.id).all()                                                                                                
    result = []                                           
    for entry in entries:                                                                                                                                                                                 
        result.append({
            "id": entry.id,
            "site": entry.site,
            "username": crypto.decrypt_safe(entry.username),
            "password": crypto.decrypt_password(entry.encrypted_password)
        })
    return result
                                                                                                                                                                                                            
@app.post("/passwords", response_model=schemas.PasswordEntryResponse)
def create_password(entry: schemas.PasswordEntryCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):                                                            
    new_entry = models.PasswordEntry(
        user_id=current_user.id,
        site=entry.site,
        username=crypto.encrypt_password(entry.username),
        encrypted_password=crypto.encrypt_password(entry.password)
    )                                                                                                                                                                                                     
    db.add(new_entry)
    db.commit()                                                                                                                                                                                           
    db.refresh(new_entry)                                 
    return {
        "id": new_entry.id,                                                                                                                                                                               
        "site": new_entry.site,
        "username": new_entry.username,                                                                                                                                                                   
        "password": entry.password  # return the original plain text password
    }                                                                                                                                                                                                     
   
@app.put("/passwords/{entry_id}", response_model=schemas.PasswordEntryResponse)
def update_password(entry_id: int, entry: schemas.PasswordEntryUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_entry = db.query(models.PasswordEntry).filter(
        models.PasswordEntry.id == entry_id,
        models.PasswordEntry.user_id == current_user.id
    ).first()
    if not db_entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    db_entry.site = entry.site
    db_entry.username = crypto.encrypt_password(entry.username)
    db_entry.encrypted_password = crypto.encrypt_password(entry.password)
    db.commit()
    db.refresh(db_entry)
    return {"id": db_entry.id, "site": db_entry.site, "username": entry.username, "password": entry.password}

@app.delete("/passwords/{entry_id}")
def delete_password(entry_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    entry = db.query(models.PasswordEntry).filter(
        models.PasswordEntry.id == entry_id,
        models.PasswordEntry.user_id == current_user.id
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    db.delete(entry)
    db.commit()
    return {"message": "Password deleted"}

"""
Profile Routes
"""

@app.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@app.put("/me", response_model=schemas.UserResponse)
def update_me(data: schemas.UserUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    current_user.first_name = data.first_name
    current_user.last_name = data.last_name
    db.commit()
    db.refresh(current_user)
    return current_user

@app.put("/me/password")
def change_password(data: schemas.PasswordChange, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if not auth.verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if data.new_password != data.confirm:
        raise HTTPException(status_code=400, detail="Passwords do not match")
    if is_password_reused(data.new_password, current_user, db):
        raise HTTPException(status_code=400, detail="You cannot reuse a previous password")
    archive_password(current_user, db)
    current_user.password_hash = auth.hash_password(data.new_password)
    db.commit()
    return {"message": "Password updated"}