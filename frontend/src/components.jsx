import { useEffect, useState } from "react";
import { CheckIcon, ClockIcon } from "./Icons";

export const money = (n) => `$${Number(n || 0).toFixed(2)}`;
export const initials = (n = "?") =>
  String(n).trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";

export function Avatar({ name, size = 40 }) {
  return <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.4 }}>{initials(name)}</div>;
}
export function Badge({ paid }) {
  return paid
    ? <span className="badge paid"><CheckIcon s={14} /> Paid</span>
    : <span className="badge wait"><ClockIcon s={14} /> Waiting</span>;
}
export const Skeleton = ({ n = 3 }) => Array.from({ length: n }, (_, i) => <div className="skel" key={i} />);

export function Sheet({ title, onClose, children }) {
  return (
    <div className="sheetbg" onClick={onClose}>
      <div className="sheet" role="dialog" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>{children}
      </div>
    </div>
  );
}
export function Confirm({ text, action, onYes, onNo }) {
  return (
    <Sheet title="Are you sure?" onClose={onNo}>
      <p className="muted">{text}</p>
      <div className="row"><button className="btn btn-ghost" onClick={onNo}>Cancel</button><button className="btn btn-danger" onClick={onYes}>{action}</button></div>
    </Sheet>
  );
}

export function Loading({ text = "Working..." }) {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setSlow(true), 6000);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="loading">
      <div className="spinner" />
      <div>{text}</div>
      {slow && <div className="muted">Waking up the server. The first request can take up to a minute.</div>}
    </div>
  );
}

// WhatsApp, SMS and copy buttons for one invoice
export function PayActions({ inv }) {
  const [copied, setCopied] = useState(false);
  if (!inv.whatsappLink && !inv.smsLink && !inv.payUrl) return null;
  const text = inv.message || inv.payUrl;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this message:", text);
    }
  };
  return (
    <div className="row wrap pay-actions">
      {inv.whatsappLink && <a className="btn btn-wa btn-sm" href={inv.whatsappLink} target="_blank" rel="noreferrer">WhatsApp</a>}
      {inv.smsLink && <a className="btn btn-secondary btn-sm" href={inv.smsLink}>SMS</a>}
      <button type="button" className="btn btn-ghost btn-sm" onClick={copy}>{copied ? "Copied" : "Copy message"}</button>
    </div>
  );
}
