/**
 * WardDetailPanel.tsx
 * Slide-in right panel showing live AQI, pollutant gauges,
 * Groq AI source attribution donut, and health recommendation.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from 'recharts';
import { X, RefreshCw, AlertTriangle, Loader2, Brain } from 'lucide-react';
import { AQIBadge } from '../common/AQIBadge';
import type { WardAQI } from '../../hooks/useAQIData';
import { apiFetch } from '../../utils/apiFetch';
import './WardDetailPanel.css';

interface PollutionSource {
  name: string;
  percentage: number;
  icon: string;
  color: string;
}

interface AttributionResult {
  sources: PollutionSource[];
  narrative: string;
  confidence: number;
  recommendation: string;
  dominantSource: string;
}

interface WardAttributionResponse {
  wardId: string;
  wardName: string;
  aqiSnapshot: WardAQI;
  attribution: AttributionResult;
}

interface WardDetailPanelProps {
  wardId: string;
  wardName: string;
  wardData: WardAQI | null;
  onClose: () => void;
}

// Pollutant mini-gauge
function PollutantGauge({ label, value, unit, max, color }: {
  label: string; value: number; unit: string; max: number; color: string;
}) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="pollutant-gauge">
      <div className="pollutant-gauge__header">
        <span className="pollutant-gauge__label">{label}</span>
        <span className="pollutant-gauge__value font-mono">{value}<span className="pollutant-gauge__unit"> {unit}</span></span>
      </div>
      <div className="pollutant-gauge__bar-bg">
        <div className="pollutant-gauge__bar-fill" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

// Custom Recharts tooltip
function AttributionTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const { name, percentage, icon } = payload[0].payload;
  return (
    <div className="attribution-tooltip">
      <span>{icon} {name}</span>
      <strong>{percentage}%</strong>
    </div>
  );
}

export function WardDetailPanel({ wardId, wardName, wardData, onClose }: WardDetailPanelProps) {
  const [attribution, setAttribution] = useState<AttributionResult | null>(null);
  const [attrLoading, setAttrLoading] = useState(false);
  const [attrError, setAttrError] = useState<string | null>(null);
  const [activeSlice, setActiveSlice] = useState<string | null>(null);

  const fetchAttribution = useCallback(async () => {
    setAttrLoading(true);
    setAttrError(null);
    try {
      const res = await apiFetch(`/api/aqi/attribution/${wardId}`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: WardAttributionResponse = await res.json();
      setAttribution(json.attribution);
    } catch (err) {
      setAttrError(err instanceof Error ? err.message : 'Attribution failed');
    } finally {
      setAttrLoading(false);
    }
  }, [wardId]);

  useEffect(() => {
    fetchAttribution();
  }, [fetchAttribution]);

  const aqi    = wardData?.aqi    ?? 0;
  const pm25   = wardData?.pm25   ?? 0;
  const pm10   = wardData?.pm10   ?? 0;
  const no2    = wardData?.no2    ?? 0;
  const co     = wardData?.co     ?? 0;

  return (
    <div className="ward-detail-panel">
      {/* Header */}
      <div className="ward-detail-panel__header">
        <div className="ward-detail-panel__title-row">
          <div>
            <h2 className="ward-detail-panel__ward-name">{wardName}</h2>
            <p className="ward-detail-panel__city">Mumbai • Live Data</p>
          </div>
          <button className="ward-detail-panel__close" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>
        <div className="ward-detail-panel__aqi-row">
          <AQIBadge value={aqi} showLabel size="lg" />
          <div className="ward-detail-panel__aqi-meta">
            <span className="font-mono" style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{aqi}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>AQI Index</span>
          </div>
        </div>
      </div>

      {/* Pollutant gauges */}
      <div className="ward-detail-panel__section">
        <h3 className="ward-detail-panel__section-title">Pollutant Levels</h3>
        <div className="ward-detail-panel__gauges">
          <PollutantGauge label="PM2.5" value={pm25} unit="µg/m³" max={250} color="#FF7700" />
          <PollutantGauge label="PM10"  value={pm10} unit="µg/m³" max={430} color="#FFBB00" />
          <PollutantGauge label="NO₂"   value={no2}  unit="µg/m³" max={400} color="#A78BFA" />
          <PollutantGauge label="CO"    value={co}   unit="µg/m³" max={4000} color="#60A5FA" />
        </div>
      </div>

      {/* Attribution section */}
      <div className="ward-detail-panel__section">
        <div className="ward-detail-panel__section-header">
          <h3 className="ward-detail-panel__section-title">
            <Brain size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            AI Source Attribution
          </h3>
          <button
            className="ward-detail-panel__refresh-btn"
            onClick={fetchAttribution}
            disabled={attrLoading}
            title="Refresh attribution"
          >
            <RefreshCw size={13} className={attrLoading ? 'spin' : ''} />
          </button>
        </div>

        {attrLoading && (
          <div className="ward-detail-panel__loading">
            <Loader2 size={20} className="spin" />
            <span>Analysing with GPT-OSS 20B…</span>
          </div>
        )}

        {attrError && !attrLoading && (
          <div className="ward-detail-panel__error">
            <AlertTriangle size={16} />
            <span>Attribution unavailable: {attrError}</span>
          </div>
        )}

        {attribution && !attrLoading && (
          <>
            {/* Donut chart */}
            <div className="ward-detail-panel__donut-row">
              <div className="ward-detail-panel__donut">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={attribution.sources}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      dataKey="percentage"
                      nameKey="name"
                      onMouseEnter={(_, i) => setActiveSlice(attribution.sources[i].name)}
                      onMouseLeave={() => setActiveSlice(null)}
                    >
                      {attribution.sources.map((s) => (
                        <Cell
                          key={s.name}
                          fill={s.color}
                          opacity={activeSlice === null || activeSlice === s.name ? 1 : 0.4}
                          stroke="transparent"
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<AttributionTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center label */}
                <div className="ward-detail-panel__donut-center">
                  <span className="ward-detail-panel__donut-dominant">
                    {attribution.sources[0]?.icon}
                  </span>
                </div>
              </div>

              {/* Source legend */}
              <div className="ward-detail-panel__sources">
                {attribution.sources.map((s) => (
                  <div
                    key={s.name}
                    className={`ward-detail-panel__source-item ${activeSlice === s.name ? 'ward-detail-panel__source-item--active' : ''}`}
                    onMouseEnter={() => setActiveSlice(s.name)}
                    onMouseLeave={() => setActiveSlice(null)}
                  >
                    <span className="ward-detail-panel__source-dot" style={{ backgroundColor: s.color }} />
                    <span className="ward-detail-panel__source-icon">{s.icon}</span>
                    <span className="ward-detail-panel__source-name">{s.name}</span>
                    <span className="ward-detail-panel__source-pct font-mono">{s.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Confidence badge */}
            <div className="ward-detail-panel__confidence">
              <span className="ward-detail-panel__confidence-bar" style={{ width: `${attribution.confidence}%` }} />
              <span className="ward-detail-panel__confidence-label">AI Confidence: {attribution.confidence}%</span>
            </div>

            {/* Narrative */}
            <div className="ward-detail-panel__narrative">
              <p>{attribution.narrative}</p>
            </div>

            {/* Recommendation */}
            <div className="ward-detail-panel__recommendation">
              <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 2 }} />
              <p>{attribution.recommendation}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
