/**
 * aqi.controller.ts
 * Handlers for live AQI, historical data, and Groq attribution.
 */

import { Request, Response } from 'express';
import { fetchCurrentAirPollution, fetchHistoricalAirPollution } from '../utils/openweather.js';
import { computeCPCBAQI, calibrateOWMComponents } from '../utils/aqiUtils.js';
import { getWardAttribution } from '../utils/groq.js';
import { getAQISnapshotModel } from '../models/AQISnapshot.js';

// ─── Ward configuration ───────────────────────────────────────────────────────

export interface WardConfig {
  wardId: string;
  wardName: string;
  city: string;
  lat: number;
  lng: number;
}

export const WARD_CONFIGS: WardConfig[] = [
  // Mumbai
  { wardId: 'ward-andheri-east',  wardName: 'Andheri East',    city: 'Mumbai',    lat: 19.1136, lng: 72.8697 },
  { wardId: 'ward-bandra-west',   wardName: 'Bandra West',     city: 'Mumbai',    lat: 19.0544, lng: 72.8282 },
  { wardId: 'ward-dadar',         wardName: 'Dadar',           city: 'Mumbai',    lat: 19.0178, lng: 72.8478 },
  { wardId: 'ward-colaba',        wardName: 'Colaba',          city: 'Mumbai',    lat: 18.9067, lng: 72.8147 },
  { wardId: 'ward-borivali',      wardName: 'Borivali',        city: 'Mumbai',    lat: 19.2307, lng: 72.8567 },
  { wardId: 'ward-kurla',         wardName: 'Kurla',           city: 'Mumbai',    lat: 19.0726, lng: 72.8797 },
  { wardId: 'ward-malad',         wardName: 'Malad West',      city: 'Mumbai',    lat: 19.1874, lng: 72.8481 },
  { wardId: 'ward-kandivali',     wardName: 'Kandivali East',  city: 'Mumbai',    lat: 19.2094, lng: 72.8653 },
  { wardId: 'ward-worli',         wardName: 'Worli',           city: 'Mumbai',    lat: 19.0120, lng: 72.8170 },
  { wardId: 'ward-chembur',       wardName: 'Chembur',         city: 'Mumbai',    lat: 19.0622, lng: 72.8997 },
  { wardId: 'ward-vikhroli',      wardName: 'Vikhroli',        city: 'Mumbai',    lat: 19.1066, lng: 72.9248 },
  { wardId: 'ward-thane',         wardName: 'Thane West',      city: 'Mumbai',    lat: 19.2183, lng: 72.9781 },
  // Delhi
  { wardId: 'ward-connaught',     wardName: 'Connaught Place', city: 'Delhi',     lat: 28.6315, lng: 77.2167 },
  { wardId: 'ward-rohini',        wardName: 'Rohini',          city: 'Delhi',     lat: 28.7495, lng: 77.0586 },
  { wardId: 'ward-lajpat',        wardName: 'Lajpat Nagar',   city: 'Delhi',     lat: 28.5648, lng: 77.2436 },
  { wardId: 'ward-dwarka',        wardName: 'Dwarka',          city: 'Delhi',     lat: 28.5921, lng: 77.0460 },
  // Bengaluru
  { wardId: 'ward-koramangala',   wardName: 'Koramangala',     city: 'Bengaluru', lat: 12.9352, lng: 77.6245 },
  { wardId: 'ward-whitefield',    wardName: 'Whitefield',      city: 'Bengaluru', lat: 12.9698, lng: 77.7499 },
  { wardId: 'ward-hebbal',        wardName: 'Hebbal',          city: 'Bengaluru', lat: 13.0358, lng: 77.5970 },
];

// ─── Mock AQI fallback seeder ─────────────────────────────────────────────────

/**
 * Generate deterministic-ish mock AQI for a ward when OWM key is missing.
 * Values change slowly over time to simulate realistic drift.
 */
function generateMockReading(ward: WardConfig, timestamp: Date) {
  // Use ward hash + time bucket for stable but varied values
  const h = ward.wardId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const t = Math.floor(timestamp.getTime() / (30 * 60 * 1000)); // 30-min buckets
  const seed = (h * 1337 + t * 7) % 1000;

  // Base AQI per city (Mumbai < Delhi, Bengaluru cleanest)
  const cityBase: Record<string, number> = { Mumbai: 120, Delhi: 180, Bengaluru: 80 };
  const base = cityBase[ward.city] ?? 130;
  const variance = (seed / 1000) * 80 - 40; // ±40
  const aqi = Math.max(30, Math.round(base + variance));

  // Derive plausible sub-pollutants from AQI
  const factor = aqi / 200;
  return {
    aqi,
    pm25: Math.round(aqi * 0.28 + 5),
    pm10: Math.round(aqi * 0.45 + 10),
    no2:  Math.round(factor * 60 + 10),
    co:   Math.round(factor * 1500 + 200),
    o3:   Math.round(factor * 40 + 20),
    so2:  Math.round(factor * 20 + 5),
  };
}

// ─── Batched fetch utility ─────────────────────────────────────────────────────

/**
 * Run async tasks in batches to avoid concurrent network flood.
 * @param items  Items to process
 * @param fn     Async function to apply to each item
 * @param batchSize  Max concurrent requests (default: 3)
 */
async function batchedMap<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  batchSize = 3,
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
  }
  return results;
}

// In-memory ward result cache — reuse previous successful AQI response on failure
const wardResultCache = new Map<string, ReturnType<typeof generateMockReading> & {
  wardId: string; wardName: string; city: string; lat: number; lng: number; timestamp: Date;
}>();

// ─── Handler: GET /api/aqi/live?city=Mumbai ───────────────────────────────────

export async function getLiveAQI(req: Request, res: Response): Promise<void> {
  const city = (req.query.city as string) || 'Mumbai';
  const wards = WARD_CONFIGS.filter((w) => w.city === city);

  const owmKey = process.env.OPENWEATHERMAP_API_KEY;
  const now = new Date();

  const AQISnapshot = getAQISnapshotModel();
  const results = await batchedMap(wards, async (ward) => {
    try {
      if (owmKey) {
        const data = await fetchCurrentAirPollution(ward.lat, ward.lng);
        const calibrated = calibrateOWMComponents(data.components, ward.city);
        const { pm2_5, pm10, no2, co, o3, so2 } = calibrated;
        const aqi = computeCPCBAQI({ pm25: pm2_5, pm10, no2 });
        const snapshot = { ...ward, aqi, pm25: pm2_5, pm10, no2, co, o3, so2, timestamp: now };
        // Store in ward cache as last-known-good value
        wardResultCache.set(ward.wardId, snapshot);
        await AQISnapshot.insertMany([snapshot]);
        return snapshot;
      } else {
        // OWM key missing — use calibrated mock
        const mock = generateMockReading(ward, now);
        const snapshot = { ...ward, ...mock, timestamp: now };
        await AQISnapshot.insertMany([snapshot]);
        return snapshot;
      }
    } catch (err) {
      // Network timeout or API error — try last cached result, then fall back to mock
      const cached = wardResultCache.get(ward.wardId);
      if (cached) {
        console.warn(`[AQI] Timeout for ${ward.wardName}, using cached reading from ${Math.round((now.getTime() - cached.timestamp.getTime()) / 1000)}s ago`);
        return { ...cached, timestamp: now };
      }
      console.warn(`[AQI] Timeout for ${ward.wardName}, using mock fallback`);
      const mock = generateMockReading(ward, now);
      return { ...ward, ...mock, timestamp: now };
    }
  }, 3); // 3 concurrent OWM requests max


  // City-level aggregates
  const aqiValues = results.map((r) => r.aqi);
  const cityAQI = Math.round(aqiValues.reduce((a, b) => a + b, 0) / aqiValues.length);
  const worstWard = results.reduce((a, b) => (b.aqi > a.aqi ? b : a));
  const avgPm25 = Math.round(results.reduce((a, b) => a + b.pm25, 0) / results.length);

  res.json({
    city,
    cityAQI,
    worstWard: { wardId: worstWard.wardId, wardName: worstWard.wardName, aqi: worstWard.aqi },
    avgPm25,
    stationsOnline: wards.length,
    wards: results,
    timestamp: now.toISOString(),
  });
}

// ─── Handler: GET /api/aqi/history?city=Mumbai&wardId=...&hours=24 ────────────

export async function getHistoricalAQI(req: Request, res: Response): Promise<void> {
  const city    = (req.query.city as string) || 'Mumbai';
  const wardId  = req.query.wardId as string | undefined;
  const hours   = Math.min(parseInt(req.query.hours as string) || 24, 168); // max 7 days

  const owmKey = process.env.OPENWEATHERMAP_API_KEY;
  const endUnix = Math.floor(Date.now() / 1000);
  const startUnix = endUnix - hours * 3600;

  const targetWards = wardId
    ? WARD_CONFIGS.filter((w) => w.wardId === wardId)
    : WARD_CONFIGS.filter((w) => w.city === city);

  if (targetWards.length === 0) {
    res.status(404).json({ message: 'Ward not found' });
    return;
  }

  const results = await Promise.all(
    targetWards.map(async (ward) => {
      try {
        if (owmKey) {
          const history = await fetchHistoricalAirPollution(ward.lat, ward.lng, startUnix, endUnix);
          return {
            wardId: ward.wardId,
            wardName: ward.wardName,
            series: history.map((pt) => {
              const calibrated = calibrateOWMComponents(pt.components, ward.city);
              return {
                timestamp: new Date(pt.dt * 1000).toISOString(),
                aqi: computeCPCBAQI({ pm25: calibrated.pm2_5, pm10: calibrated.pm10, no2: calibrated.no2 }),
                pm25: Math.round(calibrated.pm2_5),
                pm10: Math.round(calibrated.pm10),
                no2:  Math.round(calibrated.no2),
              };
            }),
          };
        } else {
          // Generate synthetic 30-min interval history
          const series = [];
          for (let i = 0; i <= hours * 2; i++) {
            const ts = new Date((startUnix + i * 1800) * 1000);
            const mock = generateMockReading(ward, ts);
            series.push({
              timestamp: ts.toISOString(),
              aqi: mock.aqi,
              pm25: mock.pm25,
              pm10: mock.pm10,
              no2: mock.no2,
            });
          }
          return { wardId: ward.wardId, wardName: ward.wardName, series };
        }
      } catch (err) {
        console.warn(`[History] Failed for ${ward.wardName}:`, err);
        const series = [];
        for (let i = 0; i <= hours * 2; i++) {
          const ts = new Date((startUnix + i * 1800) * 1000);
          const mock = generateMockReading(ward, ts);
          series.push({ timestamp: ts.toISOString(), aqi: mock.aqi, pm25: mock.pm25, pm10: mock.pm10, no2: mock.no2 });
        }
        return { wardId: ward.wardId, wardName: ward.wardName, series };
      }
    })
  );

  res.json({ city, hours, wards: results });
}

// ─── Handler: POST /api/aqi/attribution/:wardId ───────────────────────────────

export async function getWardAttributionHandler(req: Request, res: Response): Promise<void> {
  const { wardId } = req.params;
  const ward = WARD_CONFIGS.find((w) => w.wardId === wardId);

  if (!ward) {
    res.status(404).json({ message: 'Ward not found' });
    return;
  }

  // Use latest stored snapshot or generate one
  const AQISnapshot = getAQISnapshotModel();
  const snapshots = await AQISnapshot.findLatestPerWard(ward.city);
  const stored = (snapshots as any[]).find((s) => s.wardId === wardId);

  let aqiData = stored;
  if (!aqiData) {
    const mock = generateMockReading(ward, new Date());
    aqiData = { ...ward, ...mock, timestamp: new Date() };
  }

  try {
    const attribution = await getWardAttribution({
      wardName: ward.wardName,
      city: ward.city,
      aqi: aqiData.aqi,
      pm25: aqiData.pm25,
      pm10: aqiData.pm10,
      no2: aqiData.no2,
      co: aqiData.co,
      timestamp: aqiData.timestamp.toISOString(),
    });

    res.json({ wardId, wardName: ward.wardName, aqiSnapshot: aqiData, attribution });
  } catch (err) {
    console.error('[Attribution] Groq error:', err);
    res.status(503).json({ message: 'Attribution service temporarily unavailable', error: String(err) });
  }
}

// ─── Handler: GET /api/aqi/wards?city=Mumbai ─────────────────────────────────

export async function getWardList(req: Request, res: Response): Promise<void> {
  const city = (req.query.city as string) || 'Mumbai';
  const wards = WARD_CONFIGS.filter((w) => w.city === city);
  res.json({ city, wards });
}

// ─── Handler: GET /api/aqi/cities ─────────────────────────────────────────────

export async function getCities(_req: Request, res: Response): Promise<void> {
  const cities = [...new Set(WARD_CONFIGS.map((w) => w.city))];
  res.json({ cities });
}
