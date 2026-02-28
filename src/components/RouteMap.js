'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

function getMarkerColor(fillLevel) {
    if (fillLevel >= 85) return '#f87171';
    if (fillLevel >= 65) return '#fb923c';
    if (fillLevel >= 40) return '#fbbf24';
    return '#34d399';
}

function createIcon(fillLevel) {
    const color = getMarkerColor(fillLevel);
    return L.divIcon({
        className: 'custom-marker',
        html: `<div style="
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: ${color};
      border: 3px solid rgba(255,255,255,0.9);
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: 700;
      color: #111;
    ">${fillLevel}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
    });
}

function FitBounds({ bins }) {
    const map = useMap();
    useEffect(() => {
        if (bins.length > 0) {
            const bounds = bins.map(b => [b.lat, b.lng]);
            map.fitBounds(bounds, { padding: [40, 40] });
        }
    }, [bins, map]);
    return null;
}

export default function RouteMap({ bins }) {
    const center = bins.length > 0
        ? [bins.reduce((s, b) => s + b.lat, 0) / bins.length, bins.reduce((s, b) => s + b.lng, 0) / bins.length]
        : [28.6139, 77.2090];

    const routeCoords = bins.map(b => [b.lat, b.lng]);

    return (
        <MapContainer
            center={center}
            zoom={16}
            style={{ height: '100%', width: '100%', background: '#0a0f1a' }}
            zoomControl={true}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            <FitBounds bins={bins} />

            {/* Route line */}
            <Polyline
                positions={routeCoords}
                color="#34d399"
                weight={3}
                opacity={0.7}
                dashArray="8 6"
            />

            {/* Bin markers */}
            {bins.map((bin, i) => (
                <Marker key={bin.id} position={[bin.lat, bin.lng]} icon={createIcon(bin.fillLevel)}>
                    <Popup>
                        <div style={{
                            background: '#111827',
                            color: '#f0fdf4',
                            padding: '12px',
                            borderRadius: '8px',
                            minWidth: '160px',
                            fontFamily: 'Inter, sans-serif',
                        }}>
                            <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '6px' }}>
                                {bin.label}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
                                Stop #{i + 1} · {bin.type}
                            </div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: getMarkerColor(bin.fillLevel) }}>
                                Fill: {bin.fillLevel}%
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                                Capacity: {bin.capacity}L
                            </div>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
}
