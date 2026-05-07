from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from jose import JWTError
from fastapi.security import OAuth2PasswordBearer

import models, schemas, auth, crypto
from database import engine, SessionLocal

models.Base.metadata.create_all(bind = engine)                      # create the database tables 

app = FastAPI()                                                     # create the app
app.add_middleware(     
    CORSMiddleware,                                                 # this tells backend its ok to accept requests from localhost:5172 (react app) otherwise browser would block this
    allow_origins = [
        "http://localhost:5173",
        "https://password-manager-five-lake.vercel.app",
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
    existing = db.query(models.User).filter(models.User.email == user.email).first()                                                                                                                      
    if existing:                                                                                                                                                                                          
        raise HTTPException(status_code=400, detail="Email already registered")
    new_user = models.User(                                                                                                                                                                               
        email=user.email,                                                                                                                                                                                 
        password_hash=auth.hash_password(user.password)
    )                                                                                                                                                                                                     
    db.add(new_user)                                      
    db.commit()
    db.refresh(new_user)
    return new_user                                                                                                                                                                                       
   
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
            "username": entry.username,
            "password": crypto.decrypt_password(entry.encrypted_password)  # decrypt before sending
        })
    return result
                                                                                                                                                                                                            
@app.post("/passwords", response_model=schemas.PasswordEntryResponse)
def create_password(entry: schemas.PasswordEntryCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):                                                            
    new_entry = models.PasswordEntry(                                                                                                                                                                     
        user_id=current_user.id,
        site=entry.site,                                                                                                                                                                                  
        username=entry.username,                          
        encrypted_password=crypto.encrypt_password(entry.password)  # encrypt before saving
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
   
@app.delete("/passwords/{entry_id}")                                                                                                                                                                      
def delete_password(entry_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    entry = db.query(models.PasswordEntry).filter(                                                                                                                                                        
        models.PasswordEntry.id == entry_id,
        models.PasswordEntry.user_id == current_user.id  # make sure the entry belongs to this user                                                                                                       
    ).first()                                                                                                                                                                                             
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")                                                                                                                                    
    db.delete(entry)                                                                                                                                                                                      
    db.commit()
    return {"message": "Password deleted"}      