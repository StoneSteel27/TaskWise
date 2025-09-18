from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "TaskWise Backend"
    JWT_SECRET: str = "your-secret-key"
    JWT_ALG: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # --- Geofencing Settings ---
    SCHOOL_LATITUDE: float = 13.02815896267109  # Example: Bangalore
    SCHOOL_LONGITUDE: float = 80.01556681093217
    SCHOOL_GEOFENCE_RADIUS_METERS: int = 200 # Allow check-in within 200 meters

    class Config:
        env_file = ".env"

settings = Settings()
