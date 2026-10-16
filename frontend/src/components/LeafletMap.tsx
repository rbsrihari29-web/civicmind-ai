import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

interface MapIncident {
  id: number;
  title: string;
  category: string;
  severity: string;
  status: string;
  latitude: number;
  longitude: number;
  address?: string;
}

interface LeafletMapProps {
  incidents?: MapIncident[];
  center?: [number, number];
  zoom?: number;
  selectable?: boolean;
  onSelectLocation?: (lat: number, lng: number) => void;
  selectedLocation?: [number, number] | null;
  className?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  pothole_road_damage: '#f59e0b',       // Amber
  garbage_accumulation: '#10b981',      // Emerald
  waterlogging_flooding: '#0284c7',     // Sky Blue
  damaged_infrastructure: '#8b5cf6',    // Violet
  fallen_tree_obstruction: '#059669',   // Forest green
  other_uncertain: '#64748b',           // Slate
};

const SEVERITY_COLORS: Record<string, string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#10b981',
  unknown: '#94a3b8',
};

export const LeafletMap: React.FC<LeafletMapProps> = ({
  incidents = [],
  center = [13.0827, 80.2707], // Chennai Center coordinates
  zoom = 12,
  selectable = false,
  onSelectLocation,
  selectedLocation,
  className = 'h-96'
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const selectMarkerRef = useRef<L.Marker | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: center,
      zoom: zoom,
      scrollWheelZoom: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;
    mapInstanceRef.current = map;

    if (selectable && onSelectLocation) {
      map.on('click', (e: L.LeafletMouseEvent) => {
        onSelectLocation(e.latlng.lat, e.latlng.lng);
      });
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update selected pin
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectable) return;

    if (selectMarkerRef.current) {
      map.removeLayer(selectMarkerRef.current);
      selectMarkerRef.current = null;
    }

    if (selectedLocation) {
      const pinIcon = L.divIcon({
        className: 'custom-pin-icon',
        html: `
          <div style="background-color: #2563eb; width: 28px; height: 28px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
      });

      const marker = L.marker(selectedLocation, { icon: pinIcon }).addTo(map);
      marker.bindPopup('<b>Selected Grievance Location</b><br>Click anywhere on the map to relocate pin.').openPopup();
      selectMarkerRef.current = marker;
      map.panTo(selectedLocation);
    }
  }, [selectedLocation, selectable]);

  // Update incident markers
  useEffect(() => {
    const layer = markersLayerRef.current;
    const map = mapInstanceRef.current;
    if (!layer || !map) return;

    layer.clearLayers();

    incidents.forEach((inc) => {
      if (inc.latitude == null || inc.longitude == null) return;

      const catColor = CATEGORY_COLORS[inc.category] || '#3b82f6';
      const sevColor = SEVERITY_COLORS[inc.severity] || '#64748b';

      const circle = L.circleMarker([inc.latitude, inc.longitude], {
        radius: 9,
        fillColor: catColor,
        color: sevColor,
        weight: 3,
        opacity: 0.9,
        fillOpacity: 0.85,
      });

      const popupContent = `
        <div style="font-family: system-ui, sans-serif; font-size: 13px; line-height: 1.4; min-width: 180px;">
          <div style="font-weight: 700; color: #0f172a; margin-bottom: 4px;">${inc.title}</div>
          <div style="display: flex; gap: 4px; margin-bottom: 6px;">
            <span style="font-size: 10px; font-weight: 600; text-transform: uppercase; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; color: #334155;">
              ${inc.category.replace(/_/g, ' ')}
            </span>
            <span style="font-size: 10px; font-weight: 600; text-transform: uppercase; background: ${sevColor}20; color: ${sevColor}; padding: 2px 6px; border-radius: 4px; border: 1px solid ${sevColor}40;">
              ${inc.severity}
            </span>
          </div>
          <div style="color: #64748b; font-size: 11px; margin-bottom: 8px;">
            ${inc.address || 'Chennai Municipal Area'}
          </div>
          <a href="/incident/${inc.id}" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; font-size: 11px; font-weight: 600; padding: 4px 8px; border-radius: 4px;">
            View Incident Details &rarr;
          </a>
        </div>
      `;

      circle.bindPopup(popupContent);
      layer.addLayer(circle);
    });
  }, [incidents]);

  return (
    <div className={`relative w-full rounded-xl overflow-hidden border border-slate-200 shadow-sm ${className}`}>
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};
