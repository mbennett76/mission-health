import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, PREVIEW } from '../firebase.js';
import { useStore } from '../store.jsx';
import { useAuth, adminCreateUser, adminSendReset, adminUpdateUser } from '../auth.jsx';
import { Field } from './Common.jsx';
import { geocode, sleep } from '../util.js';

export default function Admin() {
  const { isAdmin, profile, updateMe } = useAuth();
  const store = useStore();
  const [users, setUsers] = useState([]);
  const [nu, setNu] = useState({ name: '', email: '', role: 'editor', tempPassword: '' });
  const [msg, setMsg] = useState('');
  const [geo, setGeo] = useState('');

  useEffect(() => {
    if (PREVIEW || !isAdmin) return;
    return onSnapshot(collection(db, 'users'), s => setUsers(s.docs.map(d => ({ uid: d.id, ...d.data() }))));
  }, [isAdmin]);

  async function add() {
    setMsg('');
    if (!nu.email || nu.tempPassword.length < 8) return setMsg('Enter an email and a temporary password of at least 8 characters.');
    try {
      await adminCreateUser(nu);
      setMsg(`Added ${nu.email}. Give them the temporary password — they'll choose their own the first time they sign in.`);
      setNu({ name: '', email: '', role: 'editor', tempPassword: '' });
    } catch (e) { setMsg('Could not add: ' + (e.code || e.message)); }
  }

  async function onImport(e) {
    const f = e.target.files?.[0]; if (!f) return;
    const mode = document.querySelector('input[name=imode]:checked')?.value || 'add';
    if (mode === 'replace' && !confirm('Replace everything with this file? Edits made in the app since will be lost.')) return;
    setMsg('Importing…');
    try { const r = await store.importData(JSON.parse(await f.text()), mode); setMsg(`Imported ${r.added} records${r.skipped ? `, kept ${r.skipped} existing` : ''}.`); }
    catch (err) { setMsg('Import failed: ' + err.message); }
    e.target.value = '';
  }

  async function findPins() {
    const todo = [
      ...store.providers.filter(p => p.address && p.loc !== 'exact').map(p => ['providers', p]),
      ...store.apartments.filter(a => a.address && a.loc !== 'exact').map(a => ['apartments', a]),
    ];
    let ok = 0, miss = [];
    for (let i = 0; i < todo.length; i++) {
      const [coll, x] = todo[i];
      setGeo(`Finding exact pins… ${i + 1} of ${todo.length}`);
      try {
        const g = await geocode(x.address.replace(/^(Basement|Suite [\w-]+|#?[\w-]+)\s*-\s*/i, ''), x.town);
        if (g) { await store.save(coll, x.id, { ...g, loc: 'exact' }); ok++; } else miss.push(x.name);
      } catch { miss.push(x.name); }
      await sleep(1100); // OpenStreetMap asks for no more than one lookup per second
    }
    setGeo(`Done: ${ok} pinned exactly.${miss.length ? ` Not found (${miss.length}): ${miss.join(', ')}` : ''}`);
  }

  return (
    <div className="page">
      <h1>Settings</h1>
      <section className="card">
        <h3>My settings</h3>
        <Field label="My name (used to sign messages)"><input defaultValue={profile?.name} onBlur={e => updateMe({ name: e.target.value })} /></Field>
        <Field label="My zones (comma separated — the map shows these first)"><input defaultValue={(profile?.myZones || []).join(', ')}
          onBlur={e => updateMe({ myZones: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} /></Field>
      </section>

      {isAdmin && <>
        <section className="card">
          <h3>People with access</h3>
          {PREVIEW && <p className="small muted">User management works once Firebase is connected.</p>}
          <table className="diff"><tbody>
            {users.map(u => (
              <tr key={u.uid}>
                <td><b>{u.name || u.email}</b><div className="small muted">{u.email}{u.mustChangePassword ? ' · hasn\'t signed in yet' : ''}</div></td>
                <td><select value={u.role} disabled={u.email === profile.email} onChange={e => adminUpdateUser(u.uid, { role: e.target.value })}>
                  <option value="admin">Admin</option><option value="editor">Can edit</option><option value="viewer">View only</option></select></td>
                <td className="row gap6 wrap">
                  <button className="btn ghost small" onClick={async () => { await adminSendReset(u.email); setMsg(`Password reset email sent to ${u.email}. Ask them to check junk mail.`); }}>Send reset</button>
                  {u.email !== profile.email && <button className="btn ghost small" onClick={() => adminUpdateUser(u.uid, { active: !u.active })}>{u.active ? 'Remove access' : 'Restore access'}</button>}
                </td>
              </tr>
            ))}
          </tbody></table>
          <h4>Add a person</h4>
          <div className="grid2">
            <Field label="Name"><input value={nu.name} onChange={e => setNu({ ...nu, name: e.target.value })} placeholder="Sister Bondy" /></Field>
            <Field label="Church email"><input value={nu.email} onChange={e => setNu({ ...nu, email: e.target.value })} type="email" /></Field>
            <Field label="Access"><select value={nu.role} onChange={e => setNu({ ...nu, role: e.target.value })}><option value="editor">Can edit</option><option value="viewer">View only</option><option value="admin">Admin</option></select></Field>
            <Field label="Temporary password"><input value={nu.tempPassword} onChange={e => setNu({ ...nu, tempPassword: e.target.value })} /></Field>
          </div>
          <button className="btn" onClick={add} disabled={PREVIEW}>Add person</button>
        </section>

        <section className="card">
          <h3>Data</h3>
          <p className="small">Load the seed file (or a backup). "Add new only" keeps everything already in the app.</p>
          <label className="row gap6 small"><input type="radio" name="imode" value="add" defaultChecked /> Add new only</label>
          <label className="row gap6 small"><input type="radio" name="imode" value="replace" /> Replace all</label>
          <input type="file" accept=".json,application/json" onChange={onImport} aria-label="Import data file" />
          <div className="row gap6 wrap">
            <button className="btn ghost" onClick={store.exportData}>Download backup</button>
            <button className="btn ghost" onClick={findPins} disabled={!!geo && geo.startsWith('Finding')}>Find exact map pins</button>
          </div>
          {geo && <p className="small">{geo}</p>}
        </section>
      </>}
      {msg && <p className="note">{msg}</p>}
    </div>
  );
}
