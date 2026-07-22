/**
 * ForecastSnapshot.ts
 * Stores previous predictions to calculate forecast accuracy.
 * Automatically generates a historical database in mock mode.
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IForecastSnapshot extends Document {
  wardId: string;
  wardName: string;
  city: string;
  forecastMadeAt: Date;
  targetTime: Date;
  predictedAqi: number;
  actualAqi: number;
  persistenceAqi: number;
}

const forecastSnapshotSchema = new Schema<IForecastSnapshot>({
  wardId:         { type: String, required: true, index: true },
  wardName:       { type: String, required: true },
  city:           { type: String, required: true, index: true },
  forecastMadeAt: { type: Date, required: true },
  targetTime:     { type: Date, required: true, index: true },
  predictedAqi:   { type: Number, required: true },
  actualAqi:      { type: Number, required: true },
  persistenceAqi: { type: Number, required: true },
});

const ForecastSnapshotModel = mongoose.model<IForecastSnapshot>('ForecastSnapshot', forecastSnapshotSchema);

// ─── Mock seeder & store ──────────────────────────────────────────────────────

export interface MockForecastSnapshot {
  wardId: string;
  wardName: string;
  city: string;
  forecastMadeAt: Date;
  targetTime: Date;
  predictedAqi: number;
  actualAqi: number;
  persistenceAqi: number;
}

const mockSnapshots: MockForecastSnapshot[] = [];

// Helper to generate a stable, deterministic AQI
function getMockAqi(wardId: string, timestamp: Date): number {
  const hash = wardId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const timeHours = Math.floor(timestamp.getTime() / (3600 * 1000));
  const sine = Math.sin((timeHours + hash) * 0.1);
  const base = wardId.includes('delhi') ? 220 : wardId.includes('bengaluru') ? 70 : 130;
  return Math.max(20, Math.round(base + sine * 45));
}

// Generate historical evaluations for the past 7 days (hourly)
export function seedMockForecastHistory(wardConfigs: Array<{ wardId: string; wardName: string; city: string }>) {
  if (mockSnapshots.length > 0) return;

  const now = new Date();
  const MS_PER_HOUR = 3600 * 1000;

  // Let's seed the past 7 days of predictions (every 6 hours to keep memory compact but descriptive)
  for (const ward of wardConfigs) {
    for (let hoursAgo = 168; hoursAgo >= 0; hoursAgo -= 6) {
      const targetTime = new Date(now.getTime() - hoursAgo * MS_PER_HOUR);
      const forecastMadeAt = new Date(targetTime.getTime() - 24 * MS_PER_HOUR); // made 24 hours prior

      const actualAqi = getMockAqi(ward.wardId, targetTime);
      const persistenceAqi = getMockAqi(ward.wardId, forecastMadeAt);

      // Add a slight random prediction error (e.g. ±12%)
      const hash = ward.wardId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
      const seed = Math.sin(targetTime.getTime() + hash) * 1000;
      const errorFactor = 1 + ((seed - Math.floor(seed)) * 0.24 - 0.12); // -12% to +12%
      const predictedAqi = Math.max(15, Math.round(actualAqi * errorFactor));

      mockSnapshots.push({
        wardId: ward.wardId,
        wardName: ward.wardName,
        city: ward.city,
        forecastMadeAt,
        targetTime,
        predictedAqi,
        actualAqi,
        persistenceAqi,
      });
    }
  }
}

export const MockForecastSnapshotModel = {
  find(query: { city?: string; wardId?: string }) {
    let results = [...mockSnapshots];
    if (query.city) results = results.filter((s) => s.city === query.city);
    if (query.wardId) results = results.filter((s) => s.wardId === query.wardId);
    
    // Sort chronological
    results.sort((a, b) => a.targetTime.getTime() - b.targetTime.getTime());

    return {
      then: (r: (v: MockForecastSnapshot[]) => void) => r(results),
    };
  }
};

export function getForecastSnapshotModel() {
  if (process.env.USE_MOCK_DB === 'true') return MockForecastSnapshotModel as any;
  return ForecastSnapshotModel;
}
