/**
 * openweather.ts
 * Wrapper for OpenWeatherMap Air Pollution API.
 * Docs: https://openweathermap.org/api/air-pollution
 *
 * Returns real µg/m³ concentrations for lat/lng coordinates,
 * which are then converted to Indian CPCB AQI via aqiUtils.
 *
 * Includes:
 *  - 5-second AbortController timeout per request (fail-fast)
 *  - In-memory cache with 5-minute TTL per coordinate (reduce API hammering)
 */

const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const REQUEST_TIMEOUT_MS = 5000; // 5 seconds before aborting
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export interface OWMPollutants {
  co: number;    // µg/m³
  no: number;    // µg/m³
  no2: number;   // µg/m³
  o3: number;    // µg/m³
  so2: number;   // µg/m³
  pm2_5: number; // µg/m³
  pm10: number;  // µg/m³
  nh3: number;   // µg/m³
}

export interface OWMAirQualityPoint {
  dt: number;          // Unix timestamp
  components: OWMPollutants;
}

// ─── In-memory cache ──────────────────────────────────────────────────────────

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const currentCache = new Map<string, CacheEntry<OWMAirQualityPoint>>();
const forecastCache = new Map<string, CacheEntry<OWMAirQualityPoint[]>>();

function getCacheKey(lat: number, lng: number, extra?: string): string {
  return `${lat.toFixed(4)},${lng.toFixed(4)}${extra ? `:${extra}` : ''}`;
}

// ─── Fetch wrapper with timeout ───────────────────────────────────────────────

async function fetchWithTimeout(url: string, timeoutMs = REQUEST_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

// ─── Fetch current air pollution ──────────────────────────────────────────────

/** Fetch current air pollution at a lat/lng coordinate (cached 5 min) */
export async function fetchCurrentAirPollution(
  lat: number,
  lng: number,
): Promise<OWMAirQualityPoint> {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  if (!apiKey) throw new Error('OPENWEATHERMAP_API_KEY is not configured');

  const key = getCacheKey(lat, lng, 'current');
  const cached = currentCache.get(key);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.value;
  }

  const url = `${BASE_URL}/air_pollution?lat=${lat}&lon=${lng}&appid=${apiKey}`;
  const res = await fetchWithTimeout(url);
  if (!res.ok) {
    throw new Error(`OWM API error: ${res.status} ${res.statusText}`);
  }
  const data = await res.json() as {
    list: Array<{ dt: number; components: OWMPollutants }>;
  };
  const result = data.list[0];

  // Store in cache
  currentCache.set(key, { value: result, expiresAt: Date.now() + CACHE_TTL_MS });
  return result;
}

// ─── Fetch historical air pollution ──────────────────────────────────────────

/** Fetch historical air pollution (up to 1 year back, Unix timestamps) */
export async function fetchHistoricalAirPollution(
  lat: number,
  lng: number,
  startUnix: number,
  endUnix: number,
): Promise<OWMAirQualityPoint[]> {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  if (!apiKey) throw new Error('OPENWEATHERMAP_API_KEY is not configured');

  const url = `${BASE_URL}/air_pollution/history?lat=${lat}&lon=${lng}&start=${startUnix}&end=${endUnix}&appid=${apiKey}`;
  const res = await fetchWithTimeout(url, 10000); // Allow 10s for history (larger response)
  if (!res.ok) {
    throw new Error(`OWM History API error: ${res.status} ${res.statusText}`);
  }
  const data = await res.json() as {
    list: Array<{ dt: number; components: OWMPollutants }>;
  };
  return data.list;
}

// ─── Fetch forecast air pollution ────────────────────────────────────────────

/** Fetch forecast air pollution (5-day hourly forecast, cached 5 min) */
export async function fetchForecastAirPollution(
  lat: number,
  lng: number,
): Promise<OWMAirQualityPoint[]> {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  if (!apiKey) throw new Error('OPENWEATHERMAP_API_KEY is not configured');

  const key = getCacheKey(lat, lng, 'forecast');
  const cached = forecastCache.get(key);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.value;
  }

  const url = `${BASE_URL}/air_pollution/forecast?lat=${lat}&lon=${lng}&appid=${apiKey}`;
  const res = await fetchWithTimeout(url, 8000);
  if (!res.ok) {
    throw new Error(`OWM Forecast API error: ${res.status} ${res.statusText}`);
  }
  const data = await res.json() as {
    list: Array<{ dt: number; components: OWMPollutants }>;
  };
  const result = data.list;

  forecastCache.set(key, { value: result, expiresAt: Date.now() + CACHE_TTL_MS });
  return result;
}
