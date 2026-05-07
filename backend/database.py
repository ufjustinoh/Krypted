from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# read the database URL from the environment — Render provides this automatically
# when you attach a PostgreSQL database to your service
SQLALCHEMY_DATABASE_URL = os.environ["DATABASE_URL"]

# PostgreSQL doesn't need check_same_thread (that was a SQLite-only requirement)
engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)                 # create database session. Each request will get its own session nd talk to DB

Base = declarative_base()                                                                   # Base class that models will inherit from. Its how SQL alchemy knows what to create in DB
