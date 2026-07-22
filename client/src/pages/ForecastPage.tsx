import { useState, useEffect, useMemo } from 'react';
import { useCity } from '../context/CityContext';
import { AppLayout } from '../components/layout/AppLayout';
import { AreaChart, Area, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { AlertTriangle } from 'lucide-react';
import { getAQICategory, getAQICSSVar, getAQILabel } from '../types';
import './ForecastPage.css';

interface ForecastPoint {
  timestamp: string;
  aqi: number;
  pm25: number;
  pm10: number;
  no2: number;
}

interface ForecastResponse {
  wardId: string;
  wardName: string;
  city: string;
  lat: number;
  lng: number;
  forecast: ForecastPoint[];
  narrative: string;
}

interface WardInfo {
  wardId: string;
  wardName: string;
}

export function ForecastPage() {
  const { selectedCity } = useCity();
  
  const [wards, setWards] = useState<WardInfo[]>([]);
  const [selectedWardId, setSelectedWardId] = useState<string>('');
  const [forecastData, setForecastData] = useState<ForecastResponse | null>(null);
  
  const [wardsLoading, setWardsLoading] = useState(true);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch Wards when city changes
  useEffect(() => {
    const fetchWards = async () => {
      setWardsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/aqi/wards?city=${encodeURIComponent(selectedCity)}`);
        if (!res.ok) throw new Error('Failed to load wards');
        const data = await res.json();
        setWards(data.wards || []);
        if (data.wards?.length > 0) {
          setSelectedWardId(data.wards[0].wardId);
        } else {
          setSelectedWardId('');
          setForecastData(null);
        }
      } catch (err: any) {
        setError(err.message || 'Error loading wards list');
      } finally {
        setWardsLoading(false);
      }
    };

    fetchWards();
  }, [selectedCity]);

  // Fetch 72-hour forecast when selected ward changes
  useEffect(() => {
    if (!selectedWardId) return;

    const fetchForecast = async () => {
      setForecastLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/aqi/forecast/${selectedWardId}`);
        if (!res.ok) throw new Error('Failed to fetch forecast details');
        const data = await res.json();
        setForecastData(data);
      } catch (err: any) {
        setError(err.message || 'Error loading forecast metrics');
      } finally {
        setForecastLoading(false);
      }
    };

    fetchForecast();
  }, [selectedWardId]);

  // Map series to include formatted ticks and confidence bands
  const chartData = useMemo(() => {
    if (!forecastData?.forecast) return [];
    return forecastData.forecast.map((pt) => {
      const d = new Date(pt.timestamp);
      const hours = d.getHours().toString().padStart(2, '0');
      const day = d.getDate();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[d.getMonth()];
      
      return {
        ...pt,
        formattedTime: `${hours}:00 (${day} ${month})`,
        lowAqi: Math.max(0, Math.round(pt.aqi * 0.85)), // ±15% lower band (Option 1)
        highAqi: Math.round(pt.aqi * 1.15), // ±15% upper band (Option 1)
      };
    });
  }, [forecastData]);

  // Calculate highest & average forecasted values
  const summaryStats = useMemo(() => {
    if (!forecastData?.forecast.length) return { peak: 0, avg: 0, pm25Peak: 0 };
    const values = forecastData.forecast.map((pt) => pt.aqi);
    const pm25s = forecastData.forecast.map((pt) => pt.pm25);
    const peak = Math.max(...values);
    const pm25Peak = Math.max(...pm25s);
    const avg = Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
    return { peak, avg, pm25Peak };
  }, [forecastData]);

  return (
    <AppLayout>
      <div className="forecast-page stagger-fade-in">
        {/* Header Section */}
        <div className="forecast-header">
          <div className="forecast-title-section">
            <h1>Predictive 72-Hour Forecast</h1>
            <p>Hourly ambient air quality predictions model powered by OpenWeather and VayuSense AI</p>
          </div>

          <div className="forecast-controls">
            {!wardsLoading && WardsSelector()}
          </div>
        </div>

        {/* Loading Overlay */}
        {(wardsLoading || forecastLoading) && (
          <div className="loader-container">
            <div className="loading-spinner" style={{ borderTopColor: 'var(--accent-teal)' }} />
            <span>Calculating dynamic aerosol dispersion...</span>
          </div>
        )}

        {/* Error Banner */}
        {error && !wardsLoading && !forecastLoading && (
          <div className="dashboard-error-banner" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Main Workspace */}
        {!wardsLoading && !forecastLoading && forecastData && (
          <div className="forecast-workspace">
            {/* Chart Area */}
            <div className="forecast-chart-card">
              <div className="chart-header">
                <span className="chart-title">72-Hour AQI Prediction Timeline</span>
                <div className="chart-legend">
                  <div className="legend-item">
                    <span className="legend-color aqi" />
                    <span>Forecast AQI</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-color confidence" />
                    <span>Confidence Interval (±15%)</span>
                  </div>
                </div>
              </div>

              <div className="forecast-chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAqiGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent-teal)" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="var(--accent-teal)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis 
                      dataKey="formattedTime" 
                      stroke="var(--text-muted)" 
                      fontSize={9} 
                      tickLine={false}
                      interval={8} 
                    />
                    <YAxis 
                      stroke="var(--text-muted)" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    
                    {/* Confidence Shaded Band (highAqi & lowAqi) */}
                    <Area 
                      type="monotone" 
                      dataKey="highAqi" 
                      stroke="none" 
                      fill="rgba(0, 212, 180, 0.08)" 
                      fillOpacity={1}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="lowAqi" 
                      stroke="none" 
                      fill="var(--bg-primary)" // Mask the bottom of confidence interval
                      fillOpacity={1}
                    />

                    {/* Forecasted Line */}
                    <Line 
                      type="monotone" 
                      dataKey="aqi" 
                      stroke="var(--accent-teal)" 
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 5, stroke: '#fff', strokeWidth: 1.5 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Details Panel */}
            <div className="forecast-details-card">
              <span className="details-title">Forecast Analysis Brief</span>

              {/* AI Forecast narrative summary */}
              <div className="narrative-box">
                <span className="narrative-header">VayuSense AI Narrative</span>
                <span className="narrative-content">"{forecastData.narrative}"</span>
              </div>

              {/* Stats Block */}
              <div className="metrics-summary">
                <div className="metric-row">
                  <span className="metric-label">Forecast Start AQI</span>
                  <span className="metric-val">{forecastData.forecast[0]?.aqi || 'N/A'}</span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">Predicted Peak AQI</span>
                  <span className="metric-val" style={{ color: 'var(--aqi-poor)' }}>{summaryStats.peak}</span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">72h Average AQI</span>
                  <span className="metric-val">{summaryStats.avg}</span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">Max PM2.5 Concentration</span>
                  <span className="metric-val">{summaryStats.pm25Peak} µg/m³</span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">Monitoring Stations</span>
                  <span className="metric-val font-mono">{forecastData.lat.toFixed(3)}°N, {forecastData.lng.toFixed(3)}°E</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );

  function WardsSelector() {
    return (
      <select 
        value={selectedWardId} 
        onChange={(e) => setSelectedWardId(e.target.value)} 
        className="ward-selector-dropdown"
      >
        {wards.map((w) => (
          <option key={w.wardId} value={w.wardId}>
            {w.wardName}
          </option>
        ))}
      </select>
    );
  }
}

function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const cat = getAQICategory(data.aqi);
    const color = getAQICSSVar(cat);
    const label = getAQILabel(cat);
    return (
      <div style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-default)',
        borderRadius: '6px',
        padding: '12px',
        boxShadow: 'var(--shadow-md)',
        fontSize: '12px',
        lineHeight: '1.6'
      }}>
        <div style={{ fontWeight: 700, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px', marginBottom: '6px' }}>
          {data.formattedTime}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '24px' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Forecast AQI:</span>
          <span className="font-mono" style={{ fontWeight: 800, color: 'var(--accent-teal)' }}>{data.aqi}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '24px' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Category:</span>
          <span style={{ fontWeight: 700, color }}>{label}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '24px' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Margin (±15%):</span>
          <span className="font-mono" style={{ color: 'var(--text-secondary)' }}>{data.lowAqi} - {data.highAqi}</span>
        </div>
      </div>
    );
  }
  return null;
}
