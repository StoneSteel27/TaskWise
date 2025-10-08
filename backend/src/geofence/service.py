import json
from shapely.geometry import Point, Polygon
from sqlalchemy.orm import Session
from . import models, schemas


def create_geofence(db: Session, geofence: schemas.GeofenceCreate):
    # Store the coordinates as a JSON string
    db_geofence = models.Geofence(name=geofence.name, polygon=json.dumps(geofence.coordinates))
    db.add(db_geofence)
    db.commit()
    db.refresh(db_geofence)
    return db_geofence


def get_geofence(db: Session, geofence_id: int):
    db_geofence = db.query(models.Geofence).filter(models.Geofence.id == geofence_id).first()
    if db_geofence:
        db.expunge(db_geofence)
        db_geofence.polygon = json.loads(db_geofence.polygon)
    return db_geofence


def is_point_in_geofence(geofence: models.Geofence, lat: float, lon: float) -> bool:
    if not geofence:
        return False

    polygon = Polygon(geofence.polygon[0])
    point = Point(lon, lat)
    return polygon.contains(point)


def update_geofence(db: Session, geofence_id: int, geofence: schemas.GeofenceCreate):
    db_geofence = db.query(models.Geofence).filter(models.Geofence.id == geofence_id).first()
    if db_geofence:
        db_geofence.name = geofence.name
        db_geofence.polygon = json.dumps(geofence.coordinates)
        db.commit()
        db.refresh(db_geofence)
    return db_geofence


def get_all_geofences(db: Session):
    db_geofences = db.query(models.Geofence).all()
    for geofence in db_geofences:
        db.expunge(geofence)
        geofence.polygon = json.loads(geofence.polygon)
    return db_geofences


def delete_geofence(db: Session, geofence_id: int):
    db_geofence = db.query(models.Geofence).filter(models.Geofence.id == geofence_id).first()
    if db_geofence:
        db.delete(db_geofence)
        db.commit()
    return db_geofence
