import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { TrendDirection } from '../../types';
import './StatCard.css';

interface StatCardProps {
  label: string;
  value: string;
  unit?: string;
  trend?: TrendDirection;
}

export function StatCard({ label, value, unit, trend }: StatCardProps) {
  return (
    <div className="stat-card">
      {/* Shimmer border on hover */}
      <div className="stat-card__shimmer" />
      <div className="stat-card__inner">
        <span className="stat-card__label">{label}</span>
        <div className="stat-card__row">
          <span className="stat-card__value">{value}</span>
          {unit && <span className="stat-card__unit">{unit}</span>}
          {trend && (
            <span className={`stat-card__trend stat-card__trend--${trend}`}>
              {trend === 'up' && <TrendingUp size={16} />}
              {trend === 'down' && <TrendingDown size={16} />}
              {trend === 'flat' && <Minus size={16} />}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
