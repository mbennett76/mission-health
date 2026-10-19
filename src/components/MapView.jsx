import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { COLORS } from '../util.js';

// Free OpenStreetMap base map (no key needed). Colours are softened in styles.css so the pins stand out.
const TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const homeIcon = L.divIcon({ className: 'pin-home', html: '<span></span>', iconSize: [18, 18] });

export default function MapView({ providers, apartments, onProvider, onApartment, focus, highlightId }) {
  const el = useRef(null);
  const map = useRef(null);
  const layer = useRef(null);
  const first = useRef(true);
  const markers = useRef({}); // provider id → { pin, style }
  const glow = useRef(null);

  useEffect(() => {
    map.current = L.map(el.current, { zoomControl: true }).setView([53.55, -113.5], 10);
    L.tileLayer(TILES, { attribution: ATTR, maxZoom: 19, className: 'soft-tiles' }).addTo(map.current);
    layer.current = L.layerGroup().addTo(map.current);
    return () => map.current.remove();
  }, []);

  useEffect(() => {
    const g = layer.current;
    g.clearLayers();
    const pts = [];
    markers.current = {};
    for (const a of apartments) {
      if (a.lat == null || a.kind === 'office') continue;
      L.marker([a.lat, a.lng], { icon: homeIcon, zIndexOffset: 500 })
        .bindTooltip((a.areas || []).join(', ') || a.name)
        .on('click', () => onApartment(a))
        .addTo(g);
      pts.push([a.lat, a.lng]);
    }
    for (const p of providers) {
      if (p.lat == null || p.hidden) continue;
      const approx = p.loc !== 'exact';
      const style = {
        radius: 7, weight: 1.5, color: '#fff', fillColor: COLORS[p.category] || '#555',
        fillOpacity: approx ? 0.6 : 0.95, dashArray: approx ? '2' : null,
      };
      const pin = L.circleMarker([p.lat, p.lng], style).bindTooltip(`${p.name} · ${p.category}`).on('click', () => onProvider(p)).addTo(g);
      markers.current[p.id] = { pin, style };
      pts.push([p.lat, p.lng]);
    }
    if (first.current && pts.length) { first.current = false; }
  }, [providers, apartments, onProvider, onApartment]);

  // Hovering a provider in the list makes its pin grow and glow.
  useEffect(() => {
    const m = markers.current[highlightId];
    if (glow.current) { glow.current.remove(); glow.current = null; }
    Object.values(markers.current).forEach(({ pin, style }) => pin.setStyle(style).setRadius(style.radius));
    if (!m) return;
    const color = m.style.fillColor;
    glow.current = L.circleMarker(m.pin.getLatLng(), { radius: 20, weight: 0, fillColor: color, fillOpacity: 0.3, interactive: false, className: 'pin-glow' }).addTo(map.current);
    m.pin.setStyle({ fillOpacity: 1, weight: 3, color: '#fff', dashArray: null }).setRadius(11).bringToFront();
  }, [highlightId, providers]);

  useEffect(() => {
    if (!focus || !map.current) return;
    if (focus.bounds) map.current.fitBounds(focus.bounds, { padding: [40, 40], maxZoom: 13 });
    else if (focus.lat != null) map.current.setView([focus.lat, focus.lng], focus.zoom || 13);
  }, [focus]);

  return <div ref={el} className="map" />;
}
