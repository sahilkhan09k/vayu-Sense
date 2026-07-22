import {
  LayoutDashboard,
  Map,
  History,
  CloudSun,
  Shield,
  Settings,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Target,
  ShieldAlert,
  Building2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

interface SidebarProps {
  isExpanded: boolean;
  onToggle: () => void;
  activeItem: string;
  onNavSelect: (id: string, path?: string) => void;
}

const SHARED_NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { id: 'map', label: 'Map', icon: Map, path: '/map' },
  { id: 'history', label: 'History', icon: History, path: '/history' },
  { id: 'forecast', label: 'Forecast', icon: CloudSun, path: '/forecast' },
  { id: 'accuracy', label: 'Accuracy', icon: Target, path: '/accuracy' },
  { id: 'enforcement', label: 'Enforcement', icon: Shield, path: '/enforcement' },
  { id: 'vulnerability', label: 'Vulnerability', icon: ShieldAlert, path: '/vulnerability' },
];

const STATE_ONLY_NAV_ITEMS = [
  { id: 'cities', label: 'Cities', icon: Building2, path: '/cities' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
];

export function Sidebar({ isExpanded, onToggle, activeItem, onNavSelect }: SidebarProps) {
  const { user } = useAuth();
  const isStateAuthority = user?.role === 'state_authority';

  const NAV_ITEMS = isStateAuthority
    ? [...SHARED_NAV_ITEMS, ...STATE_ONLY_NAV_ITEMS]
    : SHARED_NAV_ITEMS;

  return (
    <aside className={`sidebar ${isExpanded ? 'sidebar--expanded' : 'sidebar--collapsed'}`}>
      <div className="sidebar__logo">
        <div className={`sidebar__logo-icon-wrapper ${isStateAuthority ? 'sidebar__logo-icon-wrapper--state' : ''}`}>
          <span className="sidebar__logo-icon">VS</span>
        </div>
        {isExpanded && (
          <span className="sidebar__logo-text">
            Vayu<span className="sidebar__logo-text-accent">Sense</span>
          </span>
        )}
      </div>

      {/* Role indicator strip */}
      {isExpanded && (
        <div className={`sidebar__role-strip ${isStateAuthority ? 'sidebar__role-strip--state' : 'sidebar__role-strip--city'}`}>
          {isStateAuthority ? '🏛 STATE AUTHORITY' : `🏙 CITY — ${user?.city?.toUpperCase() ?? 'CITY'}`}
        </div>
      )}

      <nav className="sidebar__nav">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;

          return (
            <button
              key={item.id}
              className={`sidebar__nav-item ${isActive ? 'sidebar__nav-item--active' : ''}`}
              onClick={() => onNavSelect(item.id, item.path)}
              title={!isExpanded ? item.label : undefined}
            >
              {isActive && <span className="sidebar__nav-glow" />}
              <Icon size={20} className="sidebar__nav-icon" />
              {isExpanded && <span className="sidebar__nav-label">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <button className="sidebar__toggle" onClick={onToggle} title={isExpanded ? 'Collapse' : 'Expand'}>
        {isExpanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>
    </aside>
  );
}
