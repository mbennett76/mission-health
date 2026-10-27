// Messages, Contacts and Guide tabs.
import { useMemo, useState } from 'react';
import { useStore } from '../store.jsx';
import { useAuth } from '../auth.jsx';
import { ContactLinks, Field, Stamp } from './Common.jsx';
import { norm } from '../search/searchEngine.js';

export function MessagesTab({ openComposer }) {
  const store = useStore();
  const { canEdit } = useAuth();
  const [edit, setEdit] = useState(null);
  const list = [...store.templates].sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  const save = async () => { const { id, ...rest } = edit; await store.save('templates', id || 't' + Date.now().toString(36), rest); setEdit(null); };
  return (
    <div className="page">
      <h1>Messages</h1>
      <p className="muted">Pick a message, choose the area (and provider), then copy and paste it into a text. Words in {'{braces}'} fill in automatically.</p>
      {list.map(t => (
        <div key={t.id} className="card">
          <div className="row between"><b>{t.title}</b>
            <span className="row gap6">
              <button className="btn small" onClick={() => openComposer({ templateId: t.id })}>Use</button>
              {canEdit && <button className="btn ghost small" onClick={() => setEdit({ ...t })}>Edit</button>}
            </span>
          </div>
          <p className="small muted clamp">{t.body}</p>
        </div>
      ))}
      {canEdit && <button className="btn ghost" onClick={() => setEdit({ title: '', body: '', needsProvider: false, checklist: false, order: 50 })}>+ New message</button>}
      {edit && (
        <div className="card">
          <Field label="Title"><input value={edit.title} onChange={e => setEdit({ ...edit, title: e.target.value })} /></Field>
          <Field label="Text"><textarea rows={8} value={edit.body} onChange={e => setEdit({ ...edit, body: e.target.value })} /></Field>
          <p className="small muted">Fill-ins: {'{missionaries} {area} {provider} {address} {phone} {fee} {hours} {payment}'}</p>
          <label className="row gap6"><input type="checkbox" checked={!!edit.needsProvider} onChange={e => setEdit({ ...edit, needsProvider: e.target.checked })} /> Uses a provider</label>
          <label className="row gap6"><input type="checkbox" checked={!!edit.checklist} onChange={e => setEdit({ ...edit, checklist: e.target.checked })} /> Add the "bring your card / receipt / report back" checklist</label>
          <div className="row gap6"><button className="btn" onClick={save}>Save</button><button className="btn ghost" onClick={() => setEdit(null)}>Cancel</button>
            {edit.id && <button className="btn ghost danger" onClick={async () => { if (confirm('Delete this message?')) { await store.remove('templates', edit.id); setEdit(null); } }}>Delete</button>}</div>
        </div>
      )}
    </div>
  );
}

export function ContactsTab() {
  const store = useStore();
  const { canEdit } = useAuth();
  const [edit, setEdit] = useState(null);
  const groups = useMemo(() => {
    const g = {};
    [...store.contacts].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).forEach(c => (g[c.group || 'Other'] ||= []).push(c));
    return g;
  }, [store.contacts]);
  const save = async () => { const { id, ...rest } = edit; await store.save('contacts', id || 'c' + Date.now().toString(36), rest); setEdit(null); };
  return (
    <div className="page">
      <h1>Contacts</h1>
      <p className="note small">Medical questions: Canada area (AMA) first, before Salt Lake.</p>
      {Object.entries(groups).map(([g, list]) => (
        <section key={g}>
          <h3 className="grp">{g}</h3>
          {list.map(c => (
            <div key={c.id} className="card">
              <div className="row between"><div><b>{c.name}</b>{c.role && <span className="muted small"> · {c.role}</span>}</div>
                {canEdit && <button className="btn ghost small" onClick={() => setEdit({ ...c })}>Edit</button>}</div>
              <ContactLinks phone={c.phone} email={c.email} />
              {c.notes && <p className="small muted">{c.notes}</p>}
            </div>
          ))}
        </section>
      ))}
      {canEdit && <button className="btn ghost" onClick={() => setEdit({ group: 'Mission', name: '', role: '', phone: '', email: '', notes: '' })}>+ Add contact</button>}
      {edit && (
        <div className="card">
          {['group', 'name', 'role', 'phone', 'email'].map(k => <Field key={k} label={k[0].toUpperCase() + k.slice(1)}><input value={edit[k] || ''} onChange={e => setEdit({ ...edit, [k]: e.target.value })} /></Field>)}
          <Field label="Notes"><textarea rows={2} value={edit.notes || ''} onChange={e => setEdit({ ...edit, notes: e.target.value })} /></Field>
          <div className="row gap6"><button className="btn" onClick={save}>Save</button><button className="btn ghost" onClick={() => setEdit(null)}>Cancel</button>
            {edit.id && <button className="btn ghost danger" onClick={async () => { if (confirm('Delete this contact?')) { await store.remove('contacts', edit.id); setEdit(null); } }}>Delete</button>}</div>
        </div>
      )}
    </div>
  );
}

export function GuideTab() {
  const store = useStore();
  const { canEdit } = useAuth();
  const [q, setQ] = useState('');
  const [edit, setEdit] = useState(null);
  const acronyms = useMemo(() => store.acronyms.flatMap(x => x.list || [x]), [store.acronyms]);
  const byCat = useMemo(() => {
    const g = {};
    store.policies.forEach(p => (g[p.category] ||= []).push(p));
    const first = 'What Cowan covers';
    return g[first] ? { [first]: g[first], ...g } : g;
  }, [store.policies]);
  const nq = norm(q);
  const acr = acronyms.filter(a => !nq || norm(a.abbr).includes(nq) || norm(a.meaning).includes(nq));
  return (
    <div className="page">
      <h1>Guide</h1>
      {Object.entries(byCat).map(([c, list]) => (
        <section key={c}>
          <h3 className="grp">{c}</h3>
          {list.map(p => (
            <div key={p.id} className="note">
              {edit?.id === p.id
                ? <><textarea rows={4} value={edit.text} onChange={e => setEdit({ ...edit, text: e.target.value })} />
                  <div className="row gap6"><button className="btn small" onClick={async () => { await store.save('policies', p.id, { text: edit.text }); setEdit(null); }}>Save</button>
                    <button className="btn ghost small" onClick={() => setEdit(null)}>Cancel</button></div></>
                : <div className="row between gap6"><span>{p.text}</span>{canEdit && <button className="btn ghost small" onClick={() => setEdit({ ...p })}>Edit</button>}</div>}
            </div>
          ))}
        </section>
      ))}
      <h3 className="grp">Acronyms</h3>
      <input value={q} onChange={e => setQ(e.target.value)} placeholder="Find an acronym…" />
      <table className="acr"><tbody>{acr.map(a => <tr key={a.abbr}><td><b>{a.abbr}</b></td><td>{a.meaning}</td></tr>)}</tbody></table>
    </div>
  );
}
export { Stamp };
