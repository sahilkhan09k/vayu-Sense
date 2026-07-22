/**
 * useAQIData.ts
 * Polls /api/aqi/live every 30 seconds and provides city-level AQI data.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch } from '../utils/apiFetch';

export interface WardAQI {
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
  timestamp: string;
}

export interface LiveAQIData {
  city: string;
  cityAQI: number;
  worstWard: { wardId: string; wardName: string; aqi: number };
  avgPm25: number;
  stationsOnline: number;
  wards: WardAQI[];
  timestamp: string;
}

interface UseAQIDataReturn {
  data: LiveAQIData | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => void;
  secondsSinceUpdate: number;
}

const POLL_INTERVAL_MS = 30_000; // 30 seconds

export function useAQIData(city: string = 'Mumbai'): UseAQIDataReturn {
  const [data, setData] = useState<LiveAQIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [secondsSinceUpdate, setSecondsSinceUpdate] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await apiFetch(`/api/aqi/live?city=${encodeURIComponent(city)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: LiveAQIData = await res.json();
      setData(json);
      setLastUpdated(new Date());
      setSecondsSinceUpdate(0);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load AQI data');
    } finally {
      setLoading(false);
    }
  }, [city]);

  useEffect(() => {
    setLoading(true);
    fetchData();

    // Poll every 30 s
    intervalRef.current = setInterval(fetchData, POLL_INTERVAL_MS);

    // Tick every second for "updated X ago" counter
    tickRef.current = setInterval(() => {
      setSecondsSinceUpdate((s) => s + 1);
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [fetchData]);

  return { data, loading, error, lastUpdated, refresh: fetchData, secondsSinceUpdate };
}
