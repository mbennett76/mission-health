// One place that holds all mission data and knows how to save it —
// live from Firestore normally, or in memory in preview mode.
import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, writeBatch, serverTimestamp, getDocs } from 'firebase/firestore';
import { db, PREVIEW } from './firebase.js';
import { useAuth } from './auth.jsx';

export const COLLECTIONS = ['providers', 'apartments', 'areas', 'contacts', 'policies', 'templates', 'acronyms', 'zones'];
const Ctx = createContext(null);
export const useStore = () => useContext(Ctx);

export function StoreProvider({ children }) {
  const { profile } = useAuth();
  const [data, setData] = useState(() => Object.fromEntries(COLLECTIONS.map(c => [c, []])));
  const [loaded, setLoaded] = useState(PREVIEW ? false : false);

  useEffect(() => {
    if (PREVIEW || !profile) return;
    const unsubs = COLLECTIONS.map(c =>
      onSnapshot(collection(db, c), snap => {
        setData(d => ({ ...d, [c]: snap.docs.map(x => ({ id: x.id, ...x.data() })) }));
        setLoaded(true);
      }));
    return () => unsubs.forEach(u => u());
  }, [profile]);

  const who = profile?.name || profile?.email || 'preview';

  const save = useCallback(async (coll, id, values) => {
    const stamp = { updatedBy: who, updatedAt: PREVIEW ? new Date().toISOString() : serverTimestamp() };
    if (PREVIEW) {
      setData(d => {
        const list = d[coll];
        const i = list.findIndex(x => x.id === id);
        const next = i >= 0 ? list.map(x => (x.id === id ? { ...x, ...values, ...stamp } : x)) : [...list, { id, ...values, ...stamp }];
        return { ...d, [coll]: next };
      });
      return;
    }
    await setDoc(doc(db, coll, id), { ...values, ...stamp }, { merge: true });
  }, [who]);

  const remove = useCallback(async (coll, id) => {
    if (PREVIEW) { setData(d => ({ ...d, [coll]: d[coll].filter(x => x.id !== id) })); return; }
    await deleteDoc(doc(db, coll, id));
  }, []);

  // Import a seed/backup file. mode 'add' keeps anything already there; 'replace' overwrites.
  const importData = useCallback(async (json, mode = 'add') => {
    let added = 0, skipped = 0;
    if (PREVIEW) {
      setData(d => {
        const out = { ...d };
        for (const c of COLLECTIONS) {
          const have = new Set((mode === 'add' ? d[c] : []).map(x => x.id));
          const base = mode === 'add' ? d[c] : [];
          const extra = (json[c] || []).filter(x => (have.has(x.id) ? (skipped++, false) : (added++, true)));
          out[c] = [...base, ...extra];
        }
        return out;
      });
      setLoaded(true);
      return { added, skipped };
    }
    for (const c of COLLECTIONS) {
      const existing = mode === 'add' ? new Set((await getDocs(collection(db, c))).docs.map(x => x.id)) : new Set();
      const rows = (json[c] || []).filter(x => (existing.has(x.id) ? (skipped++, false) : true));
      for (let i = 0; i < rows.length; i += 400) {
        const batch = writeBatch(db);
        rows.slice(i, i + 400).forEach(({ id, ...rest }) => { batch.set(doc(db, c, id), rest); added++; });
        await batch.commit();
      }
    }
    return { added, skipped };
  }, []);

  const exportData = useCallback(() => {
    const clean = Object.fromEntries(COLLECTIONS.map(c => [c, data[c].map(({ updatedAt, ...r }) => r)]));
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), ...clean }, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `mission-health-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  }, [data]);

  const value = useMemo(() => ({ ...data, loaded, save, remove, importData, exportData }), [data, loaded, save, remove, importData, exportData]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
