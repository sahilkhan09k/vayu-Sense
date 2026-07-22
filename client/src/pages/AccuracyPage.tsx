import { useState, useEffect } from 'react';
import { useCity } from '../context/CityContext';
import { AppLayout } from '../components/layout/AppLayout';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { AlertTriangle, TrendingDown, Percent, Award } from 'lucide-react';
import './AccuracyPage.css';

interface AccuracyMetrics {
  mae: number;
  rmse: number;
  baselineMae: number;
  baselineRmse: number;
  totalEvaluations: number;
}

interface TimelinePoint {
  timestamp: string;
  predicted: number;
  actual: number;
  baseline: number;
  formattedTime?: string;
}

interface AccuracyResponse {
  metrics: AccuracyMetrics;
  comparisonTimeline: TimelinePoint[];
}

export function AccuracyPage() {
  const { selectedCity } = useCity();
  const [data, setData] = useState<AccuracyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAccuracy = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/aqi/accuracy?city=${encodeURIComponent(selectedCity)}`);
        if (!res.ok) throw new Error('Failed to load forecast accuracy data');
        const result = await res.json();
        
        // Format dates in timeline
        const formattedTimeline = result.comparisonTimeline.map((pt: TimelinePoint) => {
          const d = new Date(pt.timestamp);
          const hours = d.getHours().toString().padStart(2, '0');
          const day = d.getDate();
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          return {
            ...pt,
            formattedTime: `${hours}:00 (${day} ${months[d.getMonth()]})`,
          };
        });

        setData({
          metrics: result.metrics,
          comparisonTimeline: formattedTimeline,
        });
      } catch (err: any) {
        setError(err.message || 'Error loading accuracy metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchAccuracy();
  }, [selectedCity]);

  // Calculate efficiency gain (percentage improvement over baseline)
  const maeImprovement = data?.metrics.baselineMae
    ? (((data.metrics.baselineMae - data.metrics.mae) / data.metrics.baselineMae) * 100).toFixed(1)
    : '0';

  return (
    <AppLayout>
      <div className="accuracy-page stagger-fade-in">
        {/* Header */}
        <div className="accuracy-header">
          <div className="accuracy-title-section">
            <h1>Forecast Accuracy Tracker</h1>
            <p>Evaluating 24-hour lead forecast metrics vs. real-time sensor measurements & persistence baselines</p>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="loader-container">
            <div className="loading-spinner" style={{ borderTopColor: 'var(--accent-teal)' }} />
            <span>Calculating mean square variance metrics...</span>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="dashboard-error-banner" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Stats Grid */}
        {!loading && data && (
          <>
            <div className="accuracy-metrics-grid">
              <div className="accuracy-metric-card">
                <span className="accuracy-metric-label">VayuSense AI MAE</span>
                <span className="accuracy-metric-val">{data.metrics.mae}</span>
                <span className="accuracy-metric-compare better" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <TrendingDown size={14} />
                  <span>Lower is better (target &lt; 25)</span>
                </span>
              </div>

              <div className="accuracy-metric-card">
                <span className="accuracy-metric-label">Persistence MAE</span>
                <span className="accuracy-metric-val" style={{ color: 'var(--text-secondary)' }}>{data.metrics.baselineMae}</span>
                <span className="accuracy-metric-compare worse">
                  Naive baseline error margin
                </span>
              </div>

              <div className="accuracy-metric-card">
                <span className="accuracy-metric-label">Model RMSE</span>
                <span className="accuracy-metric-val">{data.metrics.rmse}</span>
                <span className="accuracy-metric-compare better" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Award size={14} />
                  <span>Roots variance indicator</span>
                </span>
              </div>

              <div className="accuracy-metric-card">
                <span className="accuracy-metric-label">Accuracy Gain</span>
                <span className="accuracy-metric-val" style={{ color: 'var(--accent-teal)' }}>+{maeImprovement}%</span>
                <span className="accuracy-metric-compare better" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Percent size={14} />
                  <span>Improvement over baseline</span>
                </span>
              </div>
            </div>

            {/* Comparison Timeline Chart */}
            <div className="accuracy-chart-card">
              <div className="accuracy-chart-header">
                <span className="accuracy-chart-title">Timeline Comparison (Last 7 Days)</span>
                <div className="accuracy-chart-legend">
                  <div className="legend-item">
                    <span className="legend-color real" />
                    <span>Real Measured AQI</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-color predicted" />
                    <span>VayuSense AI Forecast</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-color baseline" />
                    <span>Persistence Baseline</span>
                  </div>
                </div>
              </div>

              <div className="accuracy-chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.comparisonTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                    
                    {/* Actual Readings Line */}
                    <Line 
                      type="monotone" 
                      dataKey="actual" 
                      stroke="var(--text-primary)" 
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                    
                    {/* Forecasted Line */}
                    <Line 
                      type="monotone" 
                      dataKey="predicted" 
                      stroke="var(--accent-teal)" 
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />

                    {/* Persistence Baseline Line */}
                    <Line 
                      type="monotone" 
                      dataKey="baseline" 
                      stroke="#64748b" 
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}

function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
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
          <span style={{ color: 'var(--text-secondary)' }}>Actual AQI:</span>
          <span className="font-mono" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{data.actual}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '24px' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Forecast AQI:</span>
          <span className="font-mono" style={{ fontWeight: 700, color: 'var(--accent-teal)' }}>{data.predicted} (Err: {Math.abs(data.predicted - data.actual)})</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '24px' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Persistence Baseline:</span>
          <span className="font-mono" style={{ color: 'var(--text-muted)' }}>{data.baseline}</span>
        </div>
      </div>
    );
  }
  return null;
}
