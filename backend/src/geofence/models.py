
from sqlalchemy import Column, Integer, String
from src.database import Base


class Geofence(Base):
    __tablename__ = "geofence"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    polygon = Column(String, nullable=False)
