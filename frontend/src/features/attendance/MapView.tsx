
import { MapContainer, TileLayer, Marker, Polygon, useMap } from "react-leaflet";
import { LatLngExpression, latLngBounds } from "leaflet";
import { useEffect } from "react";

import { GeoFence } from "../../types";

interface MapViewProps {
  teacherLocation: GeolocationCoordinates | null;
  geoFence: GeoFence | null;
  focusOn: 'user' | 'fence' | 'both';
}

const MapFocusController = ({ teacherLocation, geoFence, focusOn }: MapViewProps) => {
  const map = useMap();

  useEffect(() => {
    if (focusOn === 'user' && teacherLocation) {
      map.setView([teacherLocation.latitude, teacherLocation.longitude], 15);
      return;
    }

    if (focusOn === 'fence' && geoFence) {
      const fencePositions = geoFence.coordinates[0].map((coord: [number, number]) => [
        coord[1],
        coord[0],
      ]) as LatLngExpression[];
      const bounds = latLngBounds(fencePositions);
      map.fitBounds(bounds, { padding: [50, 50] });
      return;
    }

    // Default behavior to fit both if they exist
    if (teacherLocation && geoFence) {
      const teacherPosition: LatLngExpression = [teacherLocation.latitude, teacherLocation.longitude];
      const fencePositions = geoFence.coordinates[0].map((coord: [number, number]) => [
        coord[1],
        coord[0],
      ]) as LatLngExpression[];
      const bounds = latLngBounds([teacherPosition, ...fencePositions]);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (teacherLocation) {
      map.setView([teacherLocation.latitude, teacherLocation.longitude], 15);
    } else if (geoFence) {
        const fencePositions = geoFence.coordinates[0].map((coord: [number, number]) => [
            coord[1],
            coord[0],
          ]) as LatLngExpression[];
        const bounds = latLngBounds(fencePositions);
        map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, teacherLocation, geoFence, focusOn]);

  return null;
};


const MapView = ({ teacherLocation, geoFence, focusOn }: MapViewProps) => {
  const teacherPosition: LatLngExpression | undefined = teacherLocation
    ? [teacherLocation.latitude, teacherLocation.longitude]
    : undefined;

  return (
    <MapContainer
      center={teacherPosition || [12.9716, 77.5946]}
      zoom={15}
      scrollWheelZoom={false}
      style={{ height: "400px", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {teacherPosition && <Marker position={teacherPosition} />}
      {geoFence && (
        <Polygon
          pathOptions={{ color: "purple" }}
          positions={geoFence.coordinates[0].map((coord: [number, number]) => [
            coord[1],
            coord[0],
          ])}
        />
      )}
      <MapFocusController teacherLocation={teacherLocation} geoFence={geoFence} focusOn={focusOn} />
    </MapContainer>
  );
};

export default MapView;
