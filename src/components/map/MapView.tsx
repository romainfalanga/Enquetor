import { useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useInvestigationStore } from '../../store/investigationStore';
import {
  ENTITY_TYPE_LABELS,
  ENTITY_COLORS,
  CONFIDENCE_LABELS,
} from '../../types';
import { Plus, Target, X } from 'lucide-react';
import EntityForm from '../shared/EntityForm';

// Fix Leaflet default marker icons
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function createColoredIcon(color: string) {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: ${color};
      border: 3px solid #fff;
      box-shadow: 0 2px 6px rgba(0,0,0,0.5);
    "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -16],
  });
}

function FitBounds({ bounds }: { bounds: L.LatLngBoundsExpression | null }) {
  const map = useMap();
  useMemo(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, map]);
  return null;
}

export default function MapView() {
  const { getFilteredEntities, setSelectedEntity } = useInvestigationStore();
  const [showEntityForm, setShowEntityForm] = useState(false);
  const [radiusCenter, setRadiusCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [radiusMeters, setRadiusMeters] = useState(500);

  const geoEntities = useMemo(
    () => getFilteredEntities().filter((e) => e.coordinates),
    [getFilteredEntities],
  );

  const bounds = useMemo(() => {
    if (geoEntities.length === 0) return null;
    const latlngs = geoEntities.map((e) =>
      L.latLng(e.coordinates!.lat, e.coordinates!.lng),
    );
    return L.latLngBounds(latlngs);
  }, [geoEntities]);

  const defaultCenter: [number, number] = [48.8566, 2.3522]; // Paris

  return (
    <div className="view-container map-view">
      <div className="view-header">
        <h2>Carte</h2>
        <div className="view-actions">
          <div className="radius-control">
            <Target size={14} />
            <input
              type="number"
              value={radiusMeters}
              onChange={(e) => setRadiusMeters(parseInt(e.target.value) || 500)}
              min={100}
              max={10000}
              step={100}
              className="radius-input"
              title="Rayon en m\u00e8tres"
            />
            <span>m</span>
            {radiusCenter && (
              <button
                className="btn btn-sm btn-ghost"
                onClick={() => setRadiusCenter(null)}
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button className="btn btn-sm btn-primary" onClick={() => setShowEntityForm(true)}>
            <Plus size={14} />
            <span className="btn-label-desktop">Lieu</span>
          </button>
        </div>
      </div>

      <div className="map-container">
        {geoEntities.length === 0 ? (
          <div className="empty-state">
            <p>Aucune entité géolocalisée.</p>
            <p>Ajoutez des coordonnées (latitude, longitude) à vos entités pour les voir sur la carte.</p>
          </div>
        ) : (
          <MapContainer
            center={bounds ? bounds.getCenter() : defaultCenter}
            zoom={13}
            className="leaflet-map"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FitBounds bounds={bounds} />

            {geoEntities.map((entity) => (
              <Marker
                key={entity.id}
                position={[entity.coordinates!.lat, entity.coordinates!.lng]}
                icon={createColoredIcon(ENTITY_COLORS[entity.type])}
                eventHandlers={{
                  click: () => {
                    setSelectedEntity(entity.id);
                    setRadiusCenter(entity.coordinates!);
                  },
                }}
              >
                <Popup>
                  <div className="map-popup">
                    <strong>{entity.label}</strong>
                    <div className="popup-meta">
                      <span className="badge badge-sm" style={{
                        background: ENTITY_COLORS[entity.type] + '33',
                        color: ENTITY_COLORS[entity.type],
                      }}>
                        {ENTITY_TYPE_LABELS[entity.type]}
                      </span>
                      <span className={`badge badge-confidence badge-${entity.confidence} badge-sm`}>
                        {CONFIDENCE_LABELS[entity.confidence]}
                      </span>
                    </div>
                    <p>{entity.description}</p>
                  </div>
                </Popup>
              </Marker>
            ))}

            {radiusCenter && (
              <Circle
                center={[radiusCenter.lat, radiusCenter.lng]}
                radius={radiusMeters}
                pathOptions={{
                  color: '#4fc3f7',
                  fillColor: '#4fc3f7',
                  fillOpacity: 0.15,
                  weight: 2,
                }}
              />
            )}
          </MapContainer>
        )}
      </div>

      {showEntityForm && <EntityForm onClose={() => setShowEntityForm(false)} />}
    </div>
  );
}
