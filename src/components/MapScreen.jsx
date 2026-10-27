import { useMemo, useState, useCallback } from 'react';
import MapView from './MapView.jsx';
import { search } from '../search/searchEngine.js';
import { useStore } from '../store.jsx';
import { useAuth } from '../auth.jsx';
import { CATEGORY_ORDER, COLORS, splitCompanions } from '../util.js';
import { ProviderRow, CatDot } from './Common.jsx';

export default function MapScreen({ openArea, openProvider, openComposer }) {
  const store = useStore();
  const { profile } = useAuth();
  const [q, setQ] = useState('');
  const [cats, setCats] = useState(() => new Set());
  const [focus, setFocus] = useState(null);
  const [mine, setMine] = useState(true);
  const [hoverId, setHoverId] = useState(null);

  const myZones = profile?.myZones || [];
  const areaZone = useMemo(() => Object.fromEntries(store.areas.map(a => [a.id, a.zone])), [store.areas]);

  const apartments = useMemo(() => {
    if (!mine || !myZones.length) return store.apartments;
    return store.apartments.filter(ap => (ap.areaIds || []).some(id => myZones.includes(areaZone[id])));
  }, [store.apartments, mine, myZones, areaZone]);

  const missionaries = useMemo(() => store.areas.flatMap(a => splitCompanions(a.companionship).map(name => ({ name, areaId: a.id, areaName: a.name }))), [store.areas]);
  const acronyms = useMemo(() => store.acronyms.flatMap(x => x.list || [x]), [store.acronyms]);

  const res = useMemo(() => search(q, {
    providers: store.providers.filter(p => !p.hidden), missionaries, areas: store.areas, zones: store.zones,
    policies: store.policies, acronyms,
  }), [q, store, missionaries, acronyms]);

  const shownProviders = useMemo(() => {
    let list = res ? res.providers : store.providers;
    if (cats.size) list = list.filter(p => cats.has(p.category));
    return list.filter(p => !p.hidden);
  }, [res, store.providers, cats]);

  const presentCats = useMemo(() => CATEGORY_ORDER.filter(c => store.providers.some(p => p.category === c)), [store.providers]);
  const toggle = c => setCats(s => { const n = new Set(s); n.has(c) ? n.delete(c) : n.add(c); return n; });

  const onApartment = useCallback(ap => { const id = ap.areaIds?.[0]; if (id) openArea(id); }, [openArea]);
  const onProvider = useCallback(p => openProvider(p.id), [openProvider]);

  return (
    <div className="mapscreen">
      <aside className="panel">
        <div className="searchbox">
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search a missionary, area, clinic, or need (dentist, strep, x-ray…)" aria-label="Search" />
          {q && <button className="iconbtn" onClick={() => setQ('')} aria-label="Clear">✕</button>}
        </div>
        <div className="legend">
          <span className="legend-label">Legend</span>
          <div className="chips">
          {presentCats.map(c => (
            <button key={c} className={`chip ${cats.size && !cats.has(c) ? 'off' : ''} ${cats.has(c) ? 'on' : ''}`} onClick={() => toggle(c)}>
              <span className="dot" style={{ background: COLORS[c] }} />{c}
            </button>
          ))}
          {cats.size > 0 && <button className="chip" onClick={() => setCats(new Set())}>Show all</button>}
          </div>
        </div>
        {myZones.length > 0 && (
          <label className="small row gap6 pad"><input type="checkbox" checked={mine} onChange={e => setMine(e.target.checked)} /> Only my zones ({myZones.join(', ')})</label>
        )}

        <div className="results">
          {!store.loaded && <p className="pad muted">Loading…</p>}
          {res && (
            <>
              {res.missionaries.length > 0 && <Group title="Missionaries">
                {res.missionaries.slice(0, 8).map((m, i) => (
                  <button key={i} className="item" onClick={() => openArea(m.areaId)}><b>{m.name}</b><span className="muted small">{m.areaName}</span></button>
                ))}
              </Group>}
              {res.areas.length > 0 && <Group title="Areas & zones">
                {res.areas.slice(0, 8).map(a => (
                  <button key={a.id || a.code} className="item" onClick={() => a.type === 'area' ? openArea(a.id) : setQ(a.name)}>
                    <b>{a.name}</b><span className="muted small">{a.type === 'zone' ? 'Zone' : a.zone ? `${a.zone} Zone` : 'Area'}</span>
                  </button>
                ))}
              </Group>}
              {res.categories.length > 0 && <p className="pad small muted">Showing: {res.categories.map(c => c.category + (c.via.startsWith('symptom') ? ` (${c.via.replace('symptom: ', '')})` : '')).join(', ')}</p>}
              {res.townMiss && <p className="pad small flag">None in {res.townMiss} yet — showing all locations instead.</p>}
              {res.guidance.map(g => g.notes.map(n => <div key={n.id} className="note"><b>{g.category}:</b> {n.text}</div>))}
              {res.acronyms.map(a => <div key={a.abbr} className="note"><b>{a.abbr}</b> — {a.meaning}</div>)}
            </>
          )}
          <Group title={`${shownProviders.length} provider${shownProviders.length === 1 ? '' : 's'}`}>
            {shownProviders.slice(0, 150).map(p => (
              <ProviderRow key={p.id} p={p} onOpen={x => { openProvider(x.id); if (x.lat != null) setFocus({ lat: x.lat, lng: x.lng, zoom: 14 }); }}
                onMessage={x => openComposer({ providerId: x.id })} onHover={setHoverId} />
            ))}
          </Group>
        </div>
      </aside>
      <MapView providers={shownProviders} apartments={apartments} onProvider={onProvider} onApartment={onApartment} focus={focus} highlightId={hoverId} />
    </div>
  );
}

function Group({ title, children }) {
  return <section><h3 className="grp">{title}</h3>{children}</section>;
}
export { CatDot };
