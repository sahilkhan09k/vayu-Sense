import { CircleMarker, Tooltip } from 'react-leaflet';
import type { Station } from './mapData';

interface StationMarkersProps {
  stations: Station[];
  visible: boolean;
}

const STATION_STYLE = {
  color: '#4B5668',
  fillColor: '#4B5668',
  fillOpacity: 0.9,
  weight: 1,
};

export function StationMarkers({ stations, visible }: StationMarkersProps) {
  if (!visible) return null;

  return (
    <>
      {stations.map((station) => (
        <CircleMarker
          key={station.id}
          center={[station.lat, station.lng]}
          radius={8}
          pathOptions={STATION_STYLE}
        >
          <Tooltip direction="top" offset={[0, -4]} opacity={0.95}>
            {station.name}
          </Tooltip>
        </CircleMarker>
      ))}
    </>
  );
}
