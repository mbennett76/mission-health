import { useMemo, useState } from 'react';
import { useStore } from '../store.jsx';
import { useAuth } from '../auth.jsx';
import { CATEGORY_ORDER, nearest } from '../util.js';
import { ProviderRow, Field, Stamp } from './Common.jsx';

const MAX_KM = 150; // farther than this isn't useful to suggest
const MAIN = ['Walk-in clinic', 'Hospital / ER', 'Pharmacy', 'Dental', 'Physiotherapy', 'Chiropractic', 'Eye care', 'Podiatry', 'Hearing', 'Medical advice'];

export default function AreaPage({ areaId, back, openProvider, openComposer, openArea }) {
  const store = useStore();
  const { canEdit } = useAuth();
  const area = store.areas.find(a => a.id === areaId);
  const apt = store.apartments.find(a => a.id === area?.apartmentId);
  const [tab, setTab] = useState('All');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});

  const sharing = useMemo(() => (apt?.areaIds || []).filter(id => id !== areaId).map(id => store.areas.find(a => a.id === id)).filter(Boolean), [apt, areaId, store.areas]);
  const cats = CATEGORY_ORDER.filter(c => MAIN.includes(c));
  const lists = useMemo(() => Object.fromEntries(cats.map(c => [c, nearest(store.providers, apt, c, tab === 'All' ? 3 : 8).filter(p => p.km <= MAX_KM)])), [store.providers, apt, tab]);
  const chainPharmacies = store.providers.filter(p => p.category === 'Pharmacy' && p.lat == null && !p.hidden);

  if (!area) return <div className="page"><button className="link" onClick={back}>← Back</button><p>Area not found.</p></div>;

  const startEdit = () => { setForm({ companionship: area.companionship || '', zone: area.zone || '', coveredBy: area.coveredBy || '', notes: area.notes || '' }); setEditing(true); };
  const saveEdit = async () => { await store.save('areas', area.id, form); setEditing(false); };
  const shown = tab === 'All' ? cats : [tab];

  return (
    <div className="page">
      <button className="link" onClick={back}>← Map</button>
      <header className="areahead">
        <h1>{area.name}</h1>
        <p className="big">{area.companionship || <span className="muted">Companionship not set — add it on the Transfers tab</span>}</p>
        <p className="muted small">
          {[area.zone && `${area.zone} Zone`, area.coveredBy && `Covered by ${area.coveredBy}`].filter(Boolean).join(' · ')}
        </p>
        {apt && <p className="small">🏠 {apt.address}, {apt.town}{apt.loc !== 'exact' && <span className="muted"> (pin approximate)</span>}</p>}
        {sharing.length > 0 && <p className="small muted">Same apartment: {sharing.map((s, i) => <span key={s.id}>{i ? ', ' : ''}<button className="link" onClick={() => openArea(s.id)}>{s.name}</button></span>)}</p>}
        {area.notes && <p className="note">{area.notes}</p>}
        <div className="row gap6 wrap">
          <button className="btn" onClick={() => openComposer({ areaId: area.id })}>💬 Message this companionship</button>
          {canEdit && <button className="btn ghost" onClick={startEdit}>Edit area</button>}
        </div>
        <Stamp x={area} />
      </header>

      {editing && (
        <div className="card">
          <Field label="Companionship"><input value={form.companionship} onChange={e => setForm({ ...form, companionship: e.target.value })} placeholder="Elder Smith / Elder Jones" /></Field>
          <Field label="Zone"><input value={form.zone} onChange={e => setForm({ ...form, zone: e.target.value })} list="zones" /></Field>
          <datalist id="zones">{store.zones.map(z => <option key={z.id} value={z.name} />)}</datalist>
          <Field label="Covered by"><select value={form.coveredBy} onChange={e => setForm({ ...form, coveredBy: e.target.value })}>
            <option value="">—</option><option>Sister Bennett</option><option>Elder & Sister Bondy</option></select></Field>
          <Field label="Notes"><textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></Field>
          <div className="row gap6"><button className="btn" onClick={saveEdit}>Save</button><button className="btn ghost" onClick={() => setEditing(false)}>Cancel</button></div>
        </div>
      )}

      <div className="tabs scroll">
        {['All', ...cats].map(c => <button key={c} className={`tab ${tab === c ? 'on' : ''}`} onClick={() => setTab(c)}>{c}</button>)}
      </div>

      {!apt?.lat && <p className="note">This area has no apartment location yet, so distances can't be shown.</p>}
      {shown.map(c => {
        const policy = store.policies.filter(p => p.category === c);
        const list = lists[c] || [];
        if (tab === 'All' && !list.length && c !== 'Pharmacy') return null;
        return (
          <section key={c}>
            <h3 className="grp">{c}</h3>
            {policy.map(p => <div key={p.id} className="note small">{p.text}</div>)}
            {list.map(p => <ProviderRow key={p.id} p={p} onOpen={x => openProvider(x.id)} onMessage={x => openComposer({ areaId: area.id, providerId: x.id })} />)}
            {c === 'Pharmacy' && chainPharmacies.length > 0 && (
              <p className="small muted pad">Also: {chainPharmacies.map(p => p.name).join(', ')} — any location. Shoppers, Rexall and Walmart accept the Cowan card.</p>
            )}
            {!list.length && c !== 'Pharmacy' && <p className="small muted pad">None listed within {MAX_KM} km yet.</p>}
          </section>
        );
      })}
    </div>
  );
}
