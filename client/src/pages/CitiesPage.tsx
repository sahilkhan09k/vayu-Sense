import { useState, useEffect } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { getAQICategory } from '../types';
import { apiFetch } from '../utils/apiFetch';
import './CitiesPage.css';

interface CityData {
  city: string;
  aqi: number;
  pm25: number;
  pm10: number;
  no2: number;
  stationsOnline: number;
  totalStations: number;
}

export function CitiesPage() {
  const [data, setData] = useState<CityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComparisonData = async () => {
    setLoading(true);
    setError(null);
    try {
      const cities = ['Mumbai', 'Delhi', 'Bengaluru'];
      const promises = cities.map(async (city) => {
        const res = await apiFetch(`/api/aqi/live?city=${city}`);
        if (!res.ok) throw new Error(`Failed to fetch ${city}`);
        const json = await res.json();
        return {
          city,
          aqi: json.cityAQI,
          pm25: Math.round(json.avgPm25),
          pm10: Math.round(json.avgPm10 || json.avgPm25 * 1.8), // safety fallback if pm10 is not populated
          no2: Math.round(json.avgNo2 || 25),
          stationsOnline: json.stationsOnline,
          totalStations: json.wards.length,
        };
      });

      const results = await Promise.all(promises);
      setData(results);
    } catch (err: any) {
      console.error('[Cities comparison] Fetch error:', err);
      setError(err.message || 'Error fetching comparison data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComparisonData();
  }, []);

  const getStatusColor = (category: string) => {
    switch (category) {
      case 'good': return '#00C851';
      case 'satisfactory': return '#A8D500';
      case 'moderate': return '#FFBB00';
      case 'poor': return '#FF7700';
      case 'very-poor': return '#FF3300';
      default: return '#990000';
    }
  };

  const formatStatus = (category: string) => {
    return category.toUpperCase().replace('-', ' ');
  };

  return (
    <AppLayout>
      <div className="cities-container stagger-fade-in">
        <div className="cities-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="cities-title">
              Multi-City <span>Comparison</span>
            </h1>
            <p className="cities-subtitle">
              Contrast atmospheric profiles and criteria pollutants across key metropolitan hubs
            </p>
          </div>
          <button
            onClick={fetchComparisonData}
            className="dashboard-refresh-btn"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              padding: '8px 16px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            {loading ? 'Syncing...' : 'Refresh'}
          </button>
        </div>

        {error && (
          <div className="dashboard-error-banner">
            <AlertTriangle size={18} />
            <span>Error connecting to telemetry network: {error}</span>
          </div>
        )}

        {loading && data.length === 0 ? (
          <div className="dashboard-loader-overlay">
            <div className="loading-spinner" style={{ borderTopColor: 'var(--accent-teal)' }} />
            <span>Harmonizing multi-city sensory streams...</span>
          </div>
        ) : (
          <>
            {/* Compare cards */}
            <div className="cities-grid">
              {data.map((cityData) => {
                const cat = getAQICategory(cityData.aqi);
                const statusColor = getStatusColor(cat);

                return (
                  <div key={cityData.city} className="city-compare-card">
                    <div className="city-card-header">
                      <span className="city-card-name">{cityData.city}</span>
                      <span
                        className="city-card-status"
                        style={{ background: `${statusColor}22`, color: statusColor, border: `1px solid ${statusColor}44` }}
                      >
                        {formatStatus(cat)}
                      </span>
                    </div>

                    <div className="city-card-aqi-row">
                      <span className="city-card-aqi-val" style={{ color: statusColor }}>{cityData.aqi}</span>
                      <span className="city-card-aqi-unit">AQI</span>
                    </div>

                    <div className="city-pollutants-list">
                      <div className="pollutant-row">
                        <span className="pollutant-label">PM2.5</span>
                        <span className="pollutant-value font-mono">{cityData.pm25} µg/m³</span>
                      </div>
                      <div className="pollutant-row">
                        <span className="pollutant-label">PM10</span>
                        <span className="pollutant-value font-mono">{cityData.pm10} µg/m³</span>
                      </div>
                      <div className="pollutant-row">
                        <span className="pollutant-label">NO₂</span>
                        <span className="pollutant-value font-mono">{cityData.no2} µg/m³</span>
                      </div>
                      <div className="pollutant-row" style={{ marginTop: '8px', fontSize: '11px' }}>
                        <span className="pollutant-label">Sensors Online</span>
                        <span className="pollutant-value font-mono">{cityData.stationsOnline} / {cityData.totalStations}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Comparison Charts */}
            <div className="cities-charts-panel">
              <span className="panel-title">Criteria Pollutant Comparison (µg/m³)</span>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                    <XAxis dataKey="city" stroke="var(--text-secondary)" />
                    <YAxis stroke="var(--text-secondary)" />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-default)',
                        borderRadius: '8px',
                        color: 'var(--text-primary)'
                      }}
                    />
                    <Legend wrapperStyle={{ color: 'var(--text-primary)' }} />
                    <Bar dataKey="pm25" name="PM2.5" fill="#00D4B4" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="pm10" name="PM10" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="no2" name="NO₂" fill="#a78bfa" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
