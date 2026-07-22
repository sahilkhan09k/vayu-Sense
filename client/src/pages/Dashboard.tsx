import { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCity } from '../context/CityContext';
import { useAQIData } from '../hooks/useAQIData';
import { AppLayout } from '../components/layout/AppLayout';
import { StatCard } from '../components/common/StatCard';
import { BaseMap } from '../components/map/BaseMap';
import { AQITable } from '../components/dashboard/AQITable';
import { WardDetailPanel } from '../components/dashboard/WardDetailPanel';
import { CityAuthoritiesPanel } from '../components/admin/CityAuthoritiesPanel';
import { LogOut, User as UserIcon, RefreshCw, AlertTriangle } from 'lucide-react';
import { formatRoleLabel } from '../utils/authRoutes';
import './Dashboard.css';

export function Dashboard() {
  const { user, logout } = useAuth();
  const { selectedCity } = useCity();
  const isStateAuthority = user?.role === 'state_authority';
  const isCityAuthority = user?.role === 'city_authority';

  // Fetch live AQI data for selected city
  const { data, loading, error, refresh, secondsSinceUpdate } = useAQIData(selectedCity);

  const [selectedWardId, setSelectedWardId] = useState<string | null>(null);
  const [selectedWardName, setSelectedWardName] = useState<string | null>(null);

  const selectedWardData = useMemo(() => {
    if (!data || !selectedWardId) return null;
    return data.wards.find((w) => w.wardId === selectedWardId) || null;
  }, [data, selectedWardId]);

  const handleSelectWard = (wardId: string, wardName: string) => {
    setSelectedWardId(wardId);
    setSelectedWardName(wardName);
  };

  // Create a record of wardId -> AQI for choropleth rendering
  const choroplethData = useMemo(() => {
    if (!data) return {};
    const map: Record<string, number> = {};
    for (const w of data.wards) {
      map[w.wardId] = w.aqi;
    }
    return map;
  }, [data]);

  return (
    <AppLayout>
      <div className="dashboard-container stagger-fade-in">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-logo">
              Vayu<span>Sense</span>
            </h1>
            <p className="dashboard-subtitle">
              {isStateAuthority && `${user?.state ?? 'State'} Command Center — State Authority`}
              {isCityAuthority && `${user?.city ?? 'City'} Command Center — City Authority`}
              {!isStateAuthority && !isCityAuthority && 'Urban Air Quality Intelligence Platform'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            {/* Live Polling Status */}
            {data && (
              <div className="dashboard-refresh-status">
                <span className="pulse-dot" />
                <span className="status-text font-mono">
                  Updated {secondsSinceUpdate}s ago
                </span>
                <button
                  onClick={refresh}
                  className="dashboard-refresh-btn"
                  title="Manual refresh"
                  disabled={loading}
                >
                  <RefreshCw size={14} className={loading ? 'spin' : ''} />
                </button>
              </div>
            )}

            {user && (
              <div className="dashboard-user-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="user-icon-wrapper">
                    <UserIcon size={14} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span className="username">{user.name}</span>
                    <span className="role-label">{formatRoleLabel(user.role)}</span>
                  </div>
                </div>
                <div className="user-card-divider" />
                <button onClick={logout} className="logout-btn" title="Sign out">
                  <LogOut size={16} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Loading and Error states */}
        {loading && !data && (
          <div className="dashboard-loader-overlay">
            <div className="loading-spinner" style={{ borderTopColor: 'var(--accent-teal)' }} />
            <span>Syncing city sensors...</span>
          </div>
        )}

        {error && (
          <div className="dashboard-error-banner">
            <AlertTriangle size={18} />
            <span>Error fetching air pollution intelligence: {error}</span>
          </div>
        )}

        {/* Live Metrics Grid */}
        {data && (
          <div className="dashboard-metrics-grid">
            <StatCard
              label={`${selectedCity} AQI`}
              value={String(data.cityAQI)}
              unit="AQI"
              trend={data.cityAQI > 150 ? 'up' : data.cityAQI > 80 ? 'flat' : 'down'}
            />
            <StatCard
              label="Avg PM2.5"
              value={String(data.avgPm25)}
              unit="µg/m³"
              trend={data.avgPm25 > 60 ? 'up' : 'down'}
            />
            <StatCard
              label="Stations Reporting"
              value={String(data.stationsOnline)}
              unit={`/ ${data.wards.length}`}
              trend="flat"
            />
            <StatCard
              label="Critical Ward"
              value={data.worstWard.wardName}
            />
          </div>
        )}

        {/* Main Grid: Map & Rankings & Details */}
        {data && (
          <div className="dashboard-workspace-grid">
            {/* Map and Table container */}
            <div className="dashboard-visual-area">
              <div className="dashboard-map-panel">
                <BaseMap
                  clickedWardId={selectedWardId}
                  onWardClick={handleSelectWard}
                  aqiData={choroplethData}
                />
              </div>
              <div className="dashboard-table-panel">
                <AQITable
                  wards={data.wards}
                  selectedWardId={selectedWardId}
                  onSelectWard={handleSelectWard}
                />
              </div>
            </div>

            {/* Slide-over details pane */}
            {selectedWardId && selectedWardName && (
              <div className="dashboard-details-sidebar animate-slide-in">
                <WardDetailPanel
                  wardId={selectedWardId}
                  wardName={selectedWardName}
                  wardData={selectedWardData}
                  onClose={() => {
                    setSelectedWardId(null);
                    setSelectedWardName(null);
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* State authority panel */}
        {isStateAuthority && (
          <div style={{ marginTop: '24px' }}>
            <CityAuthoritiesPanel />
          </div>
        )}
      </div>
    </AppLayout>
  );
}
