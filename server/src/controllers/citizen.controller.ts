/**
 * citizen.controller.ts
 * Handlers for citizen-facing API endpoints:
 *  - GET /api/citizen/advisory  — Groq personalized health advisory
 *  - GET /api/citizen/wards     — Ward list for a city
 *  - POST /api/citizen/report   — Submit a community pollution report
 *  - GET /api/citizen/reports   — Recent reports for a city
 */

import { Request, Response } from 'express';
import { WARD_CONFIGS } from './aqi.controller.js';
import { getPollutionReportModel } from '../models/PollutionReport.js';
import { getCitizenAdvisory, getCommuteAdvisory } from '../utils/groq.js';
import { fetchCurrentAirPollution } from '../utils/openweather.js';
import { computeCPCBAQI, calibrateOWMComponents } from '../utils/aqiUtils.js';

// Simple in-memory AQI cache for citizen endpoint (30s TTL)
const aqiQuickCache = new Map<string, { aqi: number; expiresAt: number }>();

async function getWardAQI(wardId: string): Promise<number> {
  const cached = aqiQuickCache.get(wardId);
  if (cached && Date.now() < cached.expiresAt) return cached.aqi;

  const ward = WARD_CONFIGS.find((w) => w.wardId === wardId);
  if (!ward) return 100;

  try {
    const owmKey = process.env.OPENWEATHERMAP_API_KEY;
    if (owmKey) {
      const data = await fetchCurrentAirPollution(ward.lat, ward.lng);
      const cal = calibrateOWMComponents(data.components, ward.city);
      const aqi = computeCPCBAQI({ pm25: cal.pm2_5, pm10: cal.pm10, no2: cal.no2 });
      aqiQuickCache.set(wardId, { aqi, expiresAt: Date.now() + 30_000 });
      return aqi;
    }
  } catch (_e) { /* fall through to mock */ }

  // Deterministic mock fallback
  const h = ward.wardId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const base: Record<string, number> = { Mumbai: 120, Delhi: 180, Bengaluru: 80 };
  return Math.max(30, Math.round((base[ward.city] ?? 130) + ((h % 80) - 40)));
}

// ─── GET /api/citizen/advisory ────────────────────────────────────────────────

export async function getCitizenAdvisoryHandler(req: Request, res: Response): Promise<void> {
  const city = (req.query.city as string) || 'Mumbai';
  const ageGroup = (req.query.ageGroup as string) || 'Adult';
  const sensitivity = (req.query.sensitivity as string) || 'Normal';

  // Get city-level AQI (use first ward of the city as proxy)
  const cityWard = WARD_CONFIGS.find((w) => w.city === city);
  const aqi = cityWard ? await getWardAQI(cityWard.wardId) : 120;

  try {
    const advisory = await getCitizenAdvisory(city, aqi, ageGroup, sensitivity);
    res.json({ city, aqi, ageGroup, sensitivity, advisory });
  } catch (err) {
    console.error('[Citizen] Advisory Groq error:', err);
    res.json({
      city,
      aqi,
      ageGroup,
      sensitivity,
      advisory: `AQI is ${aqi} in ${city} today. ${sensitivity !== 'Normal' ? 'As a sensitive individual, limit outdoor exposure and wear an N95 mask.' : 'Air quality is moderate — brief outdoor activity is fine.'}`,
    });
  }
}

// ─── GET /api/citizen/wards ───────────────────────────────────────────────────

export async function getCitizenWards(req: Request, res: Response): Promise<void> {
  const city = (req.query.city as string) || 'Mumbai';
  const wards = WARD_CONFIGS.filter((w) => w.city === city);

  // Fetch AQI for each ward (batched, cached)
  const results = await Promise.all(
    wards.map(async (w) => ({
      wardId: w.wardId,
      wardName: w.wardName,
      city: w.city,
      lat: w.lat,
      lng: w.lng,
      aqi: await getWardAQI(w.wardId),
    }))
  );

  res.json({ city, wards: results });
}

// ─── GET /api/citizen/commute ─────────────────────────────────────────────────

export async function getCitizenCommuteAdvisory(req: Request, res: Response): Promise<void> {
  const city = (req.query.city as string) || 'Mumbai';
  const fromWardId = req.query.fromWardId as string;
  const toWardId = req.query.toWardId as string;
  const departureTime = (req.query.departureTime as string) || '9:00 AM';

  if (!fromWardId || !toWardId) {
    res.status(400).json({ error: 'fromWardId and toWardId are required' });
    return;
  }

  const fromWard = WARD_CONFIGS.find((w) => w.wardId === fromWardId);
  const toWard = WARD_CONFIGS.find((w) => w.wardId === toWardId);

  if (!fromWard || !toWard) {
    res.status(404).json({ error: 'One or both wards not found' });
    return;
  }

  const [fromAqi, toAqi] = await Promise.all([
    getWardAQI(fromWardId),
    getWardAQI(toWardId),
  ]);

  try {
    const advisory = await getCommuteAdvisory(
      city, fromWard.wardName, toWard.wardName, fromAqi, toAqi, departureTime
    );
    res.json({
      city,
      from: { wardId: fromWardId, wardName: fromWard.wardName, aqi: fromAqi },
      to: { wardId: toWardId, wardName: toWard.wardName, aqi: toAqi },
      departureTime,
      advisory,
    });
  } catch (err) {
    console.error('[Citizen] Commute advisory Groq error:', err);
    const maxAqi = Math.max(fromAqi, toAqi);
    res.json({
      city,
      from: { wardId: fromWardId, wardName: fromWard.wardName, aqi: fromAqi },
      to: { wardId: toWardId, wardName: toWard.wardName, aqi: toAqi },
      departureTime,
      advisory: `AQI along this route ranges from ${fromAqi} to ${toAqi}. ${maxAqi > 150 ? 'Wear an N95 mask and limit exposure.' : 'Air quality is acceptable for this journey.'} Travelling before 8am or after 8pm is recommended for cleaner air.`,
    });
  }
}

// ─── POST /api/citizen/report ─────────────────────────────────────────────────

export async function submitPollutionReport(req: Request, res: Response): Promise<void> {
  const { city, wardId, wardName, category, description, severity, reportedBy } = req.body;

  if (!city || !wardId || !wardName || !category) {
    res.status(400).json({ error: 'city, wardId, wardName, and category are required' });
    return;
  }

  try {
    const Report = getPollutionReportModel();
    const report = await Report.create({
      city,
      wardId,
      wardName,
      category,
      description: description || '',
      severity: Math.min(5, Math.max(1, Number(severity) || 3)),
      reportedBy: reportedBy || null,
    });
    res.status(201).json({ success: true, report });
  } catch (err) {
    console.error('[Citizen] Report submission error:', err);
    res.status(500).json({ error: 'Failed to save report' });
  }
}

// ─── GET /api/citizen/reports ─────────────────────────────────────────────────

export async function getRecentReports(req: Request, res: Response): Promise<void> {
  const city = (req.query.city as string) || 'Mumbai';

  try {
    const Report = getPollutionReportModel();
    const reports = await Report.find({ city }).sort({ reportedAt: -1 }).limit(20);
    res.json({ city, reports });
  } catch (err) {
    console.error('[Citizen] Fetch reports error:', err);
    res.json({ city, reports: [] });
  }
}
