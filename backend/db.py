import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker


def normalize_database_url(database_url: str | None) -> str:
    if not database_url:
        return "sqlite:///smart_dashboard.db"
    if database_url.startswith("postgres://"):
        return database_url.replace("postgres://", "postgresql://", 1)
    return database_url


DEFAULT_DATABASE_URL = normalize_database_url(os.getenv("DATABASE_URL"))
DATABASE_URL = DEFAULT_DATABASE_URL
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    return SessionLocal()
