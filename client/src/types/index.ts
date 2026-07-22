/* --- Types --- */

export type AQICategory =
  | 'good'
  | 'satisfactory'
  | 'moderate'
  | 'poor'
  | 'very-poor'
  | 'severe';

export type TrendDirection = 'up' | 'down' | 'flat';

export interface NavItem {
  id: string;
  label: string;
  icon: string;
}

export type CityName = 'Mumbai' | 'Delhi' | 'Bengaluru';

export interface City {
  name: CityName;
  lat: number;
  lng: number;
}

/**
 * Returns the AQI category for a given numeric AQI value.
 */
export function getAQICategory(value: number): AQICategory {
  if (value <= 50) return 'good';
  if (value <= 100) return 'satisfactory';
  if (value <= 200) return 'moderate';
  if (value <= 300) return 'poor';
  if (value <= 400) return 'very-poor';
  return 'severe';
}

/**
 * Returns the CSS variable name for an AQI category.
 */
export function getAQICSSVar(category: AQICategory): string {
  const map: Record<AQICategory, string> = {
    'good': 'var(--aqi-good)',
    'satisfactory': 'var(--aqi-satisfactory)',
    'moderate': 'var(--aqi-moderate)',
    'poor': 'var(--aqi-poor)',
    'very-poor': 'var(--aqi-very-poor)',
    'severe': 'var(--aqi-severe)',
  };
  return map[category];
}

/**
 * Returns the label for an AQI category.
 */
export function getAQILabel(category: AQICategory): string {
  const map: Record<AQICategory, string> = {
    'good': 'Good',
    'satisfactory': 'Satisfactory',
    'moderate': 'Moderate',
    'poor': 'Poor',
    'very-poor': 'Very Poor',
    'severe': 'Severe',
  };
  return map[category];
}

/**
 * Returns whether text on this AQI color should be dark for readability.
 */
export function shouldUseDarkText(category: AQICategory): boolean {
  return category === 'satisfactory' || category === 'moderate';
}
