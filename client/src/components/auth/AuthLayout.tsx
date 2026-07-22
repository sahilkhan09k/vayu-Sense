import React from 'react';
import { WindParticles } from '../common/WindParticles';
import { AQIBadge } from '../common/AQIBadge';
import './AuthLayout.css';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="auth-container">
      {/* Background wind particles across the whole container or left panel */}
      <WindParticles count={60} baseOpacity={0.2} tealTint={true} />

      {/* Left panel: Brand and visual widgets */}
      <div className="auth-left-panel">
        <div className="auth-brand">
          <span className="brand-logo-icon">📊</span>
          <div>
            <h1 className="brand-title">
              Vayu<span className="brand-accent">Sense</span>
            </h1>
            <p className="brand-subtitle">Urban Air Quality Intelligence</p>
          </div>
        </div>

        <div className="auth-visual-widget">
          <div className="widget-header">
            <div className="live-indicator">
              <span className="live-dot"></span>
              LIVE DATA FEED
            </div>
            <span className="widget-station">MUMBAI (COLABA)</span>
          </div>

          <div className="widget-main">
            <div className="widget-aqi-section">
              <span className="widget-label">CURRENT INDEX</span>
              <span className="widget-value font-mono">187</span>
            </div>
            <AQIBadge value={187} size="lg" showLabel />
          </div>

          <div className="widget-stats">
            <div className="widget-stat-item">
              <span className="widget-stat-label">PM2.5</span>
              <span className="widget-stat-val font-mono">92 µg/m³</span>
            </div>
            <div className="widget-stat-item">
              <span className="widget-stat-label">PM10</span>
              <span className="widget-stat-val font-mono">164 µg/m³</span>
            </div>
            <div className="widget-stat-item">
              <span className="widget-stat-label">NO₂</span>
              <span className="widget-stat-val font-mono">38 ppb</span>
            </div>
          </div>

          <div className="widget-grid-lines"></div>
        </div>

        <div className="auth-footer-tag">
          National Ambient Air Quality Standard (NAAQS) Compliant Intelligence Engine.
        </div>
      </div>

      {/* Right panel: Form container */}
      <div className="auth-right-panel">
        <div className="auth-form-card stagger-fade-in">
          {children}
        </div>
      </div>
    </div>
  );
}
