/**
 * useHistoricalAQI.ts
 * Fetches /api/aqi/history for time-lapse and trend charts.
 */

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../utils/apiFetch';

export interface AQISeriesPoint {
  timestamp: string;
  aqi: number;
  pm25: number;
  pm10: number;
  no2: number;
}

export interface WardHistorySeries {
  wardId: string;
  wardName: string;
  series: AQISeriesPoint[];
}

export interface HistoricalAQIData {
  city: string;
  hours: number;
  wards: WardHistorySeries[];
}

interface UseHistoricalAQIReturn {
  data: HistoricalAQIData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useHistoricalAQI(
  city: string = 'Mumbai',
  hours: number = 24,
  wardId?: string,
): UseHistoricalAQIReturn {
  const [data, setData] = useState<HistoricalAQIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ city, hours: String(hours) });
      if (wardId) params.set('wardId', wardId);
      const res = await apiFetch(`/api/aqi/history?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: HistoricalAQIData = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }, [city, hours, wardId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
