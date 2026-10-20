import { km } from './search/searchEngine.js';
export { km };

export const CATEGORY_ORDER = [
  'Walk-in clinic', 'Hospital / ER', 'Pharmacy', 'Dental', 'Physiotherapy', 'Chiropractic', 'Eye care',
  'Lab', 'Diagnostic imaging', 'Podiatry', 'Hearing', 'Counselling', 'Medical supplies', 'Medical advice', 'Mission',
];

export const COLORS = {
  'Walk-in clinic': '#c2410c', 'Hospital / ER': '#b91c1c', 'Medical advice': '#7c3aed', Physiotherapy: '#0f766e',
  Chiropractic: '#0e7490', Dental: '#2563eb', 'Eye care': '#c026d3', Pharmacy: '#15803d', Lab: '#a16207',
  'Diagnostic imaging': '#78350f', Podiatry: '#be185d', Hearing: '#4d7c0f', Counselling: '#db2777',
  'Medical supplies': '#64748b', Mission: '#111827',
};

export const PAYMENT = {
  direct_bill: { label: 'Direct bills Cowan', tone: 'good' },
  accepts_cowan: { label: 'Accepts Cowan card', tone: 'good' },
  pay_reimburse: { label: 'Pay, then reimburse', tone: 'warn' },
  free_courtesy: { label: 'Free / courtesy', tone: 'good' },
  unknown: { label: 'Unknown – ask', tone: 'muted' },
};

export const OFFICE_ADDRESS = '14010 74 St NW, Edmonton AB T5C 0Y2';

export const slug = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export const telHref = p => 'tel:' + (p || '').replace(/[^\d+]/g, '');
export const smsHref = p => 'sms:' + (p || '').replace(/[^\d+]/g, '');
export const directionsHref = p =>
  'https://www.google.com/maps/dir/?api=1&destination=' +
  encodeURIComponent(p.lat != null && p.loc === 'exact' ? `${p.lat},${p.lng}` : `${p.address || p.name}, ${p.town}`);

// Rough phone pull-out for providers whose number lives in a notes-style field ("780-555-1212 (cell)").
export const firstPhone = s => (s || '').match(/\+?1?[\s-]?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}/)?.[0] || '';

export function nearest(providers, from, category, n = 4) {
  if (!from || from.lat == null) return [];
  return providers
    .filter(p => !p.hidden && p.category === category && p.lat != null)
    .map(p => ({ ...p, km: km(from, p) }))
    .sort((a, b) => a.km - b.km)
    .slice(0, n);
}

export const fmtKm = d => (d == null ? '' : d < 1 ? `${Math.round(d * 1000)} m` : `${d < 10 ? d.toFixed(1) : Math.round(d)} km`);

// Companionship text "Elder Smith / Elder Jones" → ["Elder Smith", "Elder Jones"]
export const splitCompanions = s => (s || '').split(/\s*(?:\/|&|,|\band\b)\s*/i).map(x => x.trim()).filter(Boolean);

// ---------- Message builder ----------
export function paymentLine(p) {
  if (!p) return '';
  const fee = p.fee ? ` (usually ${p.fee})` : '';
  switch (p.payment) {
    case 'direct_bill':
    case 'accepts_cowan': return 'They accept the Cowan card, so you shouldn\'t need to pay.';
    case 'free_courtesy': return 'They usually don\'t charge missionaries, but bring payment just in case.';
    case 'pay_reimburse': return `You'll need to pay at the clinic${fee}. Bring cash or card (keep $125 CAD on hand) and get a receipt.`;
    default: return 'Ask if they accept the Cowan card. If not, pay and get a receipt.';
  }
}

export function checklist(p, canadian) {
  const lines = [
    canadian ? 'Bring your Alberta Health Care (AHC) card and photo ID.' : 'Bring your Cowan card and photo ID.',
    p ? paymentLine(p) : null,
    canadian
      ? 'On intake forms use your home address and your companionship phone. Emergency contact: President Matheson.'
      : `On intake forms use the Mission Office address (${OFFICE_ADDRESS}) and your companionship phone. Emergency contact: President Matheson.`,
    'Text a photo of any receipt to Sister Hoard.',
    'Afterwards, let me know what the doctor said, any medication (send a photo of the bottle), and any follow-up.',
  ].filter(Boolean);
  return lines.map(l => '• ' + l).join('\n');
}

export function fillTemplate(t, { area, provider, canadian, signer }) {
  const missionaries = area?.companionship || 'Elders/Sisters';
  const map = {
    missionaries,
    area: area?.name || '',
    provider: provider?.name || '[provider]',
    address: provider ? [provider.address, provider.address?.includes(provider.town) ? '' : provider.town].filter(Boolean).join(', ') : '',
    phone: provider?.phone || firstPhone(provider?.privateContact) || '',
    fee: provider?.fee || '',
    hours: provider?.hours ? `Hours: ${provider.hours}.` : '',
    payment: provider ? paymentLine(provider) : '',
    signer: signer || '',
  };
  let body = (t?.body || '').replace(/\{(\w+)\}/g, (_, k) => map[k] ?? '');
  if (t?.checklist) body += '\n\n' + checklist(provider, canadian);
  if (signer) body += `\n\n– ${signer}`;
  return body.replace(/\n{3,}/g, '\n\n').replace(/ +\./g, '.').trim();
}

// ---------- Address → map pin (free: OpenStreetMap Nominatim, then Photon; max ~1 request per second) ----------
// Strip things geocoders choke on: unit/suite numbers, "Basement", PO boxes, mall names.
export function cleanAddress(address = '') {
  let a = address.split(',').map(s => s.trim()).filter(Boolean);
  a = a.filter(part => !/^(#?\w{1,5}|suite \S+|unit \S+|basement|main floor|\d+(st|nd|rd|th) floor|po box \d+|box \d+)$/i.test(part));
  // Drop leading building/mall names when a later part is the street address.
  const streetIdx = a.findIndex(part => /^\S*\d/.test(part));
  if (streetIdx > 0) a = a.slice(streetIdx);
  let first = (a[0] || '')
    .replace(/^.*?\s-\s(?=\d)/, '')                    // "A-106 - 9120 96 Ave", "Basement - 11320 145 Ave"
    .replace(/^#?[A-Z]?\d+[A-Z]?-(?=\d)/i, '')          // "201-5043 50 St" → "5043 50 St"
    .replace(/\s+(#|suite |unit )\S+$/i, '');           // "2457 Broadmoor Blvd #100"
  return [first, ...a.slice(1)].join(', ');
}
const PROVINCE = town => (/\bBC\b/.test(town) ? 'British Columbia' : /\bNT\b|yellowknife/i.test(town) ? 'Northwest Territories' : 'Alberta');
const plainTown = town => (town || '').replace(/,?\s*(BC|NT)$/, '');

async function nominatim(q) {
  const r = await fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ca&q=' + encodeURIComponent(q), { headers: { 'Accept-Language': 'en' } });
  const j = await r.json();
  return j[0] ? { lat: +j[0].lat, lng: +j[0].lon } : null;
}
async function photon(q, near) {
  const bias = near?.lat != null ? `&lat=${near.lat}&lon=${near.lng}` : '';
  const r = await fetch('https://photon.komoot.io/api/?limit=1&q=' + encodeURIComponent(q) + bias);
  const j = await r.json();
  const f = j.features?.[0];
  return f ? { lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0] } : null;
}

// near = the current approximate pin (town centre); results farther than 40 km from it are rejected as wrong matches.
export async function geocode(address, town, near) {
  const t = plainTown(town), prov = PROVINCE(town || '');
  const street = cleanAddress(address).replace(new RegExp(',?\\s*' + t + '.*$', 'i'), '').trim();
  const tries = [];
  if (street) {
    tries.push(`${street}, ${t}, ${prov}, Canada`);
    if (t === 'Edmonton' && !/\b(NW|SW|NE|SE)\b/i.test(street)) tries.push(`${street} NW, ${t}, ${prov}, Canada`);
  }
  const ok = g => g && (!near || near.lat == null || km(near, g) < 40);
  for (const q of tries) {
    try { const g = await nominatim(q); if (ok(g)) return g; } catch { /* try next */ }
    await sleep(1100);
    try { const g = await photon(q, near); if (ok(g)) return g; } catch { /* try next */ }
  }
  return null;
}

// Read a pin from pasted text: "53.5412, -113.2958", a Google Maps link (…@53.54,-113.29…, ?q=53.54,-113.29, !3d53.54!4d-113.29).
export function parseLatLng(text = '') {
  const t = decodeURIComponent(text);
  const m = t.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/) || t.match(/@(-?\d+\.\d+),\s*(-?\d+\.\d+)/) || t.match(/(-?\d{1,2}\.\d{3,})\s*[, ]\s*(-?\d{2,3}\.\d{3,})/);
  if (!m) return null;
  const lat = +m[1], lng = +m[2];
  return lat > 40 && lat < 75 && lng < -90 && lng > -145 ? { lat, lng } : null;
}
export const googleMapsSearch = (address, town) => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent([address, plainTown(town), PROVINCE(town || '')].filter(Boolean).join(', '));
export const sleep = ms => new Promise(r => setTimeout(r, ms));

export async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; }
  catch {
    const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
    const ok = document.execCommand('copy'); ta.remove(); return ok;
  }
}
