import { useMemo, useState } from "react";
import { aiSplit, manualSplit, scanReceipt, splitByItems, sendInvoices, resizeImage } from "./api";
import { Loading } from "./components";
import Stepper from "./split/Stepper";
import DescribeForm from "./split/DescribeForm";
import ManualForm from "./split/ManualForm";
import ReceiptForm from "./split/ReceiptForm";
import { Review, Sent } from "./split/ReviewSend";

const MODES = [
  { id: "ai", label: "Describe" },
  { id: "manual", label: "Manual" },
  { id: "receipt", label: "Receipt" },
];

export default function Split({ contacts, notify, me, openSettings, goStatus }) {
  const [mode, setMode] = useState("ai");
  const [selected, setSelected] = useState([]);
  const [message, setMessage] = useState("");
  const [description, setDescription] = useState("");
  const [amounts, setAmounts] = useState({});
  const [receipt, setReceipt] = useState(null);
  const [assign, setAssign] = useState({});
  const [preview, setPreview] = useState(null);
  const [sent, setSent] = useState(null);
  const [busy, setBusy] = useState("");

  const chosen = useMemo(() => contacts.filter((c) => selected.includes(c.id)), [contacts, selected]);
  const myName = me.trim() || "Me";
  const people = [{ name: myName }, ...chosen.map(({ name, email, phone }) => ({ name, email, phone }))];
  const allNames = people.map((p) => p.name);

  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const toggleAssign = (i, name) =>
    setAssign((a) => {
      const cur = a[i] || [];
      return { ...a, [i]: cur.includes(name) ? cur.filter((n) => n !== name) : [...cur, name] };
    });

  const run = async (label, fn) => {
    setBusy(label);
    try { await fn(); } catch (e) { notify(e.message, "error"); } finally { setBusy(""); }
  };
  const reset = () => {
    setPreview(null); setSent(null); setMessage(""); setDescription("");
    setAmounts({}); setReceipt(null); setAssign({});
  };

  const doAi = () => {
    if (!message.trim()) return notify("Describe the expense first", "error");
    if (chosen.length === 0) return notify("Pick at least one person", "error");
    run("Splitting...", async () => {
      const text = `${message.trim()}\n(The person writing this message is ${myName}.)`;
      const res = await aiSplit(text, people);
      setPreview({ ...res, paidBy: myName });
    });
  };
  const doManual = () => {
    const shares = chosen.map((c) => ({ name: c.name, email: c.email, phone: c.phone, amount: Number(amounts[c.id]) }));
    if (!description.trim()) return notify("Add a short description", "error");
    if (shares.length === 0) return notify("Pick at least one person", "error");
    if (shares.some((s) => !(s.amount > 0))) return notify("Enter an amount for everyone you picked", "error");
    run("Preparing preview...", async () => {
      setPreview(await manualSplit({ description: description.trim(), paidBy: myName, shares }));
    });
  };
  const onFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    run("Reading your receipt...", async () => {
      const img = await resizeImage(file);
      const r = await scanReceipt(img.imageBase64, img.mimeType);
      setReceipt({ merchant: r.merchant || "Receipt", items: r.items || [], tax: r.tax || 0, tip: r.tip || 0 });
      setAssign({});
    });
  };
  const doReceipt = () => {
    if (chosen.length === 0) return notify("Pick at least one person", "error");
    const items = receipt.items.map((it, i) => ({ ...it, assignedTo: assign[i] || [] }));
    if (items.some((it) => it.assignedTo.length === 0)) return notify("Assign every item to at least one person", "error");
    run("Calculating the split...", async () => {
      setPreview(await splitByItems({ description: receipt.merchant, paidBy: myName, items, tax: Number(receipt.tax) || 0, tip: Number(receipt.tip) || 0, people }));
    });
  };
  const doSend = () =>
    run("Sending PayPal invoices...", async () => {
      setSent(await sendInvoices(preview));
      notify("Invoices sent");
    });

  if (busy) return <Loading text={busy} />;
  if (sent) return <Sent sent={sent} onReset={() => { reset(); goStatus(); }} />;
  if (preview) return (<><Stepper step={2} /><Review preview={preview} myName={myName} onSend={doSend} onBack={() => setPreview(null)} /></>);

  return (
    <div>
      <Stepper step={chosen.length ? 1 : 0} />
      <div className="card">
        <h2>Who is splitting?</h2>
        {contacts.length === 0 ? <div className="empty">Add friends in the Contacts tab first.</div> : (
          <div className="chips">
            {contacts.map((c) => (
              <button type="button" key={c.id} aria-pressed={selected.includes(c.id)} className={"chip" + (selected.includes(c.id) ? " active" : "")} onClick={() => toggle(c.id)}>{c.name}</button>
            ))}
          </div>
        )}
        <p className="muted" style={{ marginBottom: 0 }}>
          Paid by <b>{myName}</b>. <button type="button" className="btn btn-ghost btn-sm" style={{ display: "inline-flex", padding: "2px 6px" }} onClick={openSettings}>Change name</button>
        </p>
      </div>
      <div className="segmented">
        {MODES.map((m) => <button key={m.id} className={mode === m.id ? "active" : ""} onClick={() => setMode(m.id)}>{m.label}</button>)}
      </div>
      {mode === "ai" && <DescribeForm message={message} setMessage={setMessage} onGo={doAi} />}
      {mode === "manual" && <ManualForm chosen={chosen} description={description} setDescription={setDescription} amounts={amounts} setAmounts={setAmounts} onGo={doManual} />}
      {mode === "receipt" && <ReceiptForm receipt={receipt} setReceipt={setReceipt} assign={assign} setAssign={setAssign} allNames={allNames} toggleAssign={toggleAssign} onFile={onFile} onGo={doReceipt} />}
    </div>
  );
}
