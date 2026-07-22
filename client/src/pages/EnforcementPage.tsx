import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline } from 'react-leaflet';
import { useCity } from '../context/CityContext';
import { AppLayout } from '../components/layout/AppLayout';
import { AlertTriangle, Plus, FileText, Navigation } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import './EnforcementPage.css';

interface SensitiveReceptor {
  id: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
}

interface QueueWard {
  wardId: string;
  wardName: string;
  city: string;
  lat: number;
  lng: number;
  aqi: number;
  pm25: number;
  pm10: number;
  sensitiveReceptorsCount: number;
  sensitiveReceptors: SensitiveReceptor[];
  priorityScore: number;
  status: string;
}

interface ActionLog {
  _id?: string;
  wardId: string;
  wardName: string;
  city: string;
  officerName: string;
  violationType: string;
  severity: string;
  status: string;
  notes: string;
  createdAt: string;
}

// Coordinate distance calculations for TSP
function getDistance(p1: { lat: number; lng: number }, p2: { lat: number; lng: number }): number {
  return Math.sqrt(Math.pow(p1.lat - p2.lat, 2) + Math.pow(p1.lng - p2.lng, 2));
}

function calculateTSP(wards: QueueWard[]): QueueWard[] {
  if (wards.length <= 1) return wards;
  const unvisited = [...wards];
  const path: QueueWard[] = [];
  
  // Start with the highest-priority ward
  let current = unvisited.shift()!;
  path.push(current);

  while (unvisited.length > 0) {
    let nearestIndex = -1;
    let minDist = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const dist = getDistance({ lat: current.lat, lng: current.lng }, { lat: unvisited[i].lat, lng: unvisited[i].lng });
      if (dist < minDist) {
        minDist = dist;
        nearestIndex = i;
      }
    }

    if (nearestIndex !== -1) {
      current = unvisited.splice(nearestIndex, 1)[0];
      path.push(current);
    }
  }
  return path;
}

export function EnforcementPage() {
  const { selectedCity } = useCity();
  const [queue, setQueue] = useState<QueueWard[]>([]);
  const [actions, setActions] = useState<ActionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [optimizeRoute, setOptimizeRoute] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Form states
  const [targetWardId, setTargetWardId] = useState('');
  const [violationType, setViolationType] = useState('Construction Dust');
  const [severity, setSeverity] = useState('High');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Default Map center based on selectedCity
  const mapCenter = useMemo((): [number, number] => {
    if (selectedCity === 'Delhi') return [28.6139, 77.2090];
    if (selectedCity === 'Bengaluru') return [12.9716, 77.5946];
    return [19.0760, 72.8777]; // Mumbai
  }, [selectedCity]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch ranked queue
      const queueRes = await fetch(`/api/enforcement/queue?city=${encodeURIComponent(selectedCity)}`);
      if (!queueRes.ok) throw new Error('Failed to load enforcement queue');
      const queueData = await queueRes.json();
      setQueue(queueData.queue || []);
      if (queueData.queue?.length > 0) {
        setTargetWardId(queueData.queue[0].wardId);
      }

      // 2. Fetch logged actions
      const actionsRes = await fetch(`/api/enforcement/actions?city=${encodeURIComponent(selectedCity)}`);
      if (!actionsRes.ok) throw new Error('Failed to load violation logs');
      const actionsData = await actionsRes.json();
      setActions(actionsData.actions || []);
    } catch (err: any) {
      setError(err.message || 'Error syncing enforcement dataset');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCity]);

  // Route points calculation
  const routePositions = useMemo((): [number, number][] => {
    if (queue.length === 0) return [];
    
    let ordered = [...queue];
    if (optimizeRoute) {
      ordered = calculateTSP(queue);
    }
    return ordered.map((w) => [w.lat, w.lng]);
  }, [queue, optimizeRoute]);

  // Submit Violation Form
  const handleLogViolation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetWardId || !violationType || !severity || !notes) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/enforcement/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wardId: targetWardId,
          violationType,
          severity,
          notes,
        }),
      });

      if (!res.ok) throw new Error('Failed to submit violation report');
      
      setIsModalOpen(false);
      setNotes('');
      // Refresh list
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error saving report');
    } finally {
      setSubmitting(false);
    }
  };

  // Trigger PDF evidence package download
  const handleDownloadEvidence = async (wardId: string) => {
    setDownloadingId(wardId);
    try {
      // Find matching action details to populate the PDF
      const matches = actions.filter((a) => a.wardId === wardId);
      const latestMatch = matches[0];
      
      let queryParams = '';
      if (latestMatch) {
        queryParams = `?violationType=${encodeURIComponent(latestMatch.violationType)}&notes=${encodeURIComponent(latestMatch.notes)}&officerName=${encodeURIComponent(latestMatch.officerName)}`;
      }

      window.open(`/api/enforcement/evidence/${wardId}${queryParams}`, '_blank');
    } catch (err) {
      console.error(err);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <AppLayout>
      <div className="enforcement-page stagger-fade-in">
        {/* Top Header */}
        <div className="enforcement-header">
          <div className="enforcement-title-section">
            <h1>Enforcement Command & Dispatch</h1>
            <p>Deploy field officers, audit industrial/construction compliance, and generate legal evidence packages</p>
          </div>

          <button className="log-violation-btn" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} />
            <span>Log Inspection Violation</span>
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="loader-container">
            <div className="loading-spinner" style={{ borderTopColor: 'var(--accent-teal)' }} />
            <span>Syncing telemetry and receptor hot spots...</span>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="dashboard-error-banner" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Workspace */}
        {!loading && (
          <>
            <div className="enforcement-workspace">
              {/* Queue Rankings Card */}
              <div className="enforcement-card">
                <div className="enforcement-card-title">
                  <span>Inspection Priority Queue</span>
                  <label className="routing-toggle-label">
                    <input 
                      type="checkbox" 
                      className="routing-toggle-input"
                      checked={optimizeRoute}
                      onChange={(e) => setOptimizeRoute(e.target.checked)}
                    />
                    <Navigation size={12} className={optimizeRoute ? 'spin' : ''} />
                    <span>Optimize Dispatch Route (TSP)</span>
                  </label>
                </div>

                <div className="enforcement-queue-list">
                  {queue.map((w, idx) => {
                    const statusColor = w.priorityScore > 75 ? 'var(--aqi-severe)' : w.priorityScore > 50 ? 'var(--aqi-poor)' : 'var(--aqi-good)';
                    return (
                      <div key={w.wardId} className="queue-item">
                        <div className="queue-item-info">
                          <span className="queue-item-name">{idx + 1}. {w.wardName}</span>
                          <div className="queue-item-details">
                            <span style={{ color: statusColor, fontWeight: 700 }}>Priority: {w.status}</span>
                            {w.sensitiveReceptorsCount > 0 && (
                              <span className="receptor-tag">
                                {w.sensitiveReceptorsCount} Receptors
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="queue-item-actions">
                          <div className="queue-item-metrics">
                            <span 
                              className="queue-aqi-badge font-mono"
                              style={{ 
                                backgroundColor: w.aqi > 200 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(0, 212, 180, 0.1)',
                                color: w.aqi > 200 ? 'var(--aqi-severe)' : 'var(--accent-teal)'
                              }}
                            >
                              AQI {w.aqi}
                            </span>
                            <div className="priority-score-bar">
                              <div 
                                className="priority-score-fill"
                                style={{ 
                                  width: `${w.priorityScore}%`,
                                  backgroundColor: statusColor
                                }}
                              />
                            </div>
                          </div>

                          <button 
                            className="pdf-download-btn"
                            title="Generate Evidence Package PDF"
                            onClick={() => handleDownloadEvidence(w.wardId)}
                            disabled={downloadingId === w.wardId}
                          >
                            <FileText size={18} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Leaflet Hotspot Map Card */}
              <div className="enforcement-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="enforcement-map-panel">
                  <MapContainer center={mapCenter} zoom={12} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                    <TileLayer
                      url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                      attribution="&copy; OpenStreetMap &copy; CARTO"
                    />

                    {/* Ward Hotspots Circles */}
                    {queue.map((w) => {
                      const circleColor = w.priorityScore > 75 ? '#ef4444' : w.priorityScore > 50 ? '#f59e0b' : '#10b981';
                      return (
                        <CircleMarker
                          key={w.wardId}
                          center={[w.lat, w.lng]}
                          radius={12 + w.priorityScore * 0.1}
                          fillColor={circleColor}
                          color={circleColor}
                          weight={1}
                          fillOpacity={0.18}
                        >
                          <Popup>
                            <div style={{ fontSize: '12px', lineHeight: '1.5' }}>
                              <strong style={{ color: 'var(--text-primary)' }}>{w.wardName}</strong><br />
                              <span>Live AQI: {w.aqi}</span><br />
                              <span style={{ color: circleColor, fontWeight: 700 }}>Priority: {w.priorityScore}%</span>
                            </div>
                          </Popup>
                        </CircleMarker>
                      );
                    })}

                    {/* Sensitive Receptor Markers */}
                    {queue.flatMap((w) => w.sensitiveReceptors).map((r) => (
                      <CircleMarker
                        key={r.id}
                        center={[r.lat, r.lng]}
                        radius={6}
                        fillColor={r.type === 'hospital' ? '#ef4444' : '#f59e0b'}
                        color="#ffffff"
                        weight={1.5}
                        fillOpacity={0.8}
                      >
                        <Popup>
                          <div style={{ fontSize: '11px' }}>
                            <strong>{r.name}</strong><br />
                            <span style={{ textTransform: 'capitalize' }}>Type: {r.type}</span>
                          </div>
                        </Popup>
                      </CircleMarker>
                    ))}

                    {/* Optimized Dispatch TSP Polyline Path */}
                    {routePositions.length > 0 && (
                      <Polyline 
                        positions={routePositions} 
                        color="var(--accent-teal)" 
                        dashArray="6, 12" 
                        weight={2.5}
                      />
                    )}
                  </MapContainer>
                </div>
              </div>
            </div>

            {/* Historical Enforcement Actions Table Section */}
            <div className="actions-logs-section">
              <div className="actions-table-card">
                <span className="enforcement-card-title" style={{ marginBottom: '16px' }}>Compliance Audit & Actions Log</span>
                <div className="actions-log-grid">
                  {actions.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '24px' }}>
                      No violation audits logged in the system yet.
                    </div>
                  ) : (
                    actions.map((act) => (
                      <div key={act._id} className="action-log-row">
                        <div className="action-log-main">
                          <span className="action-log-title">{act.wardName} — {act.violationType}</span>
                          <span className="action-log-subtitle">
                            Logged by {act.officerName} on {new Date(act.createdAt).toLocaleString('en-IN')}
                          </span>
                          <p className="action-log-notes">"{act.notes}"</p>
                        </div>

                        <div className="action-log-badge-group">
                          <span className={`status-badge ${act.status.toLowerCase().replace(' ', '-')}`}>
                            {act.status}
                          </span>
                          <span 
                            style={{ 
                              fontSize: '10px', 
                              fontWeight: 700, 
                              color: act.severity === 'Critical' ? 'var(--aqi-severe)' : act.severity === 'High' ? 'var(--aqi-poor)' : 'var(--text-secondary)'
                            }}
                          >
                            Severity: {act.severity}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Log Violation Form Modal */}
        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content animate-slide-in">
              <div className="modal-header">
                <h2>Log Compliance Violation</h2>
              </div>
              <form onSubmit={handleLogViolation} className="modal-form">
                <div className="form-group">
                  <label>Target Ward</label>
                  <select 
                    value={targetWardId} 
                    onChange={(e) => setTargetWardId(e.target.value)}
                    className="form-select"
                  >
                    {queue.map((w) => (
                      <option key={w.wardId} value={w.wardId}>
                        {w.wardName} (AQI {w.aqi})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Violation Class</label>
                  <select 
                    value={violationType} 
                    onChange={(e) => setViolationType(e.target.value)}
                    className="form-select"
                  >
                    <option value="Construction Dust">Construction Dust Emission</option>
                    <option value="Biomass Burning">Open Garbage/Biomass Burning</option>
                    <option value="Industrial Emission">Excessive Industrial Smoke plume</option>
                    <option value="Vehicle Idling">Commercial Vehicle Idling hotspot</option>
                    <option value="Road Dust">Unpaved Road Dust</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Breach Severity</label>
                  <select 
                    value={severity} 
                    onChange={(e) => setSeverity(e.target.value)}
                    className="form-select"
                  >
                    <option value="Moderate">Moderate Compliance Deficit</option>
                    <option value="High">High Breach Risk</option>
                    <option value="Critical">Critical Public Health Threat</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Officer Field Audit Notes</label>
                  <textarea 
                    value={notes} 
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Describe specific infractions, fine amounts, or immediate corrective warnings issued..."
                    className="form-textarea"
                    required
                  />
                </div>

                <div className="modal-buttons">
                  <button type="button" className="modal-cancel-btn" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="modal-submit-btn" disabled={submitting}>
                    {submitting ? 'Logging...' : 'Submit Action'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
