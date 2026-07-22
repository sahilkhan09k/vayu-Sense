/**
 * SettingsPage.tsx — Page 17
 * Admin Settings & Data Source Configuration.
 * State authority only. Shows system health, calibration scales, and platform config.
 */
import { useState, useEffect } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import {
  Settings,
  Database,
  Cpu,
  Cloud,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Save,
  AlertTriangle,
  Zap,
  BarChart3,
  Shield,
} from 'lucide-react';
import './SettingsPage.css';

interface CalibrationCity {
  pm25: number;
  pm10: number;
  no2: number;
}

interface CalibrationScales {
  [city: string]: CalibrationCity;
}

interface SettingsData {
  calibrationScales: CalibrationScales;
  useMockDb: boolean;
}

interface ServiceStatus {
  name: string;
  status: 'online' | 'offline' | 'checking';
  latency?: number;
  icon: React.ReactNode;
  description: string;
}

const CITIES = ['Mumbai', 'Delhi', 'Bengaluru'];

export function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Local editable state for calibration
  const [calibration, setCalibration] = useState<CalibrationScales>({});
  const [useMockDb, setUseMockDb] = useState(false);

  // Service health statuses
  const [services, setServices] = useState<ServiceStatus[]>([
    {
      name: 'MongoDB Atlas',
      status: 'checking',
      icon: <Database size={18} />,
      description: 'Primary AQI + User database',
    },
    {
      name: 'Groq AI Engine',
      status: 'checking',
      icon: <Cpu size={18} />,
      description: 'GPT-OSS 20B — Source attribution & advisories',
    },
    {
      name: 'OpenWeatherMap',
      status: 'checking',
      icon: <Cloud size={18} />,
      description: 'Meteorological data for forecasting',
    },
    {
      name: 'CPCB Data Feed',
      status: 'checking',
      icon: <BarChart3 size={18} />,
      description: 'Live sensor telemetry streams',
    },
  ]);

  useEffect(() => {
    fetchSettings();
    checkServiceHealth();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data: SettingsData = await res.json();
        setSettings(data);
        setCalibration(data.calibrationScales || {});
        setUseMockDb(data.useMockDb);
      }
    } catch (err) {
      setError('Failed to load settings from server.');
    } finally {
      setLoading(false);
    }
  };

  const checkServiceHealth = async () => {
    // Check API health endpoint (MongoDB + Express)
    const start = Date.now();
    try {
      const res = await fetch('/api/settings');
      const latency = Date.now() - start;
      setServices((prev) =>
        prev.map((s) =>
          s.name === 'MongoDB Atlas'
            ? { ...s, status: res.ok ? 'online' : 'offline', latency }
            : s
        )
      );
    } catch {
      setServices((prev) =>
        prev.map((s) =>
          s.name === 'MongoDB Atlas' ? { ...s, status: 'offline' } : s
        )
      );
    }

    // Groq: test via a lightweight API call — we just check our server can reach it
    try {
      const groqStart = Date.now();
      const res = await fetch('/api/citizen/advisory?city=Mumbai&ageGroup=Adult&sensitivity=Normal');
      const groqLatency = Date.now() - groqStart;
      setServices((prev) =>
        prev.map((s) =>
          s.name === 'Groq AI Engine'
            ? { ...s, status: res.ok ? 'online' : 'offline', latency: groqLatency }
            : s
        )
      );
    } catch {
      setServices((prev) =>
        prev.map((s) =>
          s.name === 'Groq AI Engine' ? { ...s, status: 'offline' } : s
        )
      );
    }

    // OpenWeatherMap: check via forecast endpoint (it uses OWM internally)
    try {
      const owmStart = Date.now();
      const res = await fetch('/api/forecast/live?wardId=MUM_W001&city=Mumbai');
      const owmLatency = Date.now() - owmStart;
      setServices((prev) =>
        prev.map((s) =>
          s.name === 'OpenWeatherMap'
            ? { ...s, status: res.ok ? 'online' : 'offline', latency: owmLatency }
            : s
        )
      );
    } catch {
      setServices((prev) =>
        prev.map((s) =>
          s.name === 'OpenWeatherMap' ? { ...s, status: 'offline' } : s
        )
      );
    }

    // CPCB: check live AQI endpoint
    try {
      const cpcbStart = Date.now();
      const res = await fetch('/api/aqi/live?city=Mumbai');
      const cpcbLatency = Date.now() - cpcbStart;
      setServices((prev) =>
        prev.map((s) =>
          s.name === 'CPCB Data Feed'
            ? { ...s, status: res.ok ? 'online' : 'offline', latency: cpcbLatency }
            : s
        )
      );
    } catch {
      setServices((prev) =>
        prev.map((s) =>
          s.name === 'CPCB Data Feed' ? { ...s, status: 'offline' } : s
        )
      );
    }
  };

  const handleCalibrationChange = (
    city: string,
    field: keyof CalibrationCity,
    value: string
  ) => {
    const num = parseFloat(value);
    if (isNaN(num)) return;
    setCalibration((prev) => ({
      ...prev,
      [city]: { ...prev[city], [field]: num },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSavedOk(false);
    setError(null);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calibrationScales: calibration, useMockDb }),
      });
      if (res.ok) {
        setSavedOk(true);
        setTimeout(() => setSavedOk(false), 3000);
      } else {
        throw new Error('Server returned error');
      }
    } catch {
      setError('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const onlineCount = services.filter((s) => s.status === 'online').length;

  return (
    <AppLayout>
      <div className="settings-container stagger-fade-in">
        {/* Header */}
        <div className="settings-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="settings-header-icon">
              <Settings size={22} />
            </div>
            <div>
              <h1 className="settings-title">
                Platform <span>Configuration</span>
              </h1>
              <p className="settings-subtitle">
                System health monitoring, sensor calibration, and data source management
              </p>
            </div>
          </div>
          <div className="settings-health-pill" data-status={onlineCount === services.length ? 'all-online' : onlineCount === 0 ? 'all-offline' : 'partial'}>
            <div className="settings-health-dot" />
            <span>{onlineCount}/{services.length} Services Online</span>
          </div>
        </div>

        {error && (
          <div className="settings-error-banner">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        {savedOk && (
          <div className="settings-success-banner">
            <CheckCircle2 size={16} />
            <span>Settings saved successfully and applied to the live platform.</span>
          </div>
        )}

        {/* System Status */}
        <div className="settings-section">
          <div className="settings-section-header">
            <Zap size={16} className="settings-section-icon" />
            <span>System Health & Service Status</span>
            <button
              className="settings-refresh-btn"
              onClick={() => {
                setServices((prev) => prev.map((s) => ({ ...s, status: 'checking' })));
                checkServiceHealth();
              }}
            >
              <RefreshCw size={13} />
              Re-check
            </button>
          </div>
          <div className="settings-services-grid">
            {services.map((svc) => (
              <div key={svc.name} className="settings-service-card" data-status={svc.status}>
                <div className="svc-icon-wrap">{svc.icon}</div>
                <div className="svc-info">
                  <div className="svc-name">{svc.name}</div>
                  <div className="svc-desc">{svc.description}</div>
                </div>
                <div className="svc-status-block">
                  {svc.status === 'checking' ? (
                    <div className="svc-checking">
                      <div className="loading-spinner" style={{ width: 14, height: 14, borderTopColor: 'var(--accent-teal)' }} />
                    </div>
                  ) : svc.status === 'online' ? (
                    <>
                      <CheckCircle2 size={18} className="svc-online-icon" />
                      {svc.latency !== undefined && (
                        <span className="svc-latency">{svc.latency}ms</span>
                      )}
                    </>
                  ) : (
                    <XCircle size={18} className="svc-offline-icon" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sensor Calibration */}
        <div className="settings-section">
          <div className="settings-section-header">
            <BarChart3 size={16} className="settings-section-icon" />
            <span>Sensor Calibration Scales</span>
            <span className="settings-section-note">Applied to all live AQI readings</span>
          </div>

          {loading ? (
            <div className="settings-skeleton-grid">
              {[1, 2, 3].map((i) => (
                <div key={i} className="settings-skeleton-card" />
              ))}
            </div>
          ) : (
            <div className="settings-calibration-grid">
              {CITIES.map((city) => {
                const cal = calibration[city] || { pm25: 1.0, pm10: 1.0, no2: 1.0 };
                return (
                  <div key={city} className="settings-card settings-calib-card">
                    <div className="settings-card-title">
                      <span className="calib-city-dot" />
                      {city}
                    </div>
                    <div className="calib-fields">
                      {(['pm25', 'pm10', 'no2'] as const).map((field) => (
                        <div key={field} className="settings-form-group">
                          <label className="settings-label">
                            {field.toUpperCase()} Scale Factor
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0.1"
                            max="5"
                            className="settings-input"
                            value={cal[field]}
                            onChange={(e) =>
                              handleCalibrationChange(city, field, e.target.value)
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Data Source Config */}
        <div className="settings-section">
          <div className="settings-section-header">
            <Database size={16} className="settings-section-icon" />
            <span>Data Source Configuration</span>
          </div>
          <div className="settings-grid">
            <div className="settings-card">
              <div className="settings-card-title">
                <Database size={15} style={{ color: 'var(--accent-teal)' }} />
                Database Mode
              </div>
              <div className="toggle-row">
                <div className="toggle-label-group">
                  <span className="toggle-main-label">Use Mock Database</span>
                  <span className="toggle-sub-label">
                    Enable in-memory mock DB for offline development (disables Atlas persistence)
                  </span>
                </div>
                <label className="settings-switch">
                  <input
                    type="checkbox"
                    checked={useMockDb}
                    onChange={(e) => setUseMockDb(e.target.checked)}
                  />
                  <span className="switch-slider" />
                </label>
              </div>
              <div
                className="settings-db-status"
                style={{ background: useMockDb ? 'rgba(234,179,8,0.08)' : 'rgba(16,185,129,0.08)', borderColor: useMockDb ? 'rgba(234,179,8,0.25)' : 'rgba(16,185,129,0.25)' }}
              >
                <span style={{ color: useMockDb ? '#eab308' : '#10b981', fontWeight: 700, fontSize: 12 }}>
                  {useMockDb ? '⚠ Mock Mode Active — data not persisted' : '✓ Connected to MongoDB Atlas'}
                </span>
              </div>
            </div>

            <div className="settings-card">
              <div className="settings-card-title">
                <Shield size={15} style={{ color: 'var(--accent-teal)' }} />
                Platform Identity
              </div>
              <div className="settings-form-group">
                <label className="settings-label">Platform Name</label>
                <input className="settings-input" defaultValue="VayuSense" readOnly />
              </div>
              <div className="settings-form-group">
                <label className="settings-label">API Base URL</label>
                <input
                  className="settings-input"
                  defaultValue="http://localhost:5000"
                  readOnly
                />
              </div>
              <div className="settings-form-group">
                <label className="settings-label">AI Model</label>
                <input
                  className="settings-input"
                  defaultValue="openai/gpt-oss-20b"
                  readOnly
                />
              </div>
            </div>
          </div>
        </div>

        {/* AQI Threshold Reference */}
        <div className="settings-section">
          <div className="settings-section-header">
            <AlertTriangle size={16} className="settings-section-icon" />
            <span>CPCB AQI Threshold Reference</span>
            <span className="settings-section-note">Indian National Air Quality Index (CPCB)</span>
          </div>
          <div className="settings-threshold-table">
            {[
              { label: 'Good', range: '0–50', color: '#00C851', desc: 'Air quality is satisfactory' },
              { label: 'Satisfactory', range: '51–100', color: '#A8D500', desc: 'Acceptable for sensitive groups' },
              { label: 'Moderate', range: '101–200', color: '#FFBB00', desc: 'May cause minor breathing discomfort' },
              { label: 'Poor', range: '201–300', color: '#FF7700', desc: 'Breathing discomfort for most people' },
              { label: 'Very Poor', range: '301–400', color: '#FF3300', desc: 'Serious breathing discomfort' },
              { label: 'Severe', range: '401–500', color: '#7B0000', desc: 'Affects healthy population severely' },
            ].map((tier) => (
              <div key={tier.label} className="threshold-row">
                <div className="threshold-swatch" style={{ background: tier.color }} />
                <span className="threshold-label" style={{ color: tier.color }}>{tier.label}</span>
                <span className="threshold-range font-mono">{tier.range}</span>
                <span className="threshold-desc">{tier.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Save Actions */}
        <div className="settings-actions">
          <button
            className="settings-save-btn"
            onClick={handleSave}
            disabled={saving || loading}
          >
            {saving ? (
              <><RefreshCw size={14} className="spin" style={{ marginRight: 6 }} />Saving...</>
            ) : (
              <><Save size={14} style={{ marginRight: 6 }} />Save Configuration</>
            )}
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
