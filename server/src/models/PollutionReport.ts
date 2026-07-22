/**
 * PollutionReport.ts
 * Mongoose schema + in-memory fallback for citizen community pollution reports.
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IPollutionReport extends Document {
  city: string;
  wardId: string;
  wardName: string;
  category: string;
  description: string;
  severity: number; // 1–5
  reportedAt: Date;
  reportedBy: string | null;
}

const pollutionReportSchema = new Schema<IPollutionReport>({
  city:        { type: String, required: true },
  wardId:      { type: String, required: true },
  wardName:    { type: String, required: true },
  category:    { type: String, required: true },
  description: { type: String, default: '' },
  severity:    { type: Number, min: 1, max: 5, default: 3 },
  reportedAt:  { type: Date, default: Date.now },
  reportedBy:  { type: String, default: null },
});

pollutionReportSchema.index({ city: 1, reportedAt: -1 });

const MongoosePollutionReport = mongoose.model<IPollutionReport>('PollutionReport', pollutionReportSchema);

// ─── In-memory fallback ───────────────────────────────────────────────────────

const mockReports: any[] = [];
let mockReportId = 1;

const MockPollutionReportModel = {
  find: (query: any) => {
    let results = [...mockReports];
    if (query?.city) results = results.filter((r) => r.city === query.city);
    return {
      sort: (_s: any) => ({
        limit: (n: number) => Promise.resolve(results.slice(0, n)),
      }),
    };
  },
  create: async (data: any) => {
    const report = {
      _id: `mock_report_${mockReportId++}`,
      ...data,
      reportedAt: new Date(),
    };
    mockReports.unshift(report);
    return report;
  },
};

export function getPollutionReportModel(): any {
  if (process.env.USE_MOCK_DB === 'true') return MockPollutionReportModel;
  return MongoosePollutionReport;
}
