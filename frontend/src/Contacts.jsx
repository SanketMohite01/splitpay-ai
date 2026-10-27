import { useState } from "react";
import { addContact, deleteContact } from "./api";
import { Avatar, Sheet, Confirm } from "./components";
import { SearchIcon, PlusIcon, TrashIcon } from "./Icons";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const blank = { name: "", email: "", phone: "" };

export default function Contacts({ contacts, setContacts, notify }) {
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);
  const [del, setDel] = useState(null);
  const [f, setF] = useState(blank);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const list = contacts.filter((c) => `${c.name} ${c.email}`.toLowerCase().includes(q.toLowerCase()));

  const save = async () => {
    if (!f.name.trim()) return setErr("Enter a name.");
    if (!EMAIL.test(f.email.trim())) return setErr("Enter a valid email address.");
    setBusy(true); setErr("");
    try {
      const c = await addContact({ name: f.name.trim(), email: f.email.trim(), phone: f.phone.trim() });
      setContacts([...contacts, c]);
      setF(blank); setAdding(false); notify("Contact added");
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };
  const remove = async () => {
    try {
      await deleteContact(del.id);
      setContacts(contacts.filter((c) => c.id !== del.id));
      notify("Contact deleted");
    } catch (e) { notify(e.message, "error"); }
    setDel(null);
  };

  return (
    <>
      <div className="row between" style={{ marginBottom: 10 }}>
        <h2 style={{ margin: 0 }}>Contacts</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setAdding(true)}><PlusIcon s={16} /> Add contact</button>
      </div>
      <div className="search">
        <SearchIcon s={18} />
        <input className="input" placeholder="Search contacts" aria-label="Search contacts" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {list.length === 0 && <div className="empty">{contacts.length ? "No contacts match your search." : "No contacts yet. Add the people you split costs with."}</div>}
      {list.map((c) => (
        <div className="card row between" key={c.id}>
          <div className="row"><Avatar name={c.name} /><div><b>{c.name}</b><div className="muted">{c.email}</div></div></div>
          <button className="iconbtn" style={{ color: "var(--red)" }} aria-label={`Delete ${c.name}`} onClick={() => setDel(c)}><TrashIcon /></button>
        </div>
      ))}
      {adding && (
        <Sheet title="Add contact" onClose={() => setAdding(false)}>
          <div className="stack">
            <input className="input" placeholder="Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
            <input className="input" type="email" placeholder="PayPal sandbox email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
            <input className="input" type="tel" placeholder="Phone (optional)" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
            {err && <div style={{ color: "var(--red)" }}>{err}</div>}
            <button className="btn btn-primary" disabled={busy} onClick={save}>{busy ? "Saving..." : "Save contact"}</button>
          </div>
        </Sheet>
      )}
      {del && <Confirm text={`Delete ${del.name} from your contacts?`} action="Delete" onNo={() => setDel(null)} onYes={remove} />}
    </>
  );
}
