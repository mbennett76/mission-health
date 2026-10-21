import { useState } from 'react';
import { useStore } from '../store.jsx';
import { useAuth } from '../auth.jsx';
import { CATEGORY_ORDER, PAYMENT, directionsHref, geocode, firstPhone, parseLatLng, googleMapsSearch } from '../util.js';
import { Sheet, PayBadge, ContactLinks, Field, Stamp } from './Common.jsx';

const BLANK = { cowanListed: false, name: '', category: 'Walk-in clinic', town: '', address: '', phone: '', privateContact: '', email: '', practitioner: '',
  payment: 'unknown', fee: '', hours: '', notes: '', member: '', flag: '', hidden: false };

export default function ProviderSheet({ providerId, close, openComposer }) {
  const store = useStore();
  const { canEdit } = useAuth();
  const isNew = providerId === 'new';
  const p = isNew ? BLANK : store.providers.find(x => x.id === providerId);
  const [edit, setEdit] = useState(isNew);
  const [f, setF] = useState(p || BLANK);
  const [busy, setBusy] = useState('');
  if (!p) return null;

  const set = k => e => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  async function save() {
    if (!f.name.trim()) return setBusy('A name is needed.');
    setBusy('Saving…');
    const id = isNew ? 'p' + Date.now().toString(36) : p.id;
    const values = { ...f };
    delete values.id; delete values.km; delete values.score;
    const pasted = parseLatLng(values.pin || '');
    delete values.pin;
    if (pasted) Object.assign(values, pasted, { loc: 'exact' });
    // New or changed address → find the exact map pin.
    else if (values.address && (isNew || values.address !== p.address || values.town !== p.town || p.loc !== 'exact')) {
      try {
        const g = await geocode(values.address, values.town, p.lat != null ? p : null);
        if (g) Object.assign(values, g, { loc: 'exact' });
        else setBusy('Saved, but the address could not be found on the map — check it.');
      } catch { /* offline: keep old pin */ }
    }
    await store.save('providers', id, values);
    setBusy('');
    if (isNew) close(); else setEdit(false);
  }

  async function hide() {
    await store.save('providers', p.id, { hidden: !p.hidden });
    close();
  }

  if (edit) return (
    <Sheet title={isNew ? 'Add provider' : `Edit ${p.name}`} onClose={close} wide>
      <div className="grid2">
        <Field label="Name"><input value={f.name} onChange={set('name')} /></Field>
        <Field label="Category"><select value={f.category} onChange={set('category')}>{CATEGORY_ORDER.map(c => <option key={c}>{c}</option>)}</select></Field>
        <Field label="Practitioner"><input value={f.practitioner} onChange={set('practitioner')} /></Field>
        <Field label="Town"><input value={f.town} onChange={set('town')} /></Field>
        <Field label="Street address"><input value={f.address} onChange={set('address')} placeholder="123 Main St, Town" /></Field>
        <Field label="Office phone"><input value={f.phone} onChange={set('phone')} inputMode="tel" /></Field>
        <Field label="Personal / cell (advisors only)"><input value={f.privateContact} onChange={set('privateContact')} /></Field>
        <Field label="Email"><input value={f.email} onChange={set('email')} /></Field>
        <Field label="Payment"><select value={f.payment} onChange={set('payment')}>{Object.entries(PAYMENT).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></Field>
        <Field label="Usual fee"><input value={f.fee} onChange={set('fee')} placeholder="$100 cash" /></Field>
        <Field label="Hours"><input value={f.hours} onChange={set('hours')} /></Field>
        <Field label="In Cowan network?"><select value={f.cowanListed ? 'Y' : ''} onChange={e => setF({ ...f, cowanListed: e.target.value === 'Y' })}><option value="">—</option><option value="Y">Yes</option></select></Field>
        <Field label="Church member?"><select value={f.member} onChange={set('member')}><option value="">—</option><option value="Y">Yes</option><option value="N">No</option></select></Field>
      </div>
      <Field label="Notes"><textarea rows={4} value={f.notes} onChange={set('notes')} /></Field>
      <Field label="Map pin — optional: paste coordinates or a Google Maps link to place it exactly">
        <span className="row gap6"><input value={f.pin || ''} onChange={set('pin')} placeholder="53.5412, -113.2958" />
          <a className="btn ghost small" href={googleMapsSearch(f.address, f.town)} target="_blank" rel="noreferrer">Google Maps</a></span>
      </Field>
      <Field label="Needs checking (leave blank when confirmed)"><input value={f.flag} onChange={set('flag')} /></Field>
      {busy && <p className="small">{busy}</p>}
      <div className="row gap6"><button className="btn" onClick={save}>Save</button>
        <button className="btn ghost" onClick={() => (isNew ? close() : setEdit(false))}>Cancel</button></div>
    </Sheet>
  );

  const phone = p.phone || firstPhone(p.privateContact);
  return (
    <Sheet title={p.name} onClose={close}>
      <div className="row between gap6">
        <p className="muted" style={{ margin: 0 }}>{p.category}{p.practitioner ? ` · ${p.practitioner}` : ''}</p>
        {canEdit
          ? <button className={`star ${p.favourite ? 'on' : ''}`} onClick={() => store.save('providers', p.id, { favourite: !p.favourite })}
              aria-label={p.favourite ? 'Remove favourite' : 'Mark as favourite'} aria-pressed={!!p.favourite}>{p.favourite ? '★' : '☆'}</button>
          : p.favourite && <span className="star on" aria-label="Favourite">★</span>}
      </div>
      <p>{p.address || p.town}</p>
      <div className="row gap6 wrap"><PayBadge payment={p.payment} />{p.fee && <span>{p.fee}</span>}{p.member === 'Y' && <span className="badge muted">Member</span>}{p.cowanListed && <span className="badge cowan">Cowan network</span>}</div>
      {p.source && <p className="small muted">Source: {p.source}</p>}
      {p.hours && <p className="small">🕘 {p.hours}</p>}
      <ContactLinks phone={p.phone} email={p.email} />
      {p.privateContact && <p className="small">Personal / cell: {p.privateContact}</p>}
      {p.notes && <p className="note">{p.notes}</p>}
      {p.flag && <p className="flag small">⚑ {p.flag}</p>}
      {p.hidden && <p className="flag small">Hidden from lists</p>}
      <div className="row gap6 wrap">
        <a className="btn" href={directionsHref(p)} target="_blank" rel="noreferrer">🧭 Directions</a>
        {phone && <a className="btn ghost" href={`tel:${phone.replace(/[^\d+]/g, '')}`}>📞 Call</a>}
        <button className="btn ghost" onClick={() => openComposer({ providerId: p.id })}>💬 Message</button>
        {canEdit && <button className="btn ghost" onClick={() => { setF({ ...BLANK, ...p }); setEdit(true); }}>Edit</button>}
        {canEdit && <button className="btn ghost" onClick={hide}>{p.hidden ? 'Unhide' : 'Hide'}</button>}
      </div>
      {p.loc !== 'exact' && <p className="small muted">Map pin is approximate ({p.loc || 'unknown'}).</p>}
      <Stamp x={p} />
    </Sheet>
  );
}
