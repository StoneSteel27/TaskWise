from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = "sqlite:///./school.db"

engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# This sync dependency is used by all your API routers
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- START: NEW ASYNCHRONOUS SETUP (for the Admin Panel) ---
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession

# The async connection string for the SAME database file
ASYNC_DATABASE_URL = "sqlite+aiosqlite:///./school.db"

async_engine = create_async_engine(ASYNC_DATABASE_URL)
AsyncSessionLocal = sessionmaker(
    bind=async_engine, class_=AsyncSession, expire_on_commit=False
)

# This new async dependency will be used ONLY by the admin panel
async def get_async_db():
    async with AsyncSessionLocal() as session:
        yield session