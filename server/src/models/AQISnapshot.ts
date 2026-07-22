/**
 * AQISnapshot.ts
 * Ward-level AQI data model for VayuSense.
 * Uses real MongoDB when available, falls back to in-memory store.
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IAQISnapshot extends Document {
  wardId: string;
  wardName: string;
  city: string;
  lat: number;
  lng: number;
  aqi: number;
  pm25: number;
  pm10: number;
  no2: number;
  co: number;
  o3: number;
  so2: number;
  timestamp: Date;
}

const aqiSnapshotSchema = new Schema<IAQISnapshot>({
  wardId:   { type: String, required: true, index: true },
  wardName: { type: String, required: true },
  city:     { type: String, required: true, index: true },
  lat:      { type: Number, required: true },
  lng:      { type: Number, required: true },
  aqi:      { type: Number, required: true },
  pm25:     { type: Number, required: true },
  pm10:     { type: Number, required: true },
  no2:      { type: Number, required: true },
  co:       { type: Number, required: true },
  o3:       { type: Number, default: 0 },
  so2:      { type: Number, default: 0 },
  timestamp: { type: Date, default: Date.now },
});

// TTL index — automatically purge snapshots older than 7 days
aqiSnapshotSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

// Custom static method to get the latest snapshot per ward
aqiSnapshotSchema.statics.findLatestPerWard = async function(city: string) {
  return this.aggregate([
    { $match: { city } },
    { $sort: { timestamp: -1 } },
    {
      $group: {
        _id: '$wardId',
        doc: { $first: '$$ROOT' }
      }
    },
    { $replaceRoot: { newRoot: '$doc' } }
  ]);
};

const AQISnapshotModel = mongoose.model<IAQISnapshot>('AQISnapshot', aqiSnapshotSchema);

// ─── In-memory mock store ─────────────────────────────────────────────────────

export interface MockSnapshot {
  wardId: string;
  wardName: string;
  city: string;
  lat: number;
  lng: number;
  aqi: number;
  pm25: number;
  pm10: number;
  no2: number;
  co: number;
  o3: number;
  so2: number;
  timestamp: Date;
}

// In-memory ring buffer — max 10,000 snapshots
const mockSnapshots: MockSnapshot[] = [];
const MAX_MOCK_SNAPSHOTS = 10_000;

export const MockAQISnapshotModel = {
  insertMany(docs: MockSnapshot[]) {
    mockSnapshots.push(...docs);
    if (mockSnapshots.length > MAX_MOCK_SNAPSHOTS) {
      mockSnapshots.splice(0, mockSnapshots.length - MAX_MOCK_SNAPSHOTS);
    }
    return Promise.resolve(docs);
  },

  find(query: { city?: string; wardId?: string; timestamp?: { $gte?: Date; $lte?: Date } }) {
    let results = [...mockSnapshots];
    if (query.city) results = results.filter((s) => s.city === query.city);
    if (query.wardId) results = results.filter((s) => s.wardId === query.wardId);
    if (query.timestamp?.$gte) {
      results = results.filter((s) => s.timestamp >= query.timestamp!.$gte!);
    }
    if (query.timestamp?.$lte) {
      results = results.filter((s) => s.timestamp <= query.timestamp!.$lte!);
    }
    return {
      sort(_s: unknown) { return this; },
      limit(n: number) { return { then: (r: (v: MockSnapshot[]) => void) => r(results.slice(-n)) }; },
      then: (r: (v: MockSnapshot[]) => void) => r(results),
    };
  },

  /** Get the latest snapshot per ward for a city */
  findLatestPerWard(city: string): MockSnapshot[] {
    const byCityWard = new Map<string, MockSnapshot>();
    for (const s of mockSnapshots) {
      if (s.city !== city) continue;
      const existing = byCityWard.get(s.wardId);
      if (!existing || s.timestamp > existing.timestamp) {
        byCityWard.set(s.wardId, s);
      }
    }
    return Array.from(byCityWard.values());
  },
};

export function getAQISnapshotModel() {
  if (process.env.USE_MOCK_DB === 'true') return MockAQISnapshotModel as any;
  return AQISnapshotModel;
}
