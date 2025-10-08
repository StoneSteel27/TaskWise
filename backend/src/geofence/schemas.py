from pydantic import BaseModel, Field
from typing import List


class GeofenceCreate(BaseModel):
    name: str
    coordinates: List[List[List[float]]]


from pydantic import BaseModel, Field

class Geofence(BaseModel):
    id: int
    name: str
    coordinates: List[List[List[float]]] = Field(alias="polygon")

    class Config:
        orm_mode = True
        allow_population_by_field_name = True
