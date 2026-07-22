import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, ZoomControl } from 'react-leaflet';
import type { FeatureCollection } from 'geojson';
import 'leaflet/dist/leaflet.css';

import { WardLayer } from './WardLayer';
import { StationMarkers } from './StationMarkers';
import { MapLayerPanel } from './MapLayerPanel';
import { MapLegend } from './MapLegend';
import { loadWardGeoJSON } from './geojsonLoader';
import {
  SAMPLE_WARD_GEOJSON,
  SAMPLE_STATIONS,
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  CARTO_DARK_TILE_URL,
} from './mapData';
import './BaseMap.css';

export interface BaseMapProps {
  /** Map center [lat, lng] */
  center?: [number, number];
  zoom?: number;
  /**
   * Optional URL to a GeoJSON FeatureCollection.
   * Example: "/data/mumbai-wards.geojson"
   * Falls back to hardcoded sample wards when omitted or on load failure.
   */
  geoJsonUrl?: string;
  className?: string;
  // Interactive / controlled state props
  clickedWardId?: string | null;
  onWardClick?: (wardId: string, wardName: string) => void;
  aqiData?: Record<string, number>;
}

export function BaseMap({
  center = DEFAULT_MAP_CENTER,
  zoom = DEFAULT_MAP_ZOOM,
  geoJsonUrl,
  className = '',
  clickedWardId: controlledClickedWardId,
  onWardClick,
  aqiData,
}: BaseMapProps) {
  const [wardData, setWardData] = useState<FeatureCollection>(SAMPLE_WARD_GEOJSON);
  const [showWards, setShowWards] = useState(true);
  const [showStations, setShowStations] = useState(true);
  const [hoveredWardId, setHoveredWardId] = useState<string | null>(null);
  const [internalClickedWardId, setInternalClickedWardId] = useState<string | null>(null);

  const clickedWardId = controlledClickedWardId !== undefined ? controlledClickedWardId : internalClickedWardId;

  const handleWardClick = (wardId: string, wardName: string) => {
    if (controlledClickedWardId === undefined) {
      setInternalClickedWardId(wardId);
    }
    if (onWardClick) {
      onWardClick(wardId, wardName);
    }
  };

  useEffect(() => {
    if (!geoJsonUrl) {
      setWardData(SAMPLE_WARD_GEOJSON);
      return;
    }

    let cancelled = false;

    loadWardGeoJSON(geoJsonUrl)
      .then((data) => {
        if (!cancelled) setWardData(data);
      })
      .catch((err) => {
        console.warn('[BaseMap] GeoJSON load failed, using sample data:', err);
        if (!cancelled) setWardData(SAMPLE_WARD_GEOJSON);
      });

    return () => {
      cancelled = true;
    };
  }, [geoJsonUrl]);

  return (
    <div className={`base-map-wrapper ${className}`}>
      <MapContainer
        center={center}
        zoom={zoom}
        className="base-map"
        zoomControl={false}
        scrollWheelZoom
      >
        <TileLayer
          url={CARTO_DARK_TILE_URL}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
        />
        <ZoomControl position="bottomright" />

        <WardLayer
          data={wardData}
          visible={showWards}
          hoveredWardId={hoveredWardId}
          clickedWardId={clickedWardId}
          aqiData={aqiData}
          onHover={setHoveredWardId}
          onClick={handleWardClick}
        />

        <StationMarkers stations={SAMPLE_STATIONS} visible={showStations} />
      </MapContainer>

      <MapLayerPanel
        showWards={showWards}
        showStations={showStations}
        onToggleWards={setShowWards}
        onToggleStations={setShowStations}
      />

      <MapLegend />
    </div>
  );
}
