from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

SQLALCHEMY_DATABASE_URL = "sqlite:///./passwordmanager.db"                                  # database URL 

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})  # database engine. Connection to SQLlite file. check_same_thread is for SQLite to allow multiple threads to access at once

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)                 # create database session. Each request will get its own session nd talk to DB

Base = declarative_base()                                                                   # Base class that models will inherit from. Its how SQL alchemy knows what to create in DB
