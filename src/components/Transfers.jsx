// Transfer day: paste the new list, review what changes, apply in one tap.
import { useMemo, useState } from 'react';
import { useStore } from '../store.jsx';
import { useAuth } from '../auth.jsx';
import { norm } from '../search/searchEngine.js';

// Accepts lines like:  "Glen Allan — Elder Smith / Elder Jones"   "Glen Allan: Elder Smith, Elder Jones"
// or tab-separated rows pasted from a spreadsheet.
export function parseTransfers(text, areas) {
  const byName = new Map(areas.map(a => [norm(a.name), a]));
  return text.split(/\r?\n/).map(l => l.trim()).filter(Boolean).map(line => {
    const m = line.match(/^(.+?)\s*(?:\t+| [—–-] |: |:\t|\s{3,})\s*(.+)$/);
    if (!m) return { line, error: 'Could not split area and names' };
    const [, rawArea, rawNames] = m;
    const names = rawNames.replace(/\t+/g, ' / ').split(/\s*(?:\/|&|,|;|\band\b)\s*/i).map(s => s.trim()).filter(Boolean).join(' / ');
    const area = byName.get(norm(rawArea)) || areas.find(a => norm(a.name).startsWith(norm(rawArea)) || norm(rawArea).startsWith(norm(a.name)));
    return { line, rawArea, names, area };
  });
}

export default function Transfers() {
  const store = useStore();
  const { canEdit } = useAuth();
  const [text, setText] = useState('');
  const [done, setDone] = useState('');
  const rows = useMemo(() => parseTransfers(text, store.areas), [text, store.areas]);
  const changes = rows.filter(r => r.area && r.names !== (r.area.companionship || ''));
  const problems = rows.filter(r => !r.area);
  const untouched = store.areas.filter(a => a.companionship && !rows.some(r => r.area?.id === a.id));

  async function apply() {
    for (const r of changes) await store.save('areas', r.area.id, { companionship: r.names });
    setDone(`Updated ${changes.length} area${changes.length === 1 ? '' : 's'}.`);
    setText('');
  }

  return (
    <div className="page">
      <h1>Transfers</h1>
      <p className="muted">Paste the new transfer list — one area per line, e.g. <code>Glen Allan — Elder Smith / Elder Jones</code>. Copying straight from an email or spreadsheet works too.</p>
      {!canEdit && <p className="note">You have view-only access.</p>}
      <textarea rows={10} value={text} onChange={e => { setText(e.target.value); setDone(''); }} placeholder={'Glen Allan — Elder Smith / Elder Jones\nNottingham — Sister Lee / Sister Ortiz'} disabled={!canEdit} />
      {done && <p className="note">✓ {done}</p>}
      {rows.length > 0 && (
        <>
          <h3 className="grp">{changes.length} change{changes.length === 1 ? '' : 's'}</h3>
          <table className="diff"><thead><tr><th>Area</th><th>Before</th><th>After</th></tr></thead><tbody>
            {changes.map((r, i) => <tr key={i}><td>{r.area.name}</td><td className="muted">{r.area.companionship || '—'}</td><td><b>{r.names}</b></td></tr>)}
          </tbody></table>
          {problems.length > 0 && <div className="note"><b>Not matched to an area ({problems.length}):</b>{problems.map((p, i) => <div key={i} className="small">{p.line}{p.error ? ` — ${p.error}` : ' — check the area name spelling'}</div>)}</div>}
          {untouched.length > 0 && <p className="small muted">Not in this list (left as is): {untouched.map(a => a.name).join(', ')}</p>}
          <button className="btn" disabled={!changes.length || !canEdit} onClick={apply}>Apply {changes.length} change{changes.length === 1 ? '' : 's'}</button>
        </>
      )}
    </div>
  );
}
