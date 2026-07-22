/**
 * CitizenCommute.tsx — Page 13
 * Commute AQI Advisor: compare origin/destination ward AQI
 * and get a Groq-powered travel safety advisory.
 */
import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { CitizenLayout } from '../components/citizen/CitizenLayout';
import { getAQICategory, getAQICSSVar, getAQILabel } from '../types';
import { Navigation2, Clock, Loader2, Wind } from 'lucide-react';
import './CitizenCommute.css';

interface WardOption {
  wardId: string;
  wardName: string;
}

const WARD_OPTIONS: Record<string, WardOption[]> = {
  Mumbai: [
    { wardId: 'ward-andheri-east', wardName: 'Andheri East' },
    { wardId: 'ward-bandra-west', wardName: 'Bandra West' },
    { wardId: 'ward-dadar', wardName: 'Dadar' },
    { wardId: 'ward-colaba', wardName: 'Colaba' },
    { wardId: 'ward-borivali', wardName: 'Borivali' },
    { wardId: 'ward-kurla', wardName: 'Kurla' },
    { wardId: 'ward-malad', wardName: 'Malad West' },
    { wardId: 'ward-kandivali', wardName: 'Kandivali East' },
    { wardId: 'ward-worli', wardName: 'Worli' },
    { wardId: 'ward-chembur', wardName: 'Chembur' },
    { wardId: 'ward-vikhroli', wardName: 'Vikhroli' },
    { wardId: 'ward-thane', wardName: 'Thane West' },
  ],
  Delhi: [
    { wardId: 'ward-connaught', wardName: 'Connaught Place' },
    { wardId: 'ward-rohini', wardName: 'Rohini' },
    { wardId: 'ward-lajpat', wardName: 'Lajpat Nagar' },
    { wardId: 'ward-dwarka', wardName: 'Dwarka' },
  ],
  Bengaluru: [
    { wardId: 'ward-koramangala', wardName: 'Koramangala' },
    { wardId: 'ward-whitefield', wardName: 'Whitefield' },
    { wardId: 'ward-hebbal', wardName: 'Hebbal' },
  ],
};

const TIME_SLOTS = ['6:00 AM', '8:00 AM', '10:00 AM', '12:00 PM', '2:00 PM', '4:00 PM', '6:00 PM', '8:00 PM', '10:00 PM'];

interface CommuteResult {
  from: { wardName: string; aqi: number };
  to: { wardName: string; aqi: number };
  advisory: string;
}

function AQIBadge({ aqi, label }: { aqi: number; label: string }) {
  const cat = getAQICategory(aqi);
  const color = getAQICSSVar(cat);
  const catLabel = getAQILabel(cat);
  return (
    <div className="commute-aqi-badge" style={{ borderColor: `${color}44`, background: `${color}0f` }}>
      <span className="commute-aqi-num font-mono" style={{ color }}>{aqi}</span>
      <span className="commute-aqi-ward">{label}</span>
      <span className="commute-aqi-cat" style={{ color, background: `${color}20` }}>{catLabel}</span>
    </div>
  );
}

export function CitizenCommute() {
  const { user } = useAuth();
  const city = user?.city || 'Mumbai';
  const wards = WARD_OPTIONS[city] || WARD_OPTIONS['Mumbai'];

  const [fromWardId, setFromWardId] = useState(wards[0]?.wardId || '');
  const [toWardId, setToWardId] = useState(wards[1]?.wardId || '');
  const [departureTime, setDepartureTime] = useState('9:00 AM');
  const [result, setResult] = useState<CommuteResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGetAdvisory = useCallback(async () => {
    if (!fromWardId || !toWardId) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const params = new URLSearchParams({
        city,
        fromWardId,
        toWardId,
        departureTime,
      });
      const res = await fetch(`/api/citizen/commute?${params}`);
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setResult(data);
    } catch {
      setError('Unable to fetch commute advisory. Check your connection.');
    } finally {
      setLoading(false);
    }
  }, [city, fromWardId, toWardId, departureTime]);

  const maxAqi = result ? Math.max(result.from.aqi, result.to.aqi) : 0;
  const safetyColor = maxAqi <= 100 ? '#10b981' : maxAqi <= 200 ? '#f59e0b' : '#ef4444';
  const safetyLabel = maxAqi <= 100 ? 'Safe to commute' : maxAqi <= 200 ? 'Moderate risk' : 'High risk';

  return (
    <CitizenLayout title="Commute Advisor">
      <div className="commute-intro">
        <h1 className="commute-heading">Commute AQI Advisor</h1>
        <p className="commute-sub">Plan your journey with live air quality data.</p>
      </div>

      {/* Route Planner */}
      <div className="commute-card">
        <div className="commute-field">
          <label className="commute-label">From</label>
          <select
            className="commute-select"
            value={fromWardId}
            onChange={(e) => setFromWardId(e.target.value)}
          >
            {wards.map((w) => (
              <option key={w.wardId} value={w.wardId}>{w.wardName}</option>
            ))}
          </select>
        </div>

        <div className="commute-divider">
          <Navigation2 size={16} className="commute-divider-icon" />
        </div>

        <div className="commute-field">
          <label className="commute-label">To</label>
          <select
            className="commute-select"
            value={toWardId}
            onChange={(e) => setToWardId(e.target.value)}
          >
            {wards.map((w) => (
              <option key={w.wardId} value={w.wardId}>{w.wardName}</option>
            ))}
          </select>
        </div>

        <div className="commute-field">
          <label className="commute-label">
            <Clock size={12} />
            Departure Time
          </label>
          <div className="commute-time-grid">
            {TIME_SLOTS.map((t) => (
              <button
                key={t}
                className={`commute-time-btn ${departureTime === t ? 'commute-time-btn--active' : ''}`}
                onClick={() => setDepartureTime(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <button
          className="commute-go-btn"
          onClick={handleGetAdvisory}
          disabled={loading || fromWardId === toWardId}
        >
          {loading ? <Loader2 size={18} className="spin" /> : <Wind size={18} />}
          {loading ? 'Analysing Route…' : 'Get Commute Advisory'}
        </button>
        {fromWardId === toWardId && (
          <p className="commute-same-ward-hint">Please select different origin and destination wards.</p>
        )}
      </div>

      {/* Result */}
      {result && (
        <div className="commute-result">
          {/* Safety Banner */}
          <div
            className="commute-safety-banner"
            style={{ background: `${safetyColor}15`, borderColor: `${safetyColor}44` }}
          >
            <div className="commute-safety-dot" style={{ background: safetyColor, boxShadow: `0 0 8px ${safetyColor}88` }} />
            <span style={{ color: safetyColor, fontWeight: 700 }}>{safetyLabel}</span>
            <span className="commute-safety-aqi">Max AQI: <span className="font-mono" style={{ color: safetyColor }}>{maxAqi}</span></span>
          </div>

          {/* AQI Comparison */}
          <div className="commute-aqi-row">
            <AQIBadge aqi={result.from.aqi} label={result.from.wardName} />
            <Navigation2 size={16} className="commute-arrow" />
            <AQIBadge aqi={result.to.aqi} label={result.to.wardName} />
          </div>

          {/* Groq Advisory */}
          <div className="commute-advisory">
            <div className="commute-advisory-header">
              <Wind size={13} />
              <span>AI Commute Advisory</span>
              <span className="commute-departure-tag">{departureTime}</span>
            </div>
            <p className="commute-advisory-text">{result.advisory}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="citizen-error-banner">
          <span>{error}</span>
        </div>
      )}
    </CitizenLayout>
  );
}
