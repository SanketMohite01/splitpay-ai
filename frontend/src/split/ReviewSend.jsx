import { Avatar, PayActions, money } from "../components";
import { LockIcon, CheckIcon } from "../Icons";

export function Review({ preview, myName, onSend, onBack, contactByName }) {
  const owing = preview.shares.filter((s) => s.name !== preview.paidBy);
  return (
    <div>
      <div className="card">
        <div className="muted">{preview.description}</div>
        <div className="total">{money(preview.total)}</div>
        <div className="muted">Paid by {preview.paidBy || myName}. Nothing is sent until you confirm.</div>
      </div>
      <div className="card">
        <h2>Who pays what</h2>
        {preview.shares.map((s) => {
          const c = contactByName?.(s.name);
          return (
            <div className="item" key={s.name}>
              <Avatar name={s.name} id={c?.id} size="md" />
              <div className="grow">
                <strong>{s.name}</strong>
                <div className="muted">{s.name === preview.paidBy ? "You (paid the bill)" : s.email}</div>
              </div>
              <span className="amount">{money(s.amount)}</span>
            </div>
          );
        })}
      </div>
      <div className="stack">
        <button type="button" className="btn btn-primary" onClick={onSend} disabled={owing.length === 0}>
          Confirm and send {owing.length} invoice{owing.length === 1 ? "" : "s"}
        </button>
        <div className="muted row secure"><LockIcon s={16} /> Secure payments by PayPal</div>
        <button className="btn btn-ghost" onClick={onBack}>Back and edit</button>
      </div>
    </div>
  );
}

export function Sent({ sent, onReset, contactByName }) {
  return (
    <div>
      <div className="card">
        <div className="check"><CheckIcon s={36} /></div>
        <h2 style={{ textAlign: "center" }}>Invoices sent</h2>
        <p className="muted" style={{ textAlign: "center" }}>PayPal emailed each person. Nudge them on WhatsApp too.</p>
        {sent.map((inv) => {
          const c = contactByName?.(inv.name);
          return (
            <div className="item" key={inv.invoiceId}>
              <Avatar name={inv.name} id={c?.id} size="md" />
              <div className="grow col" style={{ alignItems: "stretch", gap: 4 }}>
                <div className="row between">
                  <strong>{inv.name}</strong>
                  <span className="amount">{money(inv.amount)}</span>
                </div>
                <PayActions inv={inv} />
              </div>
            </div>
          );
        })}
      </div>
      <button type="button" className="btn btn-primary" onClick={onReset}>Start a new split</button>
    </div>
  );
}
