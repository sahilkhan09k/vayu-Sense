import { useState, useEffect } from 'react';
import { ChevronDown, Radio, Lock } from 'lucide-react';
import type { CityName } from '../../types';
import { useAuth } from '../../context/AuthContext';
import './TopBar.css';

interface TopBarProps {
  selectedCity: CityName;
  onCityChange: (city: CityName) => void;
}

const CITIES: CityName[] = ['Mumbai', 'Delhi', 'Bengaluru'];

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function TopBar({ selectedCity, onCityChange }: TopBarProps) {
  const [now, setNow] = useState(new Date());
  const { user } = useAuth();

  // City authority is locked to their assigned city
  const isCityAuthority = user?.role === 'city_authority';
  const isStateAuthority = user?.role === 'state_authority';

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="topbar">
      {/* City Selector — glassmorphic chip */}
      <div className="topbar__city-selector">
        {isCityAuthority ? (
          /* City authority: locked to their city */
          <div className="topbar__city-locked">
            <Lock size={12} className="topbar__lock-icon" />
            <span className="topbar__city-locked-name">{selectedCity}</span>
          </div>
        ) : (
          /* State authority: full city switcher */
          <>
            <select
              value={selectedCity}
              onChange={(e) => onCityChange(e.target.value as CityName)}
              className="topbar__city-select"
            >
              {CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="topbar__city-chevron" />
          </>
        )}
      </div>

      {/* Role badge — distinctive for each authority tier */}
      {isStateAuthority && (
        <div className="topbar__role-badge topbar__role-badge--state">
          🏛️ State Authority
        </div>
      )}
      {isCityAuthority && (
        <div className="topbar__role-badge topbar__role-badge--city">
          🏙️ City Admin — {user?.city}
        </div>
      )}

      {/* Spacer */}
      <div className="topbar__spacer" />

      {/* Date & Time */}
      <div className="topbar__datetime">
        <span className="topbar__date">{formatDate(now)}</span>
        <span className="topbar__time-separator">·</span>
        <span className="topbar__time font-mono">{formatTime(now)}</span>
      </div>

      {/* Live indicator with triple-ring pulse */}
      <div className="topbar__live">
        <div className="topbar__live-dot-container">
          <span className="topbar__live-dot" />
          <span className="topbar__live-ring topbar__live-ring--1" />
          <span className="topbar__live-ring topbar__live-ring--2" />
        </div>
        <Radio size={14} className="topbar__live-icon" />
        <span className="topbar__live-label">Live</span>
      </div>
    </header>
  );
}
