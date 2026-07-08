import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { GeoLocation } from '../types';
import { MapPin, Search } from './Icons';

// Custom teardrop pin so we don't depend on Leaflet's bundled marker assets.
const pinIcon = L.divIcon({
  className: 'hato-pin',
  html: `<svg width="34" height="46" viewBox="0 0 34 46" xmlns="http://www.w3.org/2000/svg">
    <path d="M17 0C7.6 0 0 7.6 0 17c0 12 17 29 17 29s17-17 17-29C34 7.6 26.4 0 17 0z" fill="#2979FF"/>
    <circle cx="17" cy="17" r="6.5" fill="#fff"/></svg>`,
  iconSize: [34, 46],
  iconAnchor: [17, 46],
});

const DEFAULT_CENTER: [number, number] = [20.5937, 78.9629]; // India

interface Props {
  value: GeoLocation | null;
  onChange: (loc: GeoLocation) => void;
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
      { headers: { 'Accept-Language': 'en' } },
    );
    const json = await res.json();
    return json.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

interface SearchHit { display_name: string; lat: string; lon: string }

// Handles map clicks + recentres when the value changes externally (search).
function MapController({ value, onPick }: { value: GeoLocation | null; onPick: (lat: number, lng: number) => void }) {
  const map = useMap();
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  useEffect(() => {
    if (value) map.flyTo([value.lat, value.lng], Math.max(map.getZoom(), 15), { duration: 0.8 });
  }, [value?.lat, value?.lng]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

export function MapPicker({ value, onChange }: Props) {
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [open, setOpen] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout>>(null);

  const center = useMemo<[number, number]>(() => (value ? [value.lat, value.lng] : DEFAULT_CENTER), []); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = async (lat: number, lng: number, address?: string) => {
    const formattedAddress = address ?? (await reverseGeocode(lat, lng));
    onChange({ lat, lng, formattedAddress });
  };

  const runSearch = (q: string) => {
    setQuery(q);
    if (debounce.current) clearTimeout(debounce.current);
    if (q.trim().length < 3) { setHits([]); return; }
    debounce.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&countrycodes=in&q=${encodeURIComponent(q)}`,
          { headers: { 'Accept-Language': 'en' } },
        );
        setHits(await res.json());
        setOpen(true);
      } catch {
        setHits([]);
      }
    }, 400);
  };

  const useMyLocation = () => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => pick(pos.coords.latitude, pos.coords.longitude),
      () => alert('Could not access your location. Please search or tap on the map.'),
    );
  };

  return (
    <div>
      <div className="map-search">
        <div className="input-group" style={{ position: 'relative' }}>
          <span className="input-group__prefix"><Search size={16} /></span>
          <input
            className="input"
            placeholder="Search for your area, street or landmark"
            value={query}
            onChange={(e) => runSearch(e.target.value)}
            onFocus={() => hits.length && setOpen(true)}
          />
        </div>
        {open && hits.length > 0 && (
          <ul style={{
            listStyle: 'none', margin: '6px 0 0', padding: 6, position: 'absolute', zIndex: 5,
            width: '100%', background: '#fff', border: '1px solid var(--ink-200)',
            borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', maxHeight: 220, overflow: 'auto',
          }}>
            {hits.map((h, i) => (
              <li key={i}>
                <button
                  type="button"
                  style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '10px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 14, color: 'var(--ink-700)' }}
                  onMouseDown={() => { pick(parseFloat(h.lat), parseFloat(h.lon), h.display_name); setQuery(h.display_name); setOpen(false); }}
                >
                  {h.display_name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="map-wrap">
        <MapContainer center={center} zoom={value ? 15 : 5} scrollWheelZoom>
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {value && <Marker position={[value.lat, value.lng]} icon={pinIcon} />}
          <MapController value={value} onPick={(lat, lng) => pick(lat, lng)} />
        </MapContainer>
      </div>

      <div className="map-hint" style={{ justifyContent: 'space-between' }}>
        <span><MapPin size={14} /> Tap on the map to drop a pin</span>
        <button type="button" className="btn--link" style={{ padding: 0 }} onClick={useMyLocation}>Use my location</button>
      </div>

      {value && (
        <div className="map-selected">
          <MapPin size={18} />
          <div><strong style={{ display: 'block', marginBottom: 2 }}>Selected location</strong>{value.formattedAddress}</div>
        </div>
      )}
    </div>
  );
}
