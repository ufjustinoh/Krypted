from sqlalchemy import Column, Integer, String, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from database import Base

# class for user table, stores the account info
class User(Base):
    __tablename__ = "users"                                         

    id = Column(Integer, primary_key = True)
    first_name = Column(String, nullable = True)
    last_name = Column(String, nullable = True)
    email = Column(String, unique = True, nullable = False)
    password_hash = Column(String, nullable = False)

    passwords = relationship("PasswordEntry", back_populates = "owner")    # lets us do user. passwords to get all their entries  


# class for password entry table, stores saved passwords for each user
class PasswordEntry(Base):
    __tablename__ = "passwords"                                             

    id = Column(Integer, primary_key = True)                                # unique id for each entry, auto increment
    user_id = Column(Integer, ForeignKey("users.id"), nullable = False)     # link entry to a user 
    site = Column(String, nullable = False)                                 
    username = Column(String, nullable = False)
    encrypted_password = Column(String, nullable = False)                   # store encrypted password

    owner = relationship("User", back_populates = "passwords")


class PasswordHistory(Base):
    __tablename__ = "password_history"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    password_hash = Column(String, nullable=False)


class PasswordReset(Base):
    __tablename__ = "password_resets"

    id = Column(Integer, primary_key=True)
    email = Column(String, nullable=False)
    token = Column(String, unique=True, nullable=False)
    expires_at = Column(String, nullable=False)
    used = Column(Boolean, default=False)