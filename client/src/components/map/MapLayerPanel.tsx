import './MapControls.css';

interface MapLayerPanelProps {
  showWards: boolean;
  showStations: boolean;
  onToggleWards: (value: boolean) => void;
  onToggleStations: (value: boolean) => void;
}

export function MapLayerPanel({
  showWards,
  showStations,
  onToggleWards,
  onToggleStations,
}: MapLayerPanelProps) {
  return (
    <div className="map-control map-layer-panel">
      <h3 className="map-control__title">Layers</h3>
      <label className="map-layer-panel__item">
        <input
          type="checkbox"
          checked={showWards}
          onChange={(e) => onToggleWards(e.target.checked)}
        />
        <span>Ward boundaries</span>
      </label>
      <label className="map-layer-panel__item">
        <input
          type="checkbox"
          checked={showStations}
          onChange={(e) => onToggleStations(e.target.checked)}
        />
        <span>Station markers</span>
      </label>
    </div>
  );
}
