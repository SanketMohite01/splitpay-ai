import { useEffect, useState } from "react";
import { CheckIcon, ClockIcon } from "./Icons";

export const money = (n) => `$${Number(n || 0).toFixed(2)}`;

const AVATAR_COLORS = ["#1f3560", "#2d5bd6", "#17824f", "#5b21b6", "#0f766e", "#9a3412", "#9f1239", "#3730a3"];

const wordChar = (w) => {
  const m = String(w).match(/\p{L}/u);
  return m ? m[0] : String(w)[0] || "";
};

export function getInitials(n = "?") {
  const words = String(n).trim().split(/\s+/).filter((w) => w && !/^\d+$/.test(w));
  if (words.length === 0) return "?";
  if (words.length === 1) {
    const c = wordChar(words[0]);
    return c ? c.toUpperCase() : "?";
  }
  const pair = wordChar(words[0]) + wordChar(words[words.length - 1]);
  return pair ? pair.toUpperCase() : "?";
}

export const initials = getInitials;

export function getAvatarColorKey(id, name) {
  if (id != null && id !== "") return String(id);
  return String(name || "").trim().toLowerCase();
}

function hashString(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function getAvatarColor(id, name) {
  const key = getAvatarColorKey(id, name);
  if (!key) return AVATAR_COLORS[0];
  return AVATAR_COLORS[hashString(key) % AVATAR_COLORS.length];
}

const AVATAR_PX = { sm: 28, md: 40, lg: 56 };

export function Avatar({ name, id, size = "md", selected = false }) {
  const px = AVATAR_PX[size] || AVATAR_PX.md;
  return (
    <span
      className={`avatar avatar-${size}${selected ? " avatar-has-check" : ""}`}
      style={{ backgroundColor: getAvatarColor(id, name), fontSize: px * 0.4 }}
      aria-hidden="true"
    >
      {getInitials(name)}
      {selected && (
        <span className="avatar-check">
          <CheckIcon s={size === "sm" ? 10 : 12} />
        </span>
      )}
    </span>
  );
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
