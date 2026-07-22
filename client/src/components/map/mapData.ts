import type { FeatureCollection } from 'geojson';

/** 12 Mumbai wards with approximate polygon boundaries for development/demo. */
export const SAMPLE_WARD_GEOJSON: FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: 'Andheri East', wardId: 'ward-andheri-east' },
      geometry: { type: 'Polygon', coordinates: [[[72.855, 19.100],[72.890, 19.100],[72.898, 19.125],[72.875, 19.135],[72.852, 19.118],[72.855, 19.100]]] },
    },
    {
      type: 'Feature',
      properties: { name: 'Bandra West', wardId: 'ward-bandra-west' },
      geometry: { type: 'Polygon', coordinates: [[[72.810, 19.040],[72.840, 19.040],[72.845, 19.065],[72.825, 19.070],[72.808, 19.058],[72.810, 19.040]]] },
    },
    {
      type: 'Feature',
      properties: { name: 'Dadar', wardId: 'ward-dadar' },
      geometry: { type: 'Polygon', coordinates: [[[72.830, 19.008],[72.858, 19.008],[72.862, 19.030],[72.842, 19.035],[72.828, 19.022],[72.830, 19.008]]] },
    },
    {
      type: 'Feature',
      properties: { name: 'Colaba', wardId: 'ward-colaba' },
      geometry: { type: 'Polygon', coordinates: [[[72.806, 18.895],[72.826, 18.895],[72.830, 18.918],[72.812, 18.922],[72.803, 18.908],[72.806, 18.895]]] },
    },
    {
      type: 'Feature',
      properties: { name: 'Borivali', wardId: 'ward-borivali' },
      geometry: { type: 'Polygon', coordinates: [[[72.845, 19.220],[72.872, 19.220],[72.876, 19.244],[72.855, 19.250],[72.840, 19.236],[72.845, 19.220]]] },
    },
    {
      type: 'Feature',
      properties: { name: 'Kurla', wardId: 'ward-kurla' },
      geometry: { type: 'Polygon', coordinates: [[[72.868, 19.062],[72.896, 19.062],[72.900, 19.085],[72.878, 19.090],[72.864, 19.076],[72.868, 19.062]]] },
    },
    {
      type: 'Feature',
      properties: { name: 'Malad West', wardId: 'ward-malad' },
      geometry: { type: 'Polygon', coordinates: [[[72.836, 19.175],[72.862, 19.175],[72.866, 19.200],[72.846, 19.205],[72.832, 19.190],[72.836, 19.175]]] },
    },
    {
      type: 'Feature',
      properties: { name: 'Kandivali East', wardId: 'ward-kandivali' },
      geometry: { type: 'Polygon', coordinates: [[[72.853, 19.200],[72.880, 19.200],[72.884, 19.222],[72.862, 19.228],[72.848, 19.214],[72.853, 19.200]]] },
    },
    {
      type: 'Feature',
      properties: { name: 'Worli', wardId: 'ward-worli' },
      geometry: { type: 'Polygon', coordinates: [[[72.806, 18.998],[72.832, 18.998],[72.836, 19.022],[72.816, 19.026],[72.802, 19.010],[72.806, 18.998]]] },
    },
    {
      type: 'Feature',
      properties: { name: 'Chembur', wardId: 'ward-chembur' },
      geometry: { type: 'Polygon', coordinates: [[[72.888, 19.050],[72.918, 19.050],[72.922, 19.076],[72.900, 19.082],[72.882, 19.066],[72.888, 19.050]]] },
    },
    {
      type: 'Feature',
      properties: { name: 'Vikhroli', wardId: 'ward-vikhroli' },
      geometry: { type: 'Polygon', coordinates: [[[72.912, 19.092],[72.940, 19.092],[72.944, 19.118],[72.922, 19.124],[72.906, 19.108],[72.912, 19.092]]] },
    },
    {
      type: 'Feature',
      properties: { name: 'Thane West', wardId: 'ward-thane' },
      geometry: { type: 'Polygon', coordinates: [[[72.962, 19.204],[72.994, 19.204],[72.998, 19.232],[72.974, 19.238],[72.956, 19.220],[72.962, 19.204]]] },
    },
  ],
};

export interface Station {
  id: string;
  name: string;
  lat: number;
  lng: number;
  aqi: number | null;
}

/** CPCB monitoring stations in Mumbai. */
export const SAMPLE_STATIONS: Station[] = [
  { id: 'st-colaba',    name: 'Colaba',    lat: 18.9067, lng: 72.8147, aqi: null },
  { id: 'st-bandra',    name: 'Bandra',    lat: 19.0544, lng: 72.8282, aqi: null },
  { id: 'st-andheri',   name: 'Andheri',   lat: 19.1136, lng: 72.8697, aqi: null },
  { id: 'st-dadar',     name: 'Dadar',     lat: 19.0178, lng: 72.8478, aqi: null },
  { id: 'st-borivali',  name: 'Borivali',  lat: 19.2307, lng: 72.8567, aqi: null },
  { id: 'st-chembur',   name: 'Chembur',   lat: 19.0622, lng: 72.8997, aqi: null },
  { id: 'st-worli',     name: 'Worli',     lat: 19.0120, lng: 72.8170, aqi: null },
];

export const DEFAULT_MAP_CENTER: [number, number] = [19.076, 72.8777];
export const DEFAULT_MAP_ZOOM = 11;

export const CARTO_DARK_TILE_URL =
  'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
