import { useCallback, useEffect, useState } from 'react';
import { PREVIEW } from './firebase.js';
import { useAuth } from './auth.jsx';
import { useStore } from './store.jsx';
import MapScreen from './components/MapScreen.jsx';
import AreaPage from './components/AreaPage.jsx';
import ProviderSheet from './components/ProviderSheet.jsx';
import Composer from './components/Composer.jsx';
import Transfers from './components/Transfers.jsx';
import Admin from './components/Admin.jsx';
import { MessagesTab, ContactsTab, GuideTab } from './components/Tabs.jsx';
import { Login, ChangePassword } from './components/Login.jsx';

const TABS = [['map', '🗺️', 'Map'], ['messages', '💬', 'Messages'], ['contacts', '📇', 'Contacts'], ['guide', '📘', 'Guide'], ['transfers', '🔁', 'Transfers'], ['settings', '⚙️', 'Settings']];

// Simple hash routing so the phone's back button works: #map, #area/<id>, #messages …
const readHash = () => { const [v, id] = (location.hash.slice(1) || 'map').split('/'); return { view: v, id: decodeURIComponent(id || '') }; };

export default function App() {
  const { user, profile, problem, canEdit, signOut } = useAuth();
  const store = useStore();
  const [route, setRoute] = useState(readHash);
  const [provider, setProvider] = useState(null);
  const [composer, setComposer] = useState(null);

  useEffect(() => { const f = () => setRoute(readHash()); addEventListener('hashchange', f); return () => removeEventListener('hashchange', f); }, []);
  const go = useCallback((v, id) => { location.hash = id ? `${v}/${encodeURIComponent(id)}` : v; }, []);
  const openArea = useCallback(id => go('area', id), [go]);
  const openProvider = useCallback(id => setProvider(id), []);
  const openComposer = useCallback(init => setComposer(init), []);

  if (user === undefined) return <div className="login"><p className="muted">Loading…</p></div>;
  if (!user || problem || !profile) return problem || !user ? <Login /> : <div className="login"><p className="muted">Loading…</p></div>;
  if (profile.mustChangePassword) return <ChangePassword />;

  const view = route.view;
  return (
    <div className="app">
      <header className="top">
        <a className="brand" href="#map"><img src={import.meta.env.BASE_URL + 'icon.svg'} alt="" width="26" height="26" />Mission Health</a>
        <nav className="toptabs">{TABS.map(([k, i, l]) => <a key={k} href={`#${k}`} className={view === k || (k === 'map' && view === 'area') ? 'on' : ''}>{l}</a>)}</nav>
        <span className="row gap6">
          {canEdit && <button className="btn small" onClick={() => setProvider('new')}>+ Provider</button>}
          {!PREVIEW && <button className="link small" onClick={signOut}>Sign out</button>}
        </span>
      </header>
      {PREVIEW && <PreviewBar />}
      <main>
        {view === 'map' && <MapScreen openArea={openArea} openProvider={openProvider} openComposer={openComposer} />}
        {view === 'area' && <AreaPage areaId={route.id} back={() => go('map')} openArea={openArea} openProvider={openProvider} openComposer={openComposer} />}
        {view === 'messages' && <MessagesTab openComposer={openComposer} />}
        {view === 'contacts' && <ContactsTab />}
        {view === 'guide' && <GuideTab />}
        {view === 'transfers' && <Transfers />}
        {view === 'settings' && <Admin />}
      </main>
      <nav className="bottomtabs">{TABS.map(([k, i, l]) => <a key={k} href={`#${k}`} className={view === k || (k === 'map' && view === 'area') ? 'on' : ''}><span>{i}</span>{l}</a>)}</nav>
      {provider && <ProviderSheet key={provider} providerId={provider} close={() => setProvider(null)} openComposer={x => { setProvider(null); setComposer(x); }} />}
      {composer && <Composer init={composer} close={() => setComposer(null)} />}
      {!store.loaded && PREVIEW && null}
    </div>
  );
}

function PreviewBar() {
  const store = useStore();
  if (store.loaded) return <div className="previewbar">Preview mode — changes are not saved. Connect Firebase to go live.</div>;
  return (
    <div className="previewbar">
      Preview mode: choose the seed file to look around →{' '}
      <input type="file" accept=".json" aria-label="Open seed file" onChange={async e => { const f = e.target.files?.[0]; if (f) await store.importData(JSON.parse(await f.text()), 'replace'); }} />
    </div>
  );
}
