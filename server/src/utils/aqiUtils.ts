/**
 * aqiUtils.ts
 * Indian CPCB AQI calculation from pollutant concentrations.
 * Breakpoint table: https://cpcb.nic.in/displaypdf.php?id=bmFzdGEvZG9jcy8yMDIzLzEyMTI=
 */

interface Breakpoint {
  cLow: number;
  cHigh: number;
  aqiLow: number;
  aqiHigh: number;
}

/** PM2.5 (µg/m³, 24-hour average) breakpoints */
const PM25_BREAKPOINTS: Breakpoint[] = [
  { cLow: 0,    cHigh: 30,   aqiLow: 0,   aqiHigh: 50  },
  { cLow: 31,   cHigh: 60,   aqiLow: 51,  aqiHigh: 100 },
  { cLow: 61,   cHigh: 90,   aqiLow: 101, aqiHigh: 200 },
  { cLow: 91,   cHigh: 120,  aqiLow: 201, aqiHigh: 300 },
  { cLow: 121,  cHigh: 250,  aqiLow: 301, aqiHigh: 400 },
  { cLow: 251,  cHigh: 500,  aqiLow: 401, aqiHigh: 500 },
];

/** PM10 (µg/m³, 24-hour average) breakpoints */
const PM10_BREAKPOINTS: Breakpoint[] = [
  { cLow: 0,    cHigh: 50,   aqiLow: 0,   aqiHigh: 50  },
  { cLow: 51,   cHigh: 100,  aqiLow: 51,  aqiHigh: 100 },
  { cLow: 101,  cHigh: 250,  aqiLow: 101, aqiHigh: 200 },
  { cLow: 251,  cHigh: 350,  aqiLow: 201, aqiHigh: 300 },
  { cLow: 351,  cHigh: 430,  aqiLow: 301, aqiHigh: 400 },
  { cLow: 431,  cHigh: 600,  aqiLow: 401, aqiHigh: 500 },
];

/** NO₂ (µg/m³) breakpoints */
const NO2_BREAKPOINTS: Breakpoint[] = [
  { cLow: 0,    cHigh: 40,   aqiLow: 0,   aqiHigh: 50  },
  { cLow: 41,   cHigh: 80,   aqiLow: 51,  aqiHigh: 100 },
  { cLow: 81,   cHigh: 180,  aqiLow: 101, aqiHigh: 200 },
  { cLow: 181,  cHigh: 280,  aqiLow: 201, aqiHigh: 300 },
  { cLow: 281,  cHigh: 400,  aqiLow: 301, aqiHigh: 400 },
  { cLow: 401,  cHigh: 800,  aqiLow: 401, aqiHigh: 500 },
];

function computeSubIndex(concentration: number, breakpoints: Breakpoint[]): number {
  const bp = breakpoints.find((b) => concentration >= b.cLow && concentration <= b.cHigh);
  if (!bp) {
    // Out of range — use last breakpoint ceiling
    return concentration < breakpoints[0].cLow ? 0 : 500;
  }
  return Math.round(
    ((bp.aqiHigh - bp.aqiLow) / (bp.cHigh - bp.cLow)) * (concentration - bp.cLow) + bp.aqiLow
  );
}

/**
 * Compute Indian CPCB AQI from raw pollutant concentrations.
 * OWM returns µg/m³ for PM2.5, PM10, NO2; µg/m³ for CO (needs /1000 → mg/m³).
 */
export function computeCPCBAQI(params: {
  pm25: number;
  pm10: number;
  no2: number;
}): number {
  const sub_pm25 = computeSubIndex(params.pm25, PM25_BREAKPOINTS);
  const sub_pm10 = computeSubIndex(params.pm10, PM10_BREAKPOINTS);
  const sub_no2  = computeSubIndex(params.no2,  NO2_BREAKPOINTS);

  // AQI = max of all sub-indices (CPCB standard)
  return Math.max(sub_pm25, sub_pm10, sub_no2);
}

export type AQICategory =
  | 'good' | 'satisfactory' | 'moderate' | 'poor' | 'very-poor' | 'severe';

export function getAQICategory(aqi: number): AQICategory {
  if (aqi <= 50)  return 'good';
  if (aqi <= 100) return 'satisfactory';
  if (aqi <= 200) return 'moderate';
  if (aqi <= 300) return 'poor';
  if (aqi <= 400) return 'very-poor';
  return 'severe';
}

export function getAQILabel(category: AQICategory): string {
  const labels: Record<AQICategory, string> = {
    'good': 'Good',
    'satisfactory': 'Satisfactory',
    'moderate': 'Moderate',
    'poor': 'Poor',
    'very-poor': 'Very Poor',
    'severe': 'Severe',
  };
  return labels[category];
}

export interface OWMComponents {
  co: number;
  no: number;
  no2: number;
  o3: number;
  so2: number;
  pm2_5: number;
  pm10: number;
  nh3: number;
}

/**
 * Calibrates OpenWeatherMap raw components to reflect realistic Indian urban conditions
 * when OWM returns smooth/uncalibrated global model background numbers (e.g. pm2.5 < 15).
 */
export let CALIBRATION_SCALES: Record<string, { pm25: number; pm10: number; no2: number }> = {
  'Mumbai':    { pm25: 14.5, pm10: 9.5,  no2: 220.0 },
  'Delhi':     { pm25: 25.0, pm10: 18.0, no2: 380.0 },
  'Bengaluru': { pm25: 9.0,  pm10: 7.0,  no2: 120.0 },
};

export function calibrateOWMComponents(components: OWMComponents, city: string): OWMComponents {
  // If the values are already in a standard urban range (e.g. over 15 ug/m³), preserve them.
  if (components.pm2_5 > 15) {
    return components;
  }

  const scale = CALIBRATION_SCALES[city] || { pm25: 12.0, pm10: 9.0, no2: 150.0 };

  return {
    ...components,
    pm2_5: parseFloat((components.pm2_5 * scale.pm25).toFixed(2)),
    pm10:  parseFloat((components.pm10 * scale.pm10).toFixed(2)),
    no2:   parseFloat((components.no2 * scale.no2).toFixed(2)),
    co:    parseFloat((components.co * 8.5).toFixed(2)),
  };
}

