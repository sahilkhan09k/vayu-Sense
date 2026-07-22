/**
 * CitizenHome.tsx — Page 11
 * Citizen PWA landing screen: live city AQI hero card, personalized Groq
 * health advisory, and ward snapshot tiles.
 */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { CitizenLayout } from '../components/citizen/CitizenLayout';
import { getAQICategory, getAQICSSVar, getAQILabel } from '../types';
import { RefreshCw, AlertTriangle, Wind, Droplets, LogOut } from 'lucide-react';
import './CitizenHome.css';

interface WardSnapshot {
  wardId: string;
  wardName: string;
  aqi: number;
  city: string;
}

interface AdvisoryData {
  aqi: number;
  advisory: string;
}

const CITY_MAP: Record<string, string> = {
  Mumbai: 'Mumbai',
  Delhi: 'Delhi',
  Bengaluru: 'Bengaluru',
};

function AQIRing({ aqi, size = 140 }: { aqi: number; size?: number }) {
  const cat = getAQICategory(aqi);
  const color = getAQICSSVar(cat);
  const label = getAQILabel(cat);
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  // Cap fill at 500 AQI
  const pct = Math.min(aqi / 500, 1);
  const dash = circumference * pct;

  return (
    <div className="aqi-ring-wrapper" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="10" />
        <circle
          cx="60" cy="60" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
          style={{ filter: `drop-shadow(0 0 6px ${color}88)`, transition: 'stroke-dasharray 1s ease' }}
        />
      </svg>
      <div className="aqi-ring-inner">
        <span className="aqi-ring-value font-mono" style={{ color }}>{aqi}</span>
        <span className="aqi-ring-label" style={{ color }}>{label}</span>
      </div>
    </div>
  );
}

export function CitizenHome() {
  const { user, logout } = useAuth();
  const city = user?.city || 'Mumbai';
  const profile = JSON.parse(localStorage.getItem('citizenProfile') || '{}');

  const [wards, setWards] = useState<WardSnapshot[]>([]);
  const [advisory, setAdvisory] = useState<AdvisoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      // Fetch ward AQI data and advisory in parallel
      const [wardsRes, advisoryRes] = await Promise.all([
        fetch(`/api/citizen/wards?city=${encodeURIComponent(city)}`),
        fetch(
          `/api/citizen/advisory?city=${encodeURIComponent(city)}&ageGroup=${encodeURIComponent(profile.ageGroup || 'Adult')}&sensitivity=${encodeURIComponent(profile.sensitivity || 'Normal')}`
        ),
      ]);

      if (wardsRes.ok) {
        const d = await wardsRes.json();
        setWards(d.wards || []);
      }
      if (advisoryRes.ok) {
        const d = await advisoryRes.json();
        setAdvisory({ aqi: d.aqi, advisory: d.advisory });
      }
    } catch (e) {
      setError('Unable to load live data. Retrying...');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [city, profile.ageGroup, profile.sensitivity]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const cityAQI = advisory?.aqi ?? (wards.length ? Math.round(wards.reduce((a, b) => a + b.aqi, 0) / wards.length) : 0);
  const cat = getAQICategory(cityAQI);
  const color = getAQICSSVar(cat);

  const worstWards = [...wards].sort((a, b) => b.aqi - a.aqi).slice(0, 4);

  return (
    <CitizenLayout>
      {/* Logout */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: -8 }}>
        <button className="citizen-icon-btn" onClick={logout} title="Sign out">
          <LogOut size={16} />
        </button>
      </div>

      {/* Hero AQI Card */}
      <div className="citizen-hero-card" style={{ borderColor: `${color}33`, boxShadow: `0 4px 24px ${color}1a` }}>
        <div className="citizen-hero-top">
          <div className="citizen-hero-location">
            <Wind size={14} />
            <span>{city}</span>
          </div>
          <button
            className={`citizen-refresh-btn ${refreshing ? 'citizen-refresh-btn--spinning' : ''}`}
            onClick={() => fetchData(true)}
            disabled={refreshing}
          >
            <RefreshCw size={15} />
          </button>
        </div>

        {loading ? (
          <div className="citizen-hero-loading">
            <div className="citizen-pulse-ring" />
            <span>Fetching live data…</span>
          </div>
        ) : (
          <div className="citizen-hero-content">
            <AQIRing aqi={cityAQI} size={148} />
            <div className="citizen-hero-meta">
              <p className="citizen-hero-label">City AQI</p>
              <p className="citizen-hero-city">{CITY_MAP[city] ?? city}</p>
              {wards.length > 0 && (
                <div className="citizen-hero-stats">
                  <span className="citizen-stat">
                    <Droplets size={12} />
                    {Math.round(wards.reduce((a, b) => a + b.aqi, 0) / wards.length)} avg
                  </span>
                  <span className="citizen-stat">
                    {wards.length} stations
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Groq Advisory Banner */}
      {advisory && !loading && (
        <div className="citizen-advisory-card" style={{ borderLeftColor: color }}>
          <div className="citizen-advisory-header">
            <AlertTriangle size={14} style={{ color }} />
            <span style={{ color }}>Personalized Advisory</span>
            {profile.sensitivity && profile.sensitivity !== 'Normal' && (
              <span className="citizen-sensitivity-tag">{profile.sensitivity}</span>
            )}
          </div>
          <p className="citizen-advisory-text">{advisory.advisory}</p>
        </div>
      )}

      {/* Ward Snapshot Grid */}
      {worstWards.length > 0 && (
        <div className="citizen-section">
          <h2 className="citizen-section-title">Worst Wards Right Now</h2>
          <div className="citizen-ward-grid">
            {worstWards.map((w) => {
              const wCat = getAQICategory(w.aqi);
              const wColor = getAQICSSVar(wCat);
              const wLabel = getAQILabel(wCat);
              return (
                <div key={w.wardId} className="citizen-ward-tile">
                  <div className="citizen-ward-aqi font-mono" style={{ color: wColor }}>
                    {w.aqi}
                  </div>
                  <div className="citizen-ward-name">{w.wardName}</div>
                  <div className="citizen-ward-cat" style={{ background: `${wColor}20`, color: wColor }}>
                    {wLabel}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {error && (
        <div className="citizen-error-banner">
          <AlertTriangle size={14} />
          <span>{error}</span>
        </div>
      )}

      {/* All Wards List */}
      {wards.length > 0 && (
        <div className="citizen-section">
          <h2 className="citizen-section-title">All Monitoring Stations</h2>
          <div className="citizen-stations-list">
            {[...wards].sort((a, b) => b.aqi - a.aqi).map((w) => {
              const wCat = getAQICategory(w.aqi);
              const wColor = getAQICSSVar(wCat);
              return (
                <div key={w.wardId} className="citizen-station-row">
                  <div
                    className="citizen-station-dot"
                    style={{ background: wColor, boxShadow: `0 0 6px ${wColor}88` }}
                  />
                  <span className="citizen-station-name">{w.wardName}</span>
                  <span className="citizen-station-aqi font-mono" style={{ color: wColor }}>
                    {w.aqi}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </CitizenLayout>
  );
}
