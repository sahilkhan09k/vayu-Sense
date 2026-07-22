/**
 * forecast.controller.ts
 * Handlers for 72-hour AQI forecasts and forecast accuracy tracking.
 */

import { Request, Response } from 'express';
import { fetchForecastAirPollution } from '../utils/openweather.js';
import { computeCPCBAQI, calibrateOWMComponents } from '../utils/aqiUtils.js';
import { getForecastNarrative } from '../utils/groq.js';
import { WARD_CONFIGS } from './aqi.controller.js';
import { getForecastSnapshotModel, seedMockForecastHistory } from '../models/ForecastSnapshot.js';

/**
 * Generate synthetic forecast values based on time and coordinate hashes.
 */
function generateMockForecastPoint(wardId: string, timestamp: Date, hourOffset: number) {
  const hash = wardId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const timeHours = Math.floor(timestamp.getTime() / (3600 * 1000));
  
  // Wave patterns for realistic daily fluctuation
  const diurnal = Math.sin((timeHours + hourOffset) * (Math.PI / 12)); // 24-hr cycle
  const multiDay = Math.cos((timeHours + hourOffset) * (Math.PI / 36)); // 72-hr cycle
  
  const base = wardId.includes('delhi') ? 220 : wardId.includes('bengaluru') ? 70 : 130;
  const aqi = Math.max(15, Math.round(base + diurnal * 30 + multiDay * 20 + (hash % 15)));
  
  return {
    timestamp: timestamp.toISOString(),
    aqi,
    pm25: Math.round(aqi * 0.28 + 5),
    pm10: Math.round(aqi * 0.45 + 10),
    no2: Math.round((aqi / 200) * 60 + 10),
  };
}

/**
 * GET /api/aqi/forecast/:wardId
 * Generates or fetches the 72-hour hourly forecast.
 */
export async function getLiveForecast(req: Request, res: Response): Promise<void> {
  const { wardId } = req.params;
  const ward = WARD_CONFIGS.find((w) => w.wardId === wardId);

  if (!ward) {
    res.status(404).json({ message: 'Ward not found' });
    return;
  }

  const owmKey = process.env.OPENWEATHERMAP_API_KEY;
  const now = new Date();

  try {
    let series: Array<{ timestamp: string; aqi: number; pm25: number; pm10: number; no2: number }> = [];

    if (owmKey) {
      try {
        const forecastData = await fetchForecastAirPollution(ward.lat, ward.lng);
        // Filter first 72 points and convert components to CPCB AQI
        series = forecastData.slice(0, 72).map((pt) => {
          const calibrated = calibrateOWMComponents(pt.components, ward.city);
          return {
            timestamp: new Date(pt.dt * 1000).toISOString(),
            aqi: computeCPCBAQI({ pm25: calibrated.pm2_5, pm10: calibrated.pm10, no2: calibrated.no2 }),
            pm25: Math.round(calibrated.pm2_5),
            pm10: Math.round(calibrated.pm10),
            no2: Math.round(calibrated.no2),
          };
        });
      } catch (owmErr) {
        console.warn(`[Forecast] OWM fetch failed for ${ward.wardName}, using mock fallback:`, owmErr);
        series = [];
        for (let i = 0; i < 72; i++) {
          const timestamp = new Date(now.getTime() + i * 3600 * 1000);
          series.push(generateMockForecastPoint(ward.wardId, timestamp, i));
        }
      }
    } else {
      // Mock forecast generation
      for (let i = 0; i < 72; i++) {
        const timestamp = new Date(now.getTime() + i * 3600 * 1000);
        series.push(generateMockForecastPoint(ward.wardId, timestamp, i));
      }
    }

    // Extract summary stats for Groq narrative
    const startAqi = series[0]?.aqi || 100;
    const endAqi = series[series.length - 1]?.aqi || 100;
    const maxAqi = Math.max(...series.map((s) => s.aqi));
    const trendDescription = `Starting at AQI ${startAqi}, peaking at ${maxAqi}, ending at ${endAqi} over the next 72 hours.`;

    let narrative = '';
    try {
      narrative = await getForecastNarrative(ward.wardName, ward.city, startAqi, trendDescription);
    } catch (groqErr) {
      console.warn(`[Forecast] Groq narrative failed for ${ward.wardName}, using default:`, groqErr);
      narrative = `The 72-hour air quality forecast for ${ward.wardName} indicates a starting AQI of ${startAqi}, peaking at ${maxAqi} with a subsequent trend towards ${endAqi}. Atmospheric dispersion conditions are expected to remain moderate. Individuals with respiratory conditions should exercise caution during peak hours.`;
    }

    res.json({
      wardId: ward.wardId,
      wardName: ward.wardName,
      city: ward.city,
      lat: ward.lat,
      lng: ward.lng,
      forecast: series,
      narrative,
    });
  } catch (error) {
    console.error('[Forecast] Error generating forecast:', error);
    res.status(500).json({ message: 'Error generating forecast data.' });
  }
}

/**
 * GET /api/aqi/accuracy
 * Returns historical prediction accuracy metrics and error analysis graphs.
 */
export async function getForecastAccuracy(req: Request, res: Response): Promise<void> {
  const city = (req.query.city as string) || 'Mumbai';

  try {
    if (process.env.USE_MOCK_DB === 'true') {
      seedMockForecastHistory(WARD_CONFIGS);
    }

    const ForecastSnapshot = getForecastSnapshotModel();
    const snapshots = await ForecastSnapshot.find({ city });

    if (snapshots.length === 0) {
      res.json({
        metrics: { mae: 0, rmse: 0, baselineMae: 0, baselineRmse: 0, totalEvaluations: 0 },
        comparisonTimeline: [],
      });
      return;
    }

    // Perform calculation metrics
    let absoluteErrorSum = 0;
    let squaredErrorSum = 0;
    let baselineAbsoluteSum = 0;
    let baselineSquaredSum = 0;

    snapshots.forEach((s: any) => {
      absoluteErrorSum += Math.abs(s.predictedAqi - s.actualAqi);
      squaredErrorSum += Math.pow(s.predictedAqi - s.actualAqi, 2);
      baselineAbsoluteSum += Math.abs(s.persistenceAqi - s.actualAqi);
      baselineSquaredSum += Math.pow(s.persistenceAqi - s.actualAqi, 2);
    });

    const N = snapshots.length;
    const mae = parseFloat((absoluteErrorSum / N).toFixed(2));
    const rmse = parseFloat(Math.sqrt(squaredErrorSum / N).toFixed(2));
    const baselineMae = parseFloat((baselineAbsoluteSum / N).toFixed(2));
    const baselineRmse = parseFloat(Math.sqrt(baselineSquaredSum / N).toFixed(2));

    const comparisonTimeline = snapshots.map((s: any) => ({
      timestamp: s.targetTime.toISOString(),
      predicted: s.predictedAqi,
      actual: s.actualAqi,
      baseline: s.persistenceAqi,
    }));

    res.json({
      metrics: { mae, rmse, baselineMae, baselineRmse, totalEvaluations: N },
      comparisonTimeline,
    });
  } catch (error) {
    console.error('[Accuracy] Error loading accuracy dashboard:', error);
    res.status(500).json({ message: 'Error fetching forecast accuracy statistics.' });
  }
}
