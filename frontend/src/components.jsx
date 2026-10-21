import { useEffect, useState } from "react";

export const money = (n) => `$${Number(n || 0).toFixed(2)}`;

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
      {slow && (
        <div className="muted">
          Waking up the server. The first request can take up to a minute.
        </div>
      )}
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
      {inv.whatsappLink && (
        <a className="btn btn-wa btn-sm" href={inv.whatsappLink} target="_blank" rel="noreferrer">
          WhatsApp
        </a>
      )}
      {inv.smsLink && (
        <a className="btn btn-secondary btn-sm" href={inv.smsLink}>
          SMS
        </a>
      )}
      <button type="button" className="btn btn-ghost btn-sm" onClick={copy}>
        {copied ? "Copied" : "Copy message"}
      </button>
    </div>
  );
}
