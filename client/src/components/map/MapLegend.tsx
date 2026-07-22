import './MapControls.css';

const AQI_LEGEND = [
  { label: 'Good', range: '0–50', color: 'var(--aqi-good)' },
  { label: 'Satisfactory', range: '51–100', color: 'var(--aqi-satisfactory)' },
  { label: 'Moderate', range: '101–200', color: 'var(--aqi-moderate)' },
  { label: 'Poor', range: '201–300', color: 'var(--aqi-poor)' },
  { label: 'Very Poor', range: '301–400', color: 'var(--aqi-very-poor)' },
  { label: 'Severe', range: '401+', color: 'var(--aqi-severe)' },
];

export function MapLegend() {
  return (
    <div className="map-control map-legend">
      <h3 className="map-control__title">AQI Scale</h3>
      <ul className="map-legend__list">
        {AQI_LEGEND.map((item) => (
          <li key={item.label} className="map-legend__item">
            <span className="map-legend__swatch" style={{ backgroundColor: item.color }} />
            <span className="map-legend__label">{item.label}</span>
            <span className="map-legend__range font-mono">{item.range}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
