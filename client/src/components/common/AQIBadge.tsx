import { getAQICategory, getAQICSSVar, getAQILabel, shouldUseDarkText } from '../../types';
import './AQIBadge.css';

interface AQIBadgeProps {
  value: number;
  /** Show the category label below the number */
  showLabel?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

export function AQIBadge({ value, showLabel = false, size = 'md' }: AQIBadgeProps) {
  const category = getAQICategory(value);
  const bgColor = getAQICSSVar(category);
  const useDarkText = shouldUseDarkText(category);

  return (
    <span
      className={`aqi-badge aqi-badge--${size}`}
      style={{
        backgroundColor: bgColor,
        color: useDarkText ? '#0A0E1A' : '#FFFFFF',
        boxShadow: `0 0 12px ${bgColor}44, 0 2px 8px rgba(0,0,0,0.3)`,
      }}
    >
      <span className="aqi-badge__value">{value}</span>
      {showLabel && (
        <span className="aqi-badge__label">{getAQILabel(category)}</span>
      )}
    </span>
  );
}
