import { useState } from "react";
import { addContact, deleteContact } from "./api";

export default function Contacts({ contacts, reload, notify }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function add(e) {
    e.preventDefault();
    if (!form.name.trim()) return notify("Enter a name", "error");
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return notify("Enter a valid email", "error");
    setBusy(true);
    try {
      await addContact({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
      });
      setForm({ name: "", email: "", phone: "" });
      await reload();
      notify("Contact saved");
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setBusy(false);
    }
  }

  async function remove(c) {
    if (!window.confirm(`Delete ${c.name}?`)) return;
    try {
      await deleteContact(c.id);
      await reload();
      notify("Deleted");
    } catch (err) {
      notify(err.message, "error");
    }
  }

  return (
    <div>
      <form className="card stack" onSubmit={add}>
        <h2>Add a contact</h2>
        <div>
          <label className="label">Name</label>
          <input className="input" value={form.name} onChange={set("name")} placeholder="Rahul" />
        </div>
        <div>
          <label className="label">Email (PayPal sends the invoice here)</label>
          <input className="input" type="email" inputMode="email" value={form.email}
            onChange={set("email")} placeholder="name@example.com" />
        </div>
        <div>
          <label className="label">Phone for WhatsApp (with country code)</label>
          <input className="input" type="tel" inputMode="tel" value={form.phone}
            onChange={set("phone")} placeholder="+91..." />
        </div>
        <button className="btn btn-primary" disabled={busy}>
          {busy ? "Saving..." : "Save contact"}
        </button>
      </form>

      <div className="card">
        <h2>Your contacts ({contacts.length})</h2>
        {contacts.length === 0 && <div className="empty">No contacts yet.</div>}
        {contacts.map((c) => (
          <div className="item" key={c.id}>
            <div className="avatar">{c.name[0]?.toUpperCase()}</div>
            <div className="grow">
              <strong>{c.name}</strong>
              <div className="muted">{c.email}</div>
              {c.phone && <div className="muted">{c.phone}</div>}
            </div>
            <button type="button" className="btn btn-danger btn-sm" onClick={() => remove(c)}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
