import { useState, useEffect, useMemo, useRef } from 'react';
import { useCity } from '../context/CityContext';
import { useHistoricalAQI } from '../hooks/useHistoricalAQI';
import { AppLayout } from '../components/layout/AppLayout';
import { BaseMap } from '../components/map/BaseMap';
import { Play, Pause, RotateCcw } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { getAQICategory, getAQILabel } from '../types';
import './HistoryPage.css';

const TIME_OPTIONS = [
  { label: '24 Hours', value: 24 },
  { label: '48 Hours', value: 48 },
  { label: '7 Days', value: 168 },
];

export function HistoryPage() {
  const { selectedCity } = useCity();
  const [timeRange, setTimeRange] = useState(24);
  const [selectedWardId, setSelectedWardId] = useState<string>('ward-andheri-east');

  // Load historical data for all wards in city
  const { data, loading, error } = useHistoricalAQI(selectedCity, timeRange);

  // Playback States
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const playIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const selectedWard = useMemo(() => {
    if (!data) return null;
    return data.wards.find((w) => w.wardId === selectedWardId) || data.wards[0] || null;
  }, [data, selectedWardId]);

  // Total indices in time series
  const maxIndex = useMemo(() => {
    if (!selectedWard) return 0;
    return selectedWard.series.length - 1;
  }, [selectedWard]);

  // Sync ward lists when city changes
  useEffect(() => {
    if (data?.wards.length) {
      setSelectedWardId(data.wards[0].wardId);
      setCurrentIndex(0);
      setIsPlaying(false);
    }
  }, [data]);

  // Playback timer loop
  useEffect(() => {
    if (isPlaying) {
      playIntervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev >= maxIndex) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 350); // Speed of time-lapse playback (350ms per step)
    } else {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    }

    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, [isPlaying, maxIndex]);

  // Extract aqi values for all wards at the active index to pass to map
  const activeAQIMap = useMemo(() => {
    if (!data) return {};
    const map: Record<string, number> = {};
    for (const ward of data.wards) {
      const point = ward.series[currentIndex];
      if (point) {
        map[ward.wardId] = point.aqi;
      }
    }
    return map;
  }, [data, currentIndex]);

  const activeTimestamp = useMemo(() => {
    if (!selectedWard) return '';
    const pt = selectedWard.series[currentIndex];
    if (!pt) return '';
    return new Date(pt.timestamp).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }, [selectedWard, currentIndex]);

  // Chart data format
  const chartData = useMemo(() => {
    if (!selectedWard) return [];
    return selectedWard.series.map((pt, index) => ({
      ...pt,
      formattedTime: new Date(pt.timestamp).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
      index,
    }));
  }, [selectedWard]);

  const activePoint = selectedWard?.series[currentIndex] || null;

  return (
    <AppLayout>
      <div className="history-container stagger-fade-in">
        {/* Top Control Bar */}
        <div className="history-header">
          <div>
            <h1 className="dashboard-logo">
              Historical <span>Time-lapse</span> Explorer
            </h1>
            <p className="dashboard-subtitle">
              Rewind, analyze, and playback air pollution trends in {selectedCity}
            </p>
          </div>

          <div className="history-options">
            <div className="range-selector">
              {TIME_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  className={`range-btn ${timeRange === opt.value ? 'range-btn--active' : ''}`}
                  onClick={() => setTimeRange(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {data && (
              <select
                className="vs-select ward-dropdown"
                value={selectedWardId}
                onChange={(e) => setSelectedWardId(e.target.value)}
              >
                {data.wards.map((w) => (
                  <option key={w.wardId} value={w.wardId}>
                    {w.wardName}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Loaders */}
        {loading && (
          <div className="dashboard-loader-overlay">
            <div className="loading-spinner" />
            <span>Retreiving historical timeline data...</span>
          </div>
        )}

        {error && (
          <div className="dashboard-error-banner">
            <span>⚠️ Fail to load historical analysis: {error}</span>
          </div>
        )}

        {/* Interactive Workspace */}
        {data && !loading && (
          <div className="history-workspace">
            {/* Map Area */}
            <div className="history-map-area">
              <div className="history-map-box">
                <BaseMap
                  aqiData={activeAQIMap}
                  clickedWardId={selectedWardId}
                  onWardClick={(id) => setSelectedWardId(id)}
                />
              </div>

              {/* Time Scrubber Controls */}
              <div className="history-playback-controls">
                <div className="playback-btns">
                  <button
                    className="control-btn"
                    onClick={() => {
                      setCurrentIndex(0);
                      setIsPlaying(false);
                    }}
                    title="Rewind to start"
                  >
                    <RotateCcw size={16} />
                  </button>
                  <button
                    className="control-btn play-pause"
                    onClick={() => {
                      if (currentIndex >= maxIndex) {
                        setCurrentIndex(0);
                      }
                      setIsPlaying(!isPlaying);
                    }}
                    title={isPlaying ? 'Pause playback' : 'Play timeline'}
                  >
                    {isPlaying ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: 2 }} />}
                  </button>
                </div>

                <div className="scrubber-slider-wrapper">
                  <input
                    type="range"
                    min={0}
                    max={maxIndex}
                    value={currentIndex}
                    onChange={(e) => {
                      setCurrentIndex(parseInt(e.target.value));
                      setIsPlaying(false);
                    }}
                    className="scrubber-range"
                  />
                  <div className="scrubber-meta">
                    <span className="timestamp font-mono">{activeTimestamp}</span>
                    <span className="step-indicator font-mono">
                      Step {currentIndex + 1} / {maxIndex + 1}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Analysis Sidebar */}
            <div className="history-analysis-sidebar">
              {/* Active state values */}
              {activePoint && selectedWard && (
                <div className="sidebar-stats-card">
                  <div className="stats-card-header">
                    <div>
                      <h4 className="ward-title">{selectedWard.wardName}</h4>
                      <p className="timestamp font-mono">{activeTimestamp}</p>
                    </div>
                    <div
                      className="category-badge font-mono"
                      style={{
                        backgroundColor: `var(--aqi-${getAQICategory(activePoint.aqi)})`,
                        color: ['satisfactory', 'moderate'].includes(getAQICategory(activePoint.aqi)) ? 'var(--bg-primary)' : '#fff',
                      }}
                    >
                      {getAQILabel(getAQICategory(activePoint.aqi))}
                    </div>
                  </div>
                  <div className="stats-grid">
                    <div className="stat-box">
                      <span className="stat-label">AQI</span>
                      <span className="stat-val font-mono">{activePoint.aqi}</span>
                    </div>
                    <div className="stat-box">
                      <span className="stat-label">PM2.5</span>
                      <span className="stat-val font-mono">{activePoint.pm25} µg/m³</span>
                    </div>
                    <div className="stat-box">
                      <span className="stat-label">PM10</span>
                      <span className="stat-val font-mono">{activePoint.pm10} µg/m³</span>
                    </div>
                    <div className="stat-box">
                      <span className="stat-label">NO₂</span>
                      <span className="stat-val font-mono">{activePoint.no2} µg/m³</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Trend Chart */}
              <div className="history-chart-wrapper">
                <h4 className="section-label">AQI Trend Line</h4>
                <div style={{ width: '100%', height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      onMouseMove={(state) => {
                        if (state && typeof state.activeTooltipIndex === 'number') {
                          setCurrentIndex(state.activeTooltipIndex);
                          setIsPlaying(false);
                        }
                      }}
                    >
                      <XAxis
                        dataKey="formattedTime"
                        stroke="var(--text-muted)"
                        tick={{ fontSize: 10 }}
                        tickLine={false}
                      />
                      <YAxis
                        stroke="var(--text-muted)"
                        tick={{ fontSize: 10 }}
                        domain={[0, 'auto']}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--bg-elevated)',
                          borderColor: 'var(--border-default)',
                          borderRadius: '8px',
                          color: '#fff',
                        }}
                      />
                      {/* Vertical line matching active slider point */}
                      <ReferenceLine x={chartData[currentIndex]?.formattedTime} stroke="var(--accent-teal)" strokeDasharray="3 3" />
                      <Line
                        type="monotone"
                        dataKey="aqi"
                        stroke="var(--accent-teal)"
                        strokeWidth={2.5}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
