// One search box, grouped results: missionaries, areas/zones, categories, providers, guidance, acronyms.
// Pure functions — no React — so it can be tested on its own.
import { CATEGORIES, GUIDANCE_TERMS, TOWN_ALIASES } from './searchConfig.js';

export const norm = (s = '') =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9/ ]+/g, ' ').replace(/\s+/g, ' ').trim();

// Edit distance (with transpositions), capped for speed.
function dist(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    let rowMin = Infinity;
    for (let j = 1; j <= b.length; j++) {
      const c = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + c);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      rowMin = Math.min(rowMin, d[i][j]);
    }
    if (rowMin > max) return max + 1;
  }
  return d[a.length][b.length];
}

// Score how well query q matches text t (0 = no match, higher = better).
export function score(q, t) {
  q = norm(q); t = norm(t);
  if (!q || !t) return 0;
  if (t === q) return 100;
  if (t.startsWith(q)) return 90;
  if (t.split(' ').some(w => w.startsWith(q))) return 80;
  if (q.length >= 5 && t.includes(q)) return 70;
  // typo tolerance: compare query against each word (and the whole phrase)
  const allow = q.length <= 5 ? 1 : 2;
  // typos rarely change the first letter, so only compare words that start the same way
  const candidates = [t, ...t.split(' ')].filter(w => w[0] === q[0]);
  if (!candidates.length) return 0;
  const best = Math.min(...candidates.map(w => dist(q, w.slice(0, q.length + allow), allow)));
  if (q.length >= 4 && best <= allow) return 65 - (best - 1) * 5;
  return 0;
}

const tokensOf = q => norm(q).split(' ').filter(Boolean);

// Which categories does the query point at (by name, synonym or symptom)?
export function matchCategories(query) {
  const out = [];
  for (const [cat, def] of Object.entries(CATEGORIES)) {
    let s = score(query, cat), via = 'name';
    for (const t of def.terms) { const v = score(query, t); if (v > s) { s = v; via = t; } }
    for (const t of def.symptoms) { const v = score(query, t); if (v >= 90 && v > s) { s = v; via = `symptom: ${t}`; } }
    if (s >= 60) out.push({ category: cat, score: s, via });
  }
  return out.sort((a, b) => b.score - a.score);
}

export function matchTown(query) {
  const q = norm(query);
  return TOWN_ALIASES[q] || null;
}

/**
 * search(query, data) → grouped results.
 * data = { providers, missionaries:[{name, areaId}], areas:[{id,name,zone}], zones:[{code,name}], acronyms, policies }
 */
export function search(query, data) {
  const q = norm(query);
  if (q.length < 2) return null;
  const res = { missionaries: [], areas: [], categories: [], providers: [], guidance: [], acronyms: [] };

  for (const m of data.missionaries || []) {
    const s = Math.max(score(q, m.name), ...tokensOf(m.name).map(w => score(q, w)));
    if (s >= 60) res.missionaries.push({ ...m, score: s });
  }
  for (const a of data.areas || []) { const s = score(q, a.name); if (s >= 60) res.areas.push({ type: 'area', ...a, score: s }); }
  for (const z of data.zones || []) {
    const s = Math.max(score(q, z.name), norm(z.code) === q ? 100 : 0);
    if (s >= 60) res.areas.push({ type: 'zone', ...z, score: s });
  }

  res.categories = matchCategories(q);
  const cats = new Set(res.categories.map(c => c.category));
  const town = matchTown(q);

  for (const p of data.providers || []) {
    const s = Math.max(
      score(q, p.name), score(q, p.practitioner || ''), score(q, p.town) * 0.9,
      town && p.town === town ? 85 : 0,
      cats.has(p.category) ? 75 : 0,
    );
    if (s >= 60) res.providers.push({ ...p, score: s });
  }

  for (const [term, cat] of Object.entries(GUIDANCE_TERMS)) if (score(q, term) >= 80) res.guidance.push(cat);
  for (const c of cats) res.guidance.push(c);
  res.guidance = [...new Set(res.guidance)].map(c => ({ category: c, notes: (data.policies || []).filter(p => p.category === c) }))
    .filter(g => g.notes.length);

  for (const a of data.acronyms || []) if (norm(a.abbr) === q || score(q, a.meaning) >= 80) res.acronyms.push(a);

  for (const k of ['missionaries', 'areas', 'providers']) res[k].sort((a, b) => b.score - a.score);
  return res;
}

// Distance in km between two lat/lng points — used to sort providers by distance from an apartment.
export function km(a, b) {
  const R = 6371, rad = x => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
