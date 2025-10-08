from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from . import schemas, service
from src.database import get_db

router = APIRouter(
    prefix="/geofence",
    tags=["geofence"],
    responses={404: {"description": "Not found"}},
)


from src.auth.dependencies import get_current_principal, get_current_teacher
from src.auth.models import User


@router.post("/", response_model=schemas.Geofence)
def create_geofence(geofence: schemas.GeofenceCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_principal)):
    return service.create_geofence(db=db, geofence=geofence)


@router.get("/{geofence_id}", response_model=schemas.Geofence)
def read_geofence(geofence_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_principal)):
    db_geofence = service.get_geofence(db, geofence_id=geofence_id)
    if db_geofence is None:
        raise HTTPException(status_code=404, detail="Geofence not found")
    return db_geofence


@router.put("/{geofence_id}", response_model=schemas.Geofence)
def update_geofence(geofence_id: int, geofence: schemas.GeofenceCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_principal)):
    db_geofence = service.update_geofence(db, geofence_id=geofence_id, geofence=geofence)
    if db_geofence is None:
        raise HTTPException(status_code=404, detail="Geofence not found")
    return db_geofence


@router.delete("/{geofence_id}", response_model=schemas.Geofence)
def delete_geofence(geofence_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_principal)):
    db_geofence = service.delete_geofence(db, geofence_id=geofence_id)
    if db_geofence is None:
        raise HTTPException(status_code=404, detail="Geofence not found")
    return db_geofence


@router.get("/coordinates/", response_model=List[schemas.Geofence])
def get_geofence_coordinates(db: Session = Depends(get_db), current_user: User = Depends(get_current_teacher)):
    return service.get_all_geofences(db)