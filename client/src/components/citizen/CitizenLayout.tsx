/**
 * CitizenLayout.tsx
 * Shared mobile-first shell for all citizen pages.
 * Provides header, bottom navigation bar, and page wrapper.
 */
import { useAuth } from '../../context/AuthContext';
import { NavLink } from 'react-router-dom';
import { Home, Navigation2, Flag, User } from 'lucide-react';
import './CitizenLayout.css';

interface CitizenLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function CitizenLayout({ children, title }: CitizenLayoutProps) {
  const { user } = useAuth();

  return (
    <div className="citizen-shell">
      {/* Header */}
      <header className="citizen-shell__header">
        <div className="citizen-shell__brand">
          <span className="citizen-shell__logo">Vayu<span>Sense</span></span>
          {title && <span className="citizen-shell__page-title">{title}</span>}
        </div>
        <div className="citizen-shell__user-chip">
          <span className="citizen-shell__user-name">{user?.name?.split(' ')[0]}</span>
        </div>
      </header>

      {/* Page Content */}
      <main className="citizen-shell__main">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="citizen-bottom-nav">
        <NavLink to="/citizen" end className={({ isActive }) => `citizen-nav-item ${isActive ? 'citizen-nav-item--active' : ''}`}>
          <Home size={20} />
          <span>Home</span>
        </NavLink>
        <NavLink to="/citizen/commute" className={({ isActive }) => `citizen-nav-item ${isActive ? 'citizen-nav-item--active' : ''}`}>
          <Navigation2 size={20} />
          <span>Commute</span>
        </NavLink>
        <NavLink to="/citizen/report" className={({ isActive }) => `citizen-nav-item ${isActive ? 'citizen-nav-item--active' : ''}`}>
          <Flag size={20} />
          <span>Report</span>
        </NavLink>
        <NavLink to="/citizen/profile" className={({ isActive }) => `citizen-nav-item ${isActive ? 'citizen-nav-item--active' : ''}`}>
          <User size={20} />
          <span>Profile</span>
        </NavLink>
      </nav>
    </div>
  );
}
