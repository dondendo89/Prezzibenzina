import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { useMemo } from 'react';

type Props = {
  items: Array<{ id: string; nome: string; lat: number; lon: number; prezzo_attuale: number | null; variazione: boolean }>,
  userPosition?: { lat: number; lon: number } | null,
  radiusKm?: number
};

const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

export default function Mappa({ items, userPosition, radiusKm = 0 }: Props) {
  const center = useMemo(() => {
    if (userPosition) return [userPosition.lat, userPosition.lon] as [number, number];
    if (items.length > 0 && items[0].lat && items[0].lon) return [items[0].lat, items[0].lon] as [number, number];
    return [41.8719, 12.5674] as [number, number]; // Italia
  }, [items, userPosition]);

  return (
    <MapContainer center={center} zoom={6} style={{ height: '80vh', width: '100%' }} scrollWheelZoom>
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {userPosition ? (
        <>
          <Marker position={[userPosition.lat, userPosition.lon]} icon={icon}>
            <Popup>La tua posizione</Popup>
          </Marker>
          {radiusKm > 0 ? (
            <Circle center={[userPosition.lat, userPosition.lon]} radius={radiusKm * 1000} pathOptions={{ color: 'blue', opacity: 0.3 }} />
          ) : null}
        </>
      ) : null}
      {items.filter(i => i.lat && i.lon).map((i) => (
        <Marker key={i.id} position={[i.lat, i.lon]} icon={icon}>
          <Popup>
            <div style={{ minWidth: 180 }}>
              <div style={{ fontWeight: 600 }}>{i.nome}</div>
              <div style={{ fontSize: 12, color: '#666' }}>{i.comune} ({i.provincia}) • {i.tipo}</div>
              <div style={{ fontWeight: 600 }}>{i.prezzo_attuale ?? 'n/d'}</div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}


