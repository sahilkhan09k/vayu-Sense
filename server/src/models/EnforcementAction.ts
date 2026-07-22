/**
 * EnforcementAction.ts
 * Logged violation actions and inspection orders.
 * Uses real MongoDB when available, falls back to in-memory store.
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IEnforcementAction extends Document {
  wardId: string;
  wardName: string;
  city: string;
  officerName: string;
  officerId: string;
  violationType: string;
  severity: 'Moderate' | 'High' | 'Critical';
  status: 'Pending' | 'Resolved' | 'In Progress';
  notes: string;
  createdAt: Date;
}

const enforcementActionSchema = new Schema<IEnforcementAction>({
  wardId:        { type: String, required: true, index: true },
  wardName:      { type: String, required: true },
  city:          { type: String, required: true, index: true },
  officerName:   { type: String, required: true },
  officerId:     { type: String, required: true },
  violationType: { type: String, required: true },
  severity:      { type: String, enum: ['Moderate', 'High', 'Critical'], required: true },
  status:        { type: String, enum: ['Pending', 'Resolved', 'In Progress'], default: 'Pending' },
  notes:         { type: String, required: true },
  createdAt:     { type: Date, default: Date.now, index: true },
});

const EnforcementActionModel = mongoose.model<IEnforcementAction>('EnforcementAction', enforcementActionSchema);

// ─── In-memory mock store ─────────────────────────────────────────────────────

export interface MockEnforcementAction {
  _id?: string;
  wardId: string;
  wardName: string;
  city: string;
  officerName: string;
  officerId: string;
  violationType: string;
  severity: 'Moderate' | 'High' | 'Critical';
  status: 'Pending' | 'Resolved' | 'In Progress';
  notes: string;
  createdAt: Date;
}

const mockEnforcementActions: MockEnforcementAction[] = [
  {
    _id: 'mock_action_1',
    wardId: 'ward-kurla',
    wardName: 'Kurla',
    city: 'Mumbai',
    officerName: 'Mumbai City Administrator',
    officerId: 'mock_city_1',
    violationType: 'Construction Dust',
    severity: 'High',
    status: 'In Progress',
    notes: 'Uncovered sand storage at construction site, issued fine of ₹50,000.',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
  },
  {
    _id: 'mock_action_2',
    wardId: 'ward-dadar',
    wardName: 'Dadar',
    city: 'Mumbai',
    officerName: 'Mumbai City Administrator',
    officerId: 'mock_city_1',
    violationType: 'Biomass Burning',
    severity: 'Critical',
    status: 'Resolved',
    notes: 'Garbage burning in open vacant plot doused, warned local vendors.',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
  }
];

let idCounter = 3;

export const MockEnforcementActionModel = {
  find(query: { city?: string }) {
    let results = [...mockEnforcementActions];
    if (query.city) {
      results = results.filter((x) => x.city === query.city);
    }
    // Sort descending by date
    results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return {
      then: (r: (v: MockEnforcementAction[]) => void) => r(results),
    };
  },
  create(data: Omit<MockEnforcementAction, '_id' | 'createdAt'>) {
    const newAction: MockEnforcementAction = {
      ...data,
      _id: `mock_action_${idCounter++}`,
      createdAt: new Date(),
    };
    mockEnforcementActions.push(newAction);
    return Promise.resolve(newAction);
  }
};

export function getEnforcementActionModel() {
  if (process.env.USE_MOCK_DB === 'true') return MockEnforcementActionModel as any;
  return EnforcementActionModel;
}
