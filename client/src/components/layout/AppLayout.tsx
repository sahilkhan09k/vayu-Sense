import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { WindParticles } from '../common/WindParticles';
import { useCity } from '../../context/CityContext';
import './AppLayout.css';

interface AppLayoutProps {
  children: ReactNode;
  /** Full-bleed mode for map pages — no padding, no wind particles */
  fullBleed?: boolean;
}

const COLLAPSE_BREAKPOINT = 1024;

const PATH_TO_NAV: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/map': 'map',
  '/history': 'history',
  '/forecast': 'forecast',
  '/enforcement': 'enforcement',
  '/citizen': 'citizen',
  '/cities': 'cities',
  '/settings': 'settings',
};

export function AppLayout({ children, fullBleed = false }: AppLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarExpanded, setSidebarExpanded] = useState(
    () => window.innerWidth >= COLLAPSE_BREAKPOINT,
  );
  const { selectedCity, setSelectedCity } = useCity();

  const activeNav = PATH_TO_NAV[location.pathname] ?? 'dashboard';

  const handleResize = useCallback(() => {
    if (window.innerWidth < COLLAPSE_BREAKPOINT) {
      setSidebarExpanded(false);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  const toggleSidebar = () => setSidebarExpanded((prev) => !prev);

  const handleNavSelect = (_id: string, path?: string) => {
    if (path) {
      navigate(path);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar
        isExpanded={sidebarExpanded}
        onToggle={toggleSidebar}
        activeItem={activeNav}
        onNavSelect={handleNavSelect}
      />

      <div
        className="app-layout__main"
        style={{
          marginLeft: sidebarExpanded
            ? 'var(--sidebar-expanded)'
            : 'var(--sidebar-collapsed)',
        }}
      >
        <TopBar selectedCity={selectedCity} onCityChange={setSelectedCity} />
        <main className={`app-layout__content ${fullBleed ? 'app-layout__content--full-bleed' : ''}`}>
          {!fullBleed && <WindParticles count={75} baseOpacity={0.2} tealTint />}
          <div className={`app-layout__content-inner ${fullBleed ? 'app-layout__content-inner--full-bleed' : ''}`}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
