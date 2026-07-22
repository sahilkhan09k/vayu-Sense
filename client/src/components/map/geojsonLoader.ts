import type { FeatureCollection } from 'geojson';

/**
 * Load ward boundary GeoJSON from a URL or static path.
 *
 * To use real ward data:
 * 1. Place your file at `client/public/data/mumbai-wards.geojson`
 * 2. Pass `geoJsonUrl="/data/mumbai-wards.geojson"` to `<BaseMap />`
 *
 * Each feature must include `properties.name` and `properties.wardId`.
 */
export async function loadWardGeoJSON(url: string): Promise<FeatureCollection> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to load GeoJSON from ${url} (${response.status})`);
  }

  const data = await response.json();

  if (data?.type !== 'FeatureCollection' || !Array.isArray(data.features)) {
    throw new Error('Invalid GeoJSON: expected a FeatureCollection');
  }

  return data as FeatureCollection;
}
