from fastapi import FastAPI, Depends, HTTPException, Query, Request, Response, Cookie
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from jose import JWTError
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from datetime import datetime, timedelta, timezone
import uuid
import re

from sqlalchemy import text
import models, schemas, auth, crypto
from database import engine, SessionLocal

models.Base.metadata.create_all(bind=engine)

with engine.connect() as conn:
    conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR"))
    conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR"))
    conn.execute(text("ALTER TABLE passwords ADD COLUMN IF NOT EXISTS category VARCHAR DEFAULT 'website'"))
    conn.execute(text("ALTER TABLE passwords ADD COLUMN IF NOT EXISTS deleted_at VARCHAR"))
    conn.execute(text("ALTER TABLE passwords ADD COLUMN IF NOT EXISTS client_encrypted BOOLEAN DEFAULT FALSE"))
    conn.commit()

def is_password_reused(new_password: str, user: models.User, db: Session) -> bool:
    if auth.verify_password(new_password, user.password_hash):
        return True
    history = db.query(models.PasswordHistory).filter(models.PasswordHistory.user_id == user.id).all()
    return any(auth.verify_password(new_password, h.password_hash) for h in history)

def archive_password(user: models.User, db: Session):
    db.add(models.PasswordHistory(user_id=user.id, password_hash=user.password_hash))

def normalize_site(site: str) -> str:
    s = site.strip()
    s = re.sub(r'^https?://', '', s)
    s = re.sub(r'^www\.', '', s, flags=re.IGNORECASE)
    s = s.rstrip('/')
    return s

limiter = Limiter(key_func=get_remote_address)

app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://kryptedvault.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(access_token: str | None = Cookie(default=None), db: Session = Depends(get_db)):
    if not access_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = auth.decode_access_token(access_token)
        email = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user


"""
Auth Routes
"""

@app.post("/auth/register", response_model=schemas.UserResponse)
@limiter.limit("3/minute")
def register(request: Request, user: schemas.UserCreate, db: Session = Depends(get_db)):
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
@limiter.limit("3/minute")
def forgot_password(request: Request, data: schemas.ForgotPassword, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == data.email).first()
    if not user:
        return {"token": None}
    token = str(uuid.uuid4())
    expires_at = (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()
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
    if not reset or datetime.now(timezone.utc).isoformat() > reset.expires_at:
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

@app.post("/auth/login", response_model=schemas.UserResponse)
@limiter.limit("5/minute")
def login(request: Request, response: Response, user: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if not db_user or not auth.verify_password(user.password, db_user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = auth.create_access_token({"sub": db_user.email})
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=86400,
    )
    return db_user

@app.post("/auth/logout")
def logout(response: Response):
    response.delete_cookie(key="access_token", secure=True, samesite="none")
    return {"message": "Logged out"}


"""
Password Routes
"""

def _serialize_entry(e):
    if e.client_encrypted:
        return {
            "id": e.id,
            "site": e.site,
            "username": e.username,
            "password": e.encrypted_password,
            "category": e.category or 'website',
            "client_encrypted": True,
        }
    return {
        "id": e.id,
        "site": e.site,
        "username": crypto.decrypt_safe(e.username),
        "password": crypto.decrypt_password(e.encrypted_password),
        "category": e.category or 'website',
        "client_encrypted": False,
    }

@app.get("/passwords", response_model=list[schemas.PasswordEntryResponse])
def get_passwords(
    skip: int = Query(0, ge=0),
    limit: int = Query(200, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    entries = db.query(models.PasswordEntry).filter(
        models.PasswordEntry.user_id == current_user.id,
        models.PasswordEntry.deleted_at == None
    ).offset(skip).limit(limit).all()
    return [_serialize_entry(e) for e in entries]

@app.get("/passwords/deleted", response_model=list[schemas.PasswordEntryResponse])
def get_deleted_passwords(
    skip: int = Query(0, ge=0),
    limit: int = Query(200, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    entries = db.query(models.PasswordEntry).filter(
        models.PasswordEntry.user_id == current_user.id,
        models.PasswordEntry.deleted_at != None
    ).offset(skip).limit(limit).all()
    return [_serialize_entry(e) for e in entries]

@app.delete("/passwords/trash")
def clear_trash(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db.query(models.PasswordEntry).filter(
        models.PasswordEntry.user_id == current_user.id,
        models.PasswordEntry.deleted_at != None
    ).delete()
    db.commit()
    return {"message": "Trash cleared"}

@app.post("/passwords", response_model=schemas.PasswordEntryResponse)
def create_password(entry: schemas.PasswordEntryCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    stored_username = entry.username if entry.client_encrypted else crypto.encrypt_password(entry.username)
    stored_password = entry.password if entry.client_encrypted else crypto.encrypt_password(entry.password)
    new_entry = models.PasswordEntry(
        user_id=current_user.id,
        site=normalize_site(entry.site),
        username=stored_username,
        encrypted_password=stored_password,
        category=entry.category,
        client_encrypted=entry.client_encrypted,
    )
    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)
    return {
        "id": new_entry.id,
        "site": new_entry.site,
        "username": entry.username,
        "password": entry.password,
        "category": new_entry.category,
        "client_encrypted": new_entry.client_encrypted,
    }

@app.put("/passwords/{entry_id}", response_model=schemas.PasswordEntryResponse)
def update_password(entry_id: int, entry: schemas.PasswordEntryUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_entry = db.query(models.PasswordEntry).filter(
        models.PasswordEntry.id == entry_id,
        models.PasswordEntry.user_id == current_user.id
    ).first()
    if not db_entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    db_entry.site = normalize_site(entry.site)
    db_entry.username = entry.username if entry.client_encrypted else crypto.encrypt_password(entry.username)
    db_entry.encrypted_password = entry.password if entry.client_encrypted else crypto.encrypt_password(entry.password)
    db_entry.category = entry.category
    db_entry.client_encrypted = entry.client_encrypted
    db.commit()
    db.refresh(db_entry)
    return {"id": db_entry.id, "site": db_entry.site, "username": entry.username, "password": entry.password, "category": db_entry.category, "client_encrypted": db_entry.client_encrypted}

@app.delete("/passwords/{entry_id}")
def delete_password(entry_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    entry = db.query(models.PasswordEntry).filter(
        models.PasswordEntry.id == entry_id,
        models.PasswordEntry.user_id == current_user.id
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    entry.deleted_at = datetime.now(timezone.utc).isoformat()
    db.commit()
    return {"message": "Password moved to trash"}

@app.post("/passwords/{entry_id}/restore")
def restore_password(entry_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    entry = db.query(models.PasswordEntry).filter(
        models.PasswordEntry.id == entry_id,
        models.PasswordEntry.user_id == current_user.id,
        models.PasswordEntry.deleted_at != None
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    entry.deleted_at = None
    db.commit()
    return {"message": "Password restored"}

@app.delete("/passwords/{entry_id}/permanent")
def permanent_delete_password(entry_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    entry = db.query(models.PasswordEntry).filter(
        models.PasswordEntry.id == entry_id,
        models.PasswordEntry.user_id == current_user.id
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    db.delete(entry)
    db.commit()
    return {"message": "Password permanently deleted"}


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
