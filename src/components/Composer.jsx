import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../store.jsx';
import { useAuth } from '../auth.jsx';
import { fillTemplate, copyText } from '../util.js';
import { Sheet, Field } from './Common.jsx';

// Pick an area + provider + template → ready-to-paste message.
export default function Composer({ init, close }) {
  const store = useStore();
  const { profile } = useAuth();
  const [areaId, setAreaId] = useState(init.areaId || '');
  const [providerId, setProviderId] = useState(init.providerId || '');
  const templates = [...store.templates].sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  const [tid, setTid] = useState(init.templateId || (init.providerId ? templates.find(t => t.needsProvider)?.id : templates[0]?.id) || '');
  const [canadian, setCanadian] = useState(false);
  const [sign, setSign] = useState(true);
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);

  const area = store.areas.find(a => a.id === areaId);
  const provider = store.providers.find(p => p.id === providerId);
  const t = store.templates.find(x => x.id === tid);
  const signer = sign ? (profile?.signature || profile?.name || '') : '';

  const auto = useMemo(() => fillTemplate(t, { area, provider, canadian, signer }), [t, area, provider, canadian, signer]);
  useEffect(() => { setText(auto); setCopied(false); }, [auto]);

  const areas = [...store.areas].sort((a, b) => a.name.localeCompare(b.name));
  const providers = [...store.providers].filter(p => !p.hidden).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <Sheet title="Message" onClose={close} wide>
      <div className="grid2">
        <Field label="Message type"><select value={tid} onChange={e => setTid(e.target.value)}>{templates.map(x => <option key={x.id} value={x.id}>{x.title}</option>)}</select></Field>
        <Field label="Area"><select value={areaId} onChange={e => setAreaId(e.target.value)}><option value="">—</option>{areas.map(a => <option key={a.id} value={a.id}>{a.name}{a.companionship ? ` — ${a.companionship}` : ''}</option>)}</select></Field>
        {t?.needsProvider && <Field label="Provider"><select value={providerId} onChange={e => setProviderId(e.target.value)}><option value="">—</option>{providers.map(p => <option key={p.id} value={p.id}>{p.name} ({p.town})</option>)}</select></Field>}
        <div className="field">
          <label className="row gap6"><input type="checkbox" checked={canadian} onChange={e => setCanadian(e.target.checked)} /> Canadian missionary (AHC card)</label>
          <label className="row gap6"><input type="checkbox" checked={sign} onChange={e => setSign(e.target.checked)} /> Sign with my name</label>
        </div>
      </div>
      <Field label="Message — edit freely before copying"><textarea rows={14} value={text} onChange={e => { setText(e.target.value); setCopied(false); }} /></Field>
      <div className="row gap6">
        <button className="btn" onClick={async () => setCopied(await copyText(text))}>{copied ? '✓ Copied' : 'Copy message'}</button>
        <button className="btn ghost" onClick={() => setText(auto)}>Reset</button>
      </div>
    </Sheet>
  );
}
