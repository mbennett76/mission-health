import { PAYMENT, COLORS, telHref, smsHref, directionsHref, fmtKm, firstPhone } from '../util.js';

export function PayBadge({ payment }) {
  const p = PAYMENT[payment] || PAYMENT.unknown;
  return <span className={`badge ${p.tone}`}>{p.label}</span>;
}

export function CatDot({ category }) {
  return <span className="dot" style={{ background: COLORS[category] || '#555' }} />;
}

export function ProviderRow({ p, onOpen, onMessage }) {
  const phone = p.phone || firstPhone(p.privateContact);
  return (
    <div className="prow">
      <button className="prow-main" onClick={() => onOpen(p)}>
        <span className="prow-name"><CatDot category={p.category} />{p.name}</span>
        <span className="muted small">
          {p.km != null && <b>{fmtKm(p.km)} · </b>}{p.address || p.town}
        </span>
        <span className="row gap6 wrap">
          <PayBadge payment={p.payment} />
          {p.fee && <span className="small muted">{p.fee}</span>}
          {p.flag && <span className="small flag">⚑ check</span>}
        </span>
      </button>
      <div className="prow-actions">
        {phone && <a className="iconbtn" href={telHref(phone)} aria-label="Call">📞</a>}
        <a className="iconbtn" href={directionsHref(p)} target="_blank" rel="noreferrer" aria-label="Directions">🧭</a>
        {onMessage && <button className="iconbtn" onClick={() => onMessage(p)} aria-label="Message">💬</button>}
      </div>
    </div>
  );
}

export function ContactLinks({ phone, email }) {
  return (
    <span className="row gap6 wrap">
      {phone && <a className="chip-link" href={telHref(phone)}>📞 {phone}</a>}
      {phone && <a className="chip-link" href={smsHref(phone)}>💬 Text</a>}
      {email && email.split(/[;,]\s*/).map(e => <a key={e} className="chip-link" href={`mailto:${e}`}>✉️ {e}</a>)}
    </span>
  );
}

export function Sheet({ title, onClose, children, wide }) {
  return (
    <div className="sheet-back" onClick={onClose}>
      <div className={`sheet ${wide ? 'wide' : ''}`} onClick={e => e.stopPropagation()} role="dialog" aria-label={title}>
        <div className="sheet-head">
          <h2>{title}</h2>
          <button className="iconbtn" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, children }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

export function Stamp({ x }) {
  if (!x?.updatedBy) return null;
  const t = x.updatedAt?.toDate ? x.updatedAt.toDate() : x.updatedAt ? new Date(x.updatedAt) : null;
  return <p className="small muted">Last edited by {x.updatedBy}{t ? `, ${t.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}` : ''}</p>;
}
