import { useEffect, useRef, useCallback } from 'react';
import { GeoJSON } from 'react-leaflet';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import type { Layer, PathOptions } from 'leaflet';
import L from 'leaflet';
import { getAQICategory, getAQICSSVar } from '../../types';

interface WardProperties {
  name: string;
  wardId: string;
}

interface WardLayerProps {
  data: FeatureCollection;
  visible: boolean;
  hoveredWardId: string | null;
  clickedWardId: string | null;
  /** Live AQI per wardId — drives choropleth fill color when provided */
  aqiData?: Record<string, number>;
  onHover: (wardId: string | null) => void;
  onClick: (wardId: string, wardName: string) => void;
}

const BASE_STYLE: PathOptions = {
  color: 'rgba(255, 255, 255, 0.18)',
  weight: 1.5,
  fillColor: 'rgba(255, 255, 255, 0.04)',
  fillOpacity: 0.6,
};

/** Map AQI CSS variable names to actual hex colors for Leaflet (which can't read CSS vars) */
const AQI_COLORS: Record<string, string> = {
  'var(--aqi-good)':        '#00C851',
  'var(--aqi-satisfactory)':'#A8D500',
  'var(--aqi-moderate)':    '#FFBB00',
  'var(--aqi-poor)':        '#FF7700',
  'var(--aqi-very-poor)':   '#FF3300',
  'var(--aqi-severe)':      '#990000',
};

function getAQIHex(aqi: number): string {
  const cssVar = getAQICSSVar(getAQICategory(aqi));
  return AQI_COLORS[cssVar] ?? '#6B7280';
}

function styleForWard(
  wardId: string,
  hoveredWardId: string | null,
  clickedWardId: string | null,
  aqiData?: Record<string, number>,
): PathOptions {
  const aqi = aqiData?.[wardId];
  const fillColor = aqi != null ? getAQIHex(aqi) : 'rgba(255,255,255,0.04)';

  const base: PathOptions = {
    ...BASE_STYLE,
    fillColor,
    fillOpacity: aqi != null ? 0.55 : 0.1,
  };

  if (wardId === clickedWardId) {
    return { ...base, color: 'rgba(0, 212, 180, 0.9)', weight: 2.5, fillOpacity: 0.75 };
  }
  if (wardId === hoveredWardId) {
    return { ...base, color: 'rgba(0, 212, 180, 0.6)', weight: 2, fillOpacity: 0.7 };
  }
  return base;
}

export function WardLayer({
  data,
  visible,
  hoveredWardId,
  clickedWardId,
  aqiData,
  onHover,
  onClick,
}: WardLayerProps) {
  const geoJsonRef = useRef<L.GeoJSON | null>(null);

  const applyStyles = useCallback(() => {
    if (!geoJsonRef.current) return;

    geoJsonRef.current.eachLayer((layer: Layer) => {
      const feature = (layer as L.Path & { feature?: Feature<Geometry, WardProperties> }).feature;
      if (!feature || !(layer instanceof L.Path)) return;

      layer.setStyle(styleForWard(
        feature.properties.wardId,
        hoveredWardId,
        clickedWardId,
        aqiData,
      ));
    });
  }, [hoveredWardId, clickedWardId, aqiData]);

  useEffect(() => {
    applyStyles();
  }, [applyStyles]);

  const onEachFeature = useCallback((
    feature: Feature<Geometry, WardProperties>,
    layer: Layer,
  ) => {
    layer.on({
      mouseover: () => onHover(feature.properties.wardId),
      mouseout: () => onHover(null),
      click: () => {
        onClick(feature.properties.wardId, feature.properties.name);
        const aqi = aqiData?.[feature.properties.wardId];
        const aqiText = aqi != null ? `AQI: ${aqi}` : 'AQI: Loading…';
        layer.bindPopup(`
          <div class="map-popup">
            <strong>${feature.properties.name}</strong>
            <span>${aqiText}</span>
          </div>
        `).openPopup();
      },
    });
  }, [onHover, onClick, aqiData]);

  if (!visible) return null;

  return (
    <GeoJSON
      ref={geoJsonRef}
      data={data}
      style={(feature) => {
        const wardId = (feature as Feature<Geometry, WardProperties>)?.properties?.wardId ?? '';
        return styleForWard(wardId, hoveredWardId, clickedWardId, aqiData);
      }}
      onEachFeature={onEachFeature}
    />
  );
}
