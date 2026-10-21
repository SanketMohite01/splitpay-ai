import { useState, useEffect, useCallback } from "react";
import { splitExpense, sendInvoices, getInvoices, getContacts, addContact, deleteContact } from "./api";
import "./App.css";

const money = (n) => `$${Number(n).toFixed(2)}`;
const emailOk = (e) => /^\S+@\S+\.\S+$/.test(e);

function Badge({ status }) {
  const s = String(status || "").toUpperCase();
  return <span className={`badge ${s === "PAID" ? "paid" : "sent"}`}>{s || "SENT"}</span>;
}

function StatusList({ invoices, onRefresh, loading }) {
  return (
    <section className="card">
      <div className="row between">
        <h2>Payment status</h2>
        <button className="ghost" onClick={onRefresh} disabled={loading}>{loading ? "Refreshing..." : "Refresh"}</button>
      </div>
      {invoices.length === 0 ? (
        <p className="muted">No invoices yet. Send a split and they will show up here.</p>
      ) : (
        <ul className="list">
          {invoices.map((i, k) => (
            <li key={i.invoiceId || k} className="row between">
              <span><strong>{i.name}</strong> <span className="muted">{money(i.amount)}</span></span>
              <Badge status={i.status} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function SplitTab({ contacts, onSent }) {
  const [message, setMessage] = useState("");
  const [people, setPeople] = useState([{ name: "", email: "" }]);
  const [split, setSplit] = useState(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const setPerson = (i, field, v) => setPeople(people.map((p, k) => (k === i ? { ...p, [field]: v } : p)));
  const addFromContact = (id) => {
    const c = contacts.find((c) => String(c.id) === id);
    if (c) setPeople([...people.filter((p) => p.name || p.email), { name: c.name, email: c.email }]);
  };

  async function preview() {
    setError("");
    const valid = people.filter((p) => p.name && emailOk(p.email));
    if (!message.trim() || valid.length === 0) return setError("Enter an expense message and at least one person with a valid email.");
    setBusy("Splitting...");
    try { setSplit(await splitExpense(message, valid)); }
    catch (e) { setError(e.message); }
    setBusy("");
  }

  async function confirm() {
    setError(""); setBusy("Sending invoices...");
    try { await sendInvoices(split); setSplit(null); setMessage(""); await onSent(); }
    catch (e) { setError(e.message); }
    setBusy("");
  }

  return (
    <>
      <section className="card">
        <h2>Describe the expense</h2>
        <textarea rows="3" value={message} onChange={(e) => setMessage(e.target.value)}
          placeholder="Dinner $120, Rahul had drinks" />
        <h3>Who is splitting it?</h3>
        {people.map((p, i) => (
          <div className="row gap wrap" key={i}>
            <input placeholder="Name" value={p.name} onChange={(e) => setPerson(i, "name", e.target.value)} />
            <input placeholder="Email (use a sandbox test email)" value={p.email} onChange={(e) => setPerson(i, "email", e.target.value)} />
            <button className="ghost" onClick={() => setPeople(people.filter((_, k) => k !== i))} aria-label="Remove person">Remove</button>
          </div>
        ))}
        <div className="row gap wrap">
          <button className="ghost" onClick={() => setPeople([...people, { name: "", email: "" }])}>Add person</button>
          {contacts.length > 0 && (
            <select value="" onChange={(e) => addFromContact(e.target.value)}>
              <option value="">Add from contacts</option>
              {contacts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
        </div>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="primary" onClick={preview} disabled={!!busy}>{busy === "Splitting..." ? "Splitting... (the first request can take a minute)" : "Split expense"}</button>
      </section>

      {split && (
        <section className="card">
          <h2>{split.description} <span className="muted">{money(split.total)} paid by {split.paidBy}</span></h2>
          <table>
            <thead><tr><th>Name</th><th className="num">Amount</th></tr></thead>
            <tbody>{split.shares.map((s, i) => <tr key={i}><td>{s.name}</td><td className="num">{money(s.amount)}</td></tr>)}</tbody>
          </table>
          <button className="primary" onClick={confirm} disabled={!!busy}>{busy || "Confirm & Send"}</button>
        </section>
      )}
    </>
  );
}

function ManualTab({ contacts, onSent }) {
  const [description, setDescription] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [amounts, setAmounts] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const toggle = (id) => setAmounts((a) => { const n = { ...a }; if (id in n) delete n[id]; else n[id] = ""; return n; });

  async function send() {
    setError(""); setResult(null);
    const shares = contacts.filter((c) => c.id in amounts).map((c) => ({ name: c.name, email: c.email, amount: parseFloat(amounts[c.id]) }));
    if (!description.trim() || !paidBy.trim()) return setError("Add a description and who paid.");
    if (shares.length === 0 || shares.some((s) => !(s.amount > 0))) return setError("Pick at least one contact and enter an amount above 0 for each.");
    setBusy(true);
    try { setResult((await sendInvoices({ description, paidBy, shares })).invoices); await onSent(); }
    catch (e) { setError(e.message); }
    setBusy(false);
  }

  return (
    <section className="card">
      <h2>Manual split</h2>
      <div className="row gap wrap">
        <input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        <input placeholder="Who paid?" value={paidBy} onChange={(e) => setPaidBy(e.target.value)} />
      </div>
      <h3>Pick contacts and amounts</h3>
      {contacts.length === 0 && <p className="muted">No contacts yet. Add some in the Contacts tab.</p>}
      <ul className="list">
        {contacts.map((c) => (
          <li key={c.id} className="row between gap">
            <label className="row gap"><input type="checkbox" checked={c.id in amounts} onChange={() => toggle(c.id)} />{c.name}</label>
            {c.id in amounts && (
              <input className="amount" type="number" min="0" step="0.01" placeholder="Amount" value={amounts[c.id]}
                onChange={(e) => setAmounts({ ...amounts, [c.id]: e.target.value })} />
            )}
          </li>
        ))}
      </ul>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="primary" onClick={send} disabled={busy}>{busy ? "Sending..." : "Send invoices"}</button>
      {result && (
        <ul className="list success">
          {result.map((i, k) => <li key={k} className="row between"><span>{i.name} <span className="muted">{money(i.amount)}</span></span><Badge status={i.status} /></li>)}
        </ul>
      )}
    </section>
  );
}

function ContactsTab({ contacts, reload }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [error, setError] = useState("");

  async function add(e) {
    e.preventDefault();
    if (!form.name.trim()) return setError("Name is required.");
    if (!emailOk(form.email)) return setError("Enter a valid email.");
    setError("");
    try { await addContact(form); setForm({ name: "", email: "", phone: "" }); await reload(); }
    catch (err) { setError(err.message); }
  }
  async function remove(id) {
    try { await deleteContact(id); await reload(); } catch (err) { setError(err.message); }
  }

  return (
    <section className="card">
      <h2>Contacts</h2>
      <p className="muted">Use test contacts only.</p>
      <form className="row gap wrap" onSubmit={add}>
        <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <button className="primary" type="submit">Add contact</button>
      </form>
      {error && <p className="error" role="alert">{error}</p>}
      {contacts.length === 0 ? <p className="muted">No contacts yet. Add your first one above.</p> : (
        <ul className="list">
          {contacts.map((c) => (
            <li key={c.id} className="row between gap">
              <span><strong>{c.name}</strong><br /><span className="muted">{c.email}{c.phone && ` · ${c.phone}`}</span></span>
              <button className="danger" onClick={() => remove(c.id)}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function App() {
  const [tab, setTab] = useState("split");
  const [contacts, setContacts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loadingInv, setLoadingInv] = useState(false);

  const loadContacts = useCallback(async () => { try { setContacts(await getContacts()); } catch { /* shown on action */ } }, []);
  const loadInvoices = useCallback(async () => {
    setLoadingInv(true);
    try { setInvoices((await getInvoices()).invoices || []); } catch { /* keep old list */ }
    setLoadingInv(false);
  }, []);

  useEffect(() => { loadContacts(); loadInvoices(); }, [loadContacts, loadInvoices]);

  const tabs = [["split", "AI split"], ["manual", "Manual split"], ["contacts", "Contacts"]];
  return (
    <main>
      <header>
        <h1>SplitPay AI</h1>
        <nav>{tabs.map(([k, label]) => <button key={k} className={tab === k ? "tab on" : "tab"} onClick={() => setTab(k)}>{label}</button>)}</nav>
      </header>
      {tab === "split" && <SplitTab contacts={contacts} onSent={loadInvoices} />}
      {tab === "manual" && <ManualTab contacts={contacts} onSent={loadInvoices} />}
      {tab === "contacts" && <ContactsTab contacts={contacts} reload={loadContacts} />}
      {tab !== "contacts" && <StatusList invoices={invoices} onRefresh={loadInvoices} loading={loadingInv} />}
    </main>
  );
}