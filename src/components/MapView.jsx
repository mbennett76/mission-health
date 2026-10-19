import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { COLORS } from '../util.js';

// Clean, light base map so the coloured pins stand out (CARTO "Positron", built on OpenStreetMap).
const TILES = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
const ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>';

const FALLBACK = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const FALLBACK_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const homeIcon = L.divIcon({ className: 'pin-home', html: '<span></span>', iconSize: [18, 18] });

export default function MapView({ providers, apartments, onProvider, onApartment, focus }) {
  const el = useRef(null);
  const map = useRef(null);
  const layer = useRef(null);
  const first = useRef(true);

  useEffect(() => {
    map.current = L.map(el.current, { zoomControl: true }).setView([53.55, -113.5], 10);
    // Try the clean light map first; if its images fail to load, switch to standard OpenStreetMap.
    let errors = 0, switched = false;
    const light = L.tileLayer(TILES, { attribution: ATTR, maxZoom: 19, subdomains: 'abcd' }).addTo(map.current);
    light.on('tileerror', () => {
      if (switched || ++errors < 3) return;
      switched = true;
      map.current.removeLayer(light);
      L.tileLayer(FALLBACK, { attribution: FALLBACK_ATTR, maxZoom: 19 }).addTo(map.current);
    });
    layer.current = L.layerGroup().addTo(map.current);
    return () => map.current.remove();
  }, []);

  useEffect(() => {
    const g = layer.current;
    g.clearLayers();
    const pts = [];
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
      L.circleMarker([p.lat, p.lng], {
        radius: 7, weight: 1.5, color: '#fff', fillColor: COLORS[p.category] || '#555',
        fillOpacity: approx ? 0.6 : 0.95, dashArray: approx ? '2' : null,
      }).bindTooltip(`${p.name} · ${p.category}`).on('click', () => onProvider(p)).addTo(g);
      pts.push([p.lat, p.lng]);
    }
    if (first.current && pts.length) { first.current = false; }
  }, [providers, apartments, onProvider, onApartment]);

  useEffect(() => {
    if (!focus || !map.current) return;
    if (focus.bounds) map.current.fitBounds(focus.bounds, { padding: [40, 40], maxZoom: 13 });
    else if (focus.lat != null) map.current.setView([focus.lat, focus.lng], focus.zoom || 13);
  }, [focus]);

  return <div ref={el} className="map" />;
}
