/**
 * CitizenReport.tsx — Page 14
 * Community Pollution Report — citizens can flag local incidents
 * (construction dust, burning, vehicle smoke, etc.)
 */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { CitizenLayout } from '../components/citizen/CitizenLayout';
import { Flag, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { apiFetch } from '../utils/apiFetch';
import './CitizenReport.css';

const CATEGORIES = [
  { id: 'Construction Dust', label: 'Construction Dust', emoji: '🏗️' },
  { id: 'Vehicle Smoke', label: 'Vehicle Smoke', emoji: '🚛' },
  { id: 'Garbage Burning', label: 'Garbage Burning', emoji: '🔥' },
  { id: 'Industrial Smoke', label: 'Industrial Smoke', emoji: '🏭' },
  { id: 'Open Burning', label: 'Open Burning', emoji: '🌾' },
  { id: 'Other', label: 'Other', emoji: '⚠️' },
];

const WARDS_BY_CITY: Record<string, { wardId: string; wardName: string }[]> = {
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

interface ReportEntry {
  _id: string;
  wardName: string;
  category: string;
  description: string;
  severity: number;
  reportedAt: string;
}

const SEVERITY_LABELS = ['', 'Very Low', 'Low', 'Moderate', 'High', 'Critical'];
const SEVERITY_COLORS = ['', '#10b981', '#84cc16', '#f59e0b', '#ef4444', '#7f1d1d'];

export function CitizenReport() {
  const { user } = useAuth();
  const city = user?.city || 'Mumbai';
  const wards = WARDS_BY_CITY[city] || WARDS_BY_CITY['Mumbai'];

  const [form, setForm] = useState({
    wardId: wards[0]?.wardId || '',
    wardName: wards[0]?.wardName || '',
    category: 'Construction Dust',
    description: '',
    severity: 3,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [recentReports, setRecentReports] = useState<ReportEntry[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);

  const fetchRecentReports = useCallback(async () => {
    try {
      const res = await apiFetch(`/api/citizen/reports?city=${encodeURIComponent(city)}`);
      if (res.ok) {
        const d = await res.json();
        setRecentReports(d.reports || []);
      }
    } catch { /* ignore */ }
    setLoadingReports(false);
  }, [city]);

  useEffect(() => { fetchRecentReports(); }, [fetchRecentReports]);

  const handleWardChange = (wardId: string) => {
    const ward = wards.find((w) => w.wardId === wardId);
    setForm((f) => ({ ...f, wardId, wardName: ward?.wardName || '' }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await apiFetch('/api/citizen/report', {
        method: 'POST',
        body: JSON.stringify({ ...form, city, reportedBy: user?.id || null }),
      });
      if (res.ok) {
        setSubmitted(true);
        setForm((f) => ({ ...f, description: '', severity: 3 }));
        setTimeout(() => setSubmitted(false), 3000);
        await fetchRecentReports();
      }
    } catch { /* ignore */ }
    setSubmitting(false);
  };

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    return `${Math.floor(hr / 24)}d ago`;
  };

  return (
    <CitizenLayout title="Community Report">
      <div className="report-intro">
        <h1 className="report-heading">Report Pollution</h1>
        <p className="report-sub">Help your community by flagging local pollution incidents.</p>
      </div>

      {/* Form Card */}
      <div className="report-card">
        {/* Category Picker */}
        <div className="report-field">
          <label className="report-label">Incident Type</label>
          <div className="report-category-grid">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                className={`report-cat-btn ${form.category === cat.id ? 'report-cat-btn--active' : ''}`}
                onClick={() => setForm((f) => ({ ...f, category: cat.id }))}
              >
                <span className="report-cat-emoji">{cat.emoji}</span>
                <span className="report-cat-label">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Ward Picker */}
        <div className="report-field">
          <label className="report-label">Location (Ward)</label>
          <select
            className="report-select"
            value={form.wardId}
            onChange={(e) => handleWardChange(e.target.value)}
          >
            {wards.map((w) => (
              <option key={w.wardId} value={w.wardId}>{w.wardName}</option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div className="report-field">
          <label className="report-label">Description (optional)</label>
          <textarea
            className="report-textarea"
            placeholder="Describe what you observed…"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={3}
          />
        </div>

        {/* Severity Slider */}
        <div className="report-field">
          <label className="report-label">
            Severity
            <span
              className="report-severity-tag"
              style={{ background: `${SEVERITY_COLORS[form.severity]}20`, color: SEVERITY_COLORS[form.severity] }}
            >
              {SEVERITY_LABELS[form.severity]}
            </span>
          </label>
          <div className="report-severity-track">
            {[1, 2, 3, 4, 5].map((level) => (
              <button
                key={level}
                className={`report-severity-dot ${form.severity >= level ? 'report-severity-dot--active' : ''}`}
                style={form.severity >= level ? { background: SEVERITY_COLORS[level] } : {}}
                onClick={() => setForm((f) => ({ ...f, severity: level }))}
                title={SEVERITY_LABELS[level]}
              />
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          className={`report-submit-btn ${submitted ? 'report-submit-btn--success' : ''}`}
          onClick={handleSubmit}
          disabled={submitting || submitted}
        >
          {submitting ? (
            <><Loader2 size={18} className="spin" /> Submitting…</>
          ) : submitted ? (
            <><CheckCircle2 size={18} /> Report Submitted!</>
          ) : (
            <><Flag size={18} /> Submit Report</>
          )}
        </button>
      </div>

      {/* Recent Reports */}
      <div className="report-section">
        <h2 className="report-section-title">Recent Community Reports — {city}</h2>
        {loadingReports ? (
          <div className="report-loading"><Loader2 size={16} className="spin" /> Loading reports…</div>
        ) : recentReports.length === 0 ? (
          <div className="report-empty">
            <AlertTriangle size={18} />
            <span>No reports yet. Be the first to flag an incident!</span>
          </div>
        ) : (
          <div className="report-list">
            {recentReports.slice(0, 10).map((r) => (
              <div key={r._id} className="report-row">
                <div className="report-row-left">
                  <span className="report-row-cat">{CATEGORIES.find((c) => c.id === r.category)?.emoji || '⚠️'}</span>
                  <div>
                    <span className="report-row-title">{r.category}</span>
                    <span className="report-row-meta">{r.wardName} · {timeAgo(r.reportedAt)}</span>
                  </div>
                </div>
                <div
                  className="report-row-severity"
                  style={{
                    background: `${SEVERITY_COLORS[r.severity] || '#6b7280'}20`,
                    color: SEVERITY_COLORS[r.severity] || '#6b7280'
                  }}
                >
                  {SEVERITY_LABELS[r.severity] || r.severity}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </CitizenLayout>
  );
}
