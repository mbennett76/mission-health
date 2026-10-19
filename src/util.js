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

// ---------- Address → map pin (OpenStreetMap Nominatim, max 1 request per second) ----------
export async function geocode(address, town) {
  const q = [address, town, /BC|NT/.test(`${address} ${town}`) ? '' : 'Alberta', 'Canada'].filter(Boolean).join(', ');
  const r = await fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ca&q=' + encodeURIComponent(q), {
    headers: { 'Accept-Language': 'en' },
  });
  const j = await r.json();
  return j[0] ? { lat: +j[0].lat, lng: +j[0].lon } : null;
}
export const sleep = ms => new Promise(r => setTimeout(r, ms));

export async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; }
  catch {
    const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
    const ok = document.execCommand('copy'); ta.remove(); return ok;
  }
}
