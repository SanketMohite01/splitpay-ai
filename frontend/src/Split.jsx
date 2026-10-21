import { useEffect, useMemo, useState } from "react";
import {
  aiSplit, manualSplit, scanReceipt, splitByItems, sendInvoices, resizeImage,
} from "./api";
import { Loading, PayActions, money } from "./components";

const MODES = [
  { id: "ai", label: "Describe" },
  { id: "manual", label: "Manual" },
  { id: "receipt", label: "Receipt" },
];

export default function Split({ contacts, notify }) {
  const [me, setMe] = useState(() => localStorage.getItem("me") || "Me");
  const [mode, setMode] = useState("ai");
  const [selected, setSelected] = useState([]); // contact ids
  const [message, setMessage] = useState("");
  const [description, setDescription] = useState("");
  const [amounts, setAmounts] = useState({}); // contact id -> amount text
  const [receipt, setReceipt] = useState(null); // { merchant, items, tax, tip }
  const [assign, setAssign] = useState({}); // item index -> [names]
  const [preview, setPreview] = useState(null);
  const [sent, setSent] = useState(null);
  const [busy, setBusy] = useState(""); // loading text, "" means idle

  useEffect(() => {
    localStorage.setItem("me", me);
  }, [me]);

  const chosen = useMemo(
    () => contacts.filter((c) => selected.includes(c.id)),
    [contacts, selected]
  );
  const myName = me.trim() || "Me";
  const people = [
    { name: myName },
    ...chosen.map(({ name, email, phone }) => ({ name, email, phone })),
  ];
  const allNames = people.map((p) => p.name);

  const toggle = (id) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const toggleAssign = (i, name) =>
    setAssign((a) => {
      const cur = a[i] || [];
      return { ...a, [i]: cur.includes(name) ? cur.filter((n) => n !== name) : [...cur, name] };
    });

  const run = async (label, fn) => {
    setBusy(label);
    try {
      await fn();
    } catch (e) {
      notify(e.message, "error");
    } finally {
      setBusy("");
    }
  };

  const reset = () => {
    setPreview(null);
    setSent(null);
    setMessage("");
    setDescription("");
    setAmounts({});
    setReceipt(null);
    setAssign({});
  };

  // ---- 1) AI: describe the expense ----
  const doAi = () => {
    if (!message.trim()) return notify("Describe the expense first", "error");
    if (chosen.length === 0) return notify("Pick at least one person", "error");
    run("Splitting with AI...", async () => {
      const text = `${message.trim()}\n(The person writing this message is ${myName}.)`;
      const res = await aiSplit(text, people);
      setPreview({ ...res, paidBy: myName }); // the app assumes you paid
    });
  };

  // ---- 2) Manual: type an amount for each person ----
  const doManual = () => {
    const shares = chosen.map((c) => ({
      name: c.name, email: c.email, phone: c.phone, amount: Number(amounts[c.id]),
    }));
    if (!description.trim()) return notify("Add a short description", "error");
    if (shares.length === 0) return notify("Pick at least one person", "error");
    if (shares.some((s) => !(s.amount > 0))) {
      return notify("Enter an amount for everyone you picked", "error");
    }
    run("Preparing preview...", async () => {
      setPreview(await manualSplit({ description: description.trim(), paidBy: myName, shares }));
    });
  };

  // ---- 3) Receipt: scan, assign items, split ----
  const onFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    run("Reading your receipt...", async () => {
      const img = await resizeImage(file);
      const r = await scanReceipt(img.imageBase64, img.mimeType);
      setReceipt({
        merchant: r.merchant || "Receipt",
        items: r.items || [],
        tax: r.tax || 0,
        tip: r.tip || 0,
      });
      setAssign({});
    });
  };

  const doReceipt = () => {
    if (chosen.length === 0) return notify("Pick at least one person", "error");
    const items = receipt.items.map((it, i) => ({ ...it, assignedTo: assign[i] || [] }));
    if (items.some((it) => it.assignedTo.length === 0)) {
      return notify("Assign every item to at least one person", "error");
    }
    run("Calculating the split...", async () => {
      setPreview(
        await splitByItems({
          description: receipt.merchant,
          paidBy: myName,
          items,
          tax: Number(receipt.tax) || 0,
          tip: Number(receipt.tip) || 0,
          people,
        })
      );
    });
  };

  // ---- Confirm and send ----
  const doSend = () =>
    run("Sending PayPal invoices...", async () => {
      setSent(await sendInvoices(preview));
      notify("Invoices sent");
    });

  // ================= Screens =================
  if (busy) return <Loading text={busy} />;

  if (sent) {
    return (
      <div>
        <div className="card">
          <h2>Invoices sent</h2>
          <p className="muted">PayPal emailed each person. Nudge them on WhatsApp too.</p>
          {sent.map((inv) => (
            <div className="item col" key={inv.invoiceId}>
              <div className="row between">
                <strong>{inv.name}</strong>
                <span className="amount">{money(inv.amount)}</span>
              </div>
              <PayActions inv={inv} />
            </div>
          ))}
        </div>
        <button className="btn btn-primary" onClick={reset}>Start a new split</button>
      </div>
    );
  }

  if (preview) {
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
          {preview.shares.map((s) => (
            <div className="item" key={s.name}>
              <div className="avatar">{s.name[0]?.toUpperCase()}</div>
              <div className="grow">
                <strong>{s.name}</strong>
                <div className="muted">
                  {s.name === preview.paidBy ? "You (paid the bill)" : s.email}
                </div>
              </div>
              <span className="amount">{money(s.amount)}</span>
            </div>
          ))}
        </div>
        <div className="stack">
          <button className="btn btn-primary" onClick={doSend} disabled={owing.length === 0}>
            Confirm and send {owing.length} invoice{owing.length === 1 ? "" : "s"}
          </button>
          <button className="btn btn-ghost" onClick={() => setPreview(null)}>Back and edit</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="card">
        <label className="label">Your name (you paid the bill)</label>
        <input className="input" value={me} onChange={(e) => setMe(e.target.value)} />
      </div>

      <div className="card">
        <h2>Who is splitting?</h2>
        {contacts.length === 0 ? (
          <div className="empty">Add friends in the Contacts tab first.</div>
        ) : (
          <div className="chips">
            {contacts.map((c) => (
              <button type="button" key={c.id}
                className={"chip" + (selected.includes(c.id) ? " active" : "")}
                onClick={() => toggle(c.id)}>
                {c.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="segmented">
        {MODES.map((m) => (
          <button key={m.id} className={mode === m.id ? "active" : ""} onClick={() => setMode(m.id)}>
            {m.label}
          </button>
        ))}
      </div>

      {mode === "ai" && (
        <div className="card stack">
          <div>
            <label className="label">Describe the expense</label>
            <textarea className="input" value={message} onChange={(e) => setMessage(e.target.value)}
              placeholder="Dinner was $120. Rahul had drinks so he owes more." />
          </div>
          <div className="muted">The AI works out a fair split. It assumes you paid.</div>
          <button className="btn btn-primary" onClick={doAi}>Split with AI</button>
        </div>
      )}

      {mode === "manual" && (
        <div className="card stack">
          <div>
            <label className="label">What is it for?</label>
            <input className="input" value={description}
              onChange={(e) => setDescription(e.target.value)} placeholder="Trip cab" />
          </div>
          {chosen.length === 0 ? (
            <div className="empty">Pick people above.</div>
          ) : (
            chosen.map((c) => (
              <div className="row" key={c.id}>
                <div className="avatar">{c.name[0]?.toUpperCase()}</div>
                <div className="grow"><strong>{c.name}</strong></div>
                <input className="input amount-input" inputMode="decimal" placeholder="0.00"
                  value={amounts[c.id] || ""}
                  onChange={(e) => setAmounts({ ...amounts, [c.id]: e.target.value })} />
              </div>
            ))
          )}
          <button className="btn btn-primary" onClick={doManual}>Preview split</button>
        </div>
      )}

      {mode === "receipt" && (
        <div className="card stack">
          {!receipt ? (
            <>
              <div className="muted">Take a clear, straight-on photo of the bill.</div>
              <label className="btn btn-secondary file-btn">
                Take or choose a photo
                <input type="file" accept="image/*" hidden onChange={onFile} />
              </label>
            </>
          ) : (
            <>
              <h2>{receipt.merchant}</h2>
              <div className="muted">Tap names to share an item between people.</div>
              {receipt.items.map((it, i) => (
                <div key={i} className="item col">
                  <div className="row between">
                    <span>{it.name}</span>
                    <span className="amount">{money(it.price)}</span>
                  </div>
                  <div className="chips">
                    <button type="button" className="chip"
                      onClick={() => setAssign({ ...assign, [i]: allNames })}>
                      Everyone
                    </button>
                    {allNames.map((n) => (
                      <button type="button" key={n}
                        className={"chip" + ((assign[i] || []).includes(n) ? " active" : "")}
                        onClick={() => toggleAssign(i, n)}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <div className="row">
                <div className="grow">
                  <label className="label">Tax</label>
                  <input className="input" inputMode="decimal" value={receipt.tax}
                    onChange={(e) => setReceipt({ ...receipt, tax: e.target.value })} />
                </div>
                <div className="grow">
                  <label className="label">Tip</label>
                  <input className="input" inputMode="decimal" value={receipt.tip}
                    onChange={(e) => setReceipt({ ...receipt, tip: e.target.value })} />
                </div>
              </div>
              <button className="btn btn-primary" onClick={doReceipt}>Calculate split</button>
              <button className="btn btn-ghost" onClick={() => setReceipt(null)}>
                Scan a different receipt
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
