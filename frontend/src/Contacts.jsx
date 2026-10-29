import { useMemo, useState } from "react";
import { addContact, deleteContact } from "./api";
import { Avatar, Sheet, Confirm } from "./components";
import { SearchIcon, PlusIcon, TrashIcon } from "./Icons";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^\+\d{6,}$/;
const blank = { name: "", email: "", phone: "" };

export default function Contacts({ contacts, setContacts, notify }) {
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);
  const [del, setDel] = useState(null);
  const [f, setF] = useState(blank);
  const [fieldErr, setFieldErr] = useState({});
  const [busy, setBusy] = useState(false);

  const list = contacts.filter((c) => `${c.name} ${c.email}`.toLowerCase().includes(q.toLowerCase()));

  const duplicateWarn = useMemo(() => {
    const e = f.email.trim().toLowerCase();
    if (!e) return "";
    const other = contacts.find((c) => c.email.toLowerCase() === e);
    return other ? `Same email as ${other.name}.` : "";
  }, [contacts, f.email]);

  const validate = () => {
    const next = {};
    if (!f.name.trim()) next.name = "Enter a name.";
    if (!EMAIL.test(f.email.trim())) next.email = "Enter a valid email address.";
    const ph = f.phone.trim();
    if (ph && !PHONE.test(ph)) next.phone = "Use + and country code, e.g. +14155551234.";
    setFieldErr(next);
    return Object.keys(next).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    setBusy(true);
    try {
      const c = await addContact({ name: f.name.trim(), email: f.email.trim(), phone: f.phone.trim() });
      setContacts([...contacts, c]);
      setF(blank);
      setFieldErr({});
      setAdding(false);
      notify("Contact added");
    } catch (e) {
      setFieldErr({ form: e.message });
    }
    setBusy(false);
  };

  const remove = async () => {
    try {
      await deleteContact(del.id);
      setContacts(contacts.filter((c) => c.id !== del.id));
      notify("Contact deleted");
    } catch (e) {
      notify(e.message, "error");
    }
    setDel(null);
  };

  return (
    <>
      <div className="row between" style={{ marginBottom: 10 }}>
        <h2 style={{ margin: 0 }}>Contacts</h2>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => setAdding(true)}>
          <PlusIcon s={16} /> Add contact
        </button>
      </div>
      {contacts.length > 5 && (
        <div className="search">
          <SearchIcon s={18} />
          <input
            className="input"
            placeholder="Search contacts"
            aria-label="Search contacts"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      )}
      {list.length === 0 && (
        <div className="empty">
          {contacts.length ? "No contacts match your search." : "No contacts yet. Add the people you split costs with."}
        </div>
      )}
      {list.map((c) => (
        <div className="card row between" key={c.id}>
          <div className="row grow" style={{ minWidth: 0 }}>
            <Avatar name={c.name} id={c.id} size="md" />
            <div className="grow" style={{ minWidth: 0 }}>
              <b>{c.name}</b>
              <div className="muted contact-email">{c.email}</div>
              <div className="muted">{c.phone?.trim() ? c.phone : "No phone"}</div>
            </div>
          </div>
          <button
            type="button"
            className="iconbtn iconbtn-hit"
            style={{ color: "var(--red)" }}
            aria-label={`Delete ${c.name}`}
            onClick={() => setDel(c)}
          >
            <TrashIcon />
          </button>
        </div>
      ))}
      {adding && (
        <Sheet title="Add contact" onClose={() => { setAdding(false); setFieldErr({}); }}>
          <div className="stack">
            <div>
              <label className="label" htmlFor="c-name">Name</label>
              <input
                id="c-name"
                className="input"
                placeholder="Name"
                value={f.name}
                onChange={(e) => setF({ ...f, name: e.target.value })}
              />
              {fieldErr.name && <div className="field-error">{fieldErr.name}</div>}
            </div>
            <div>
              <label className="label" htmlFor="c-email">PayPal email</label>
              <input
                id="c-email"
                className="input"
                type="email"
                placeholder="PayPal sandbox email"
                value={f.email}
                onChange={(e) => setF({ ...f, email: e.target.value })}
              />
              {fieldErr.email && <div className="field-error">{fieldErr.email}</div>}
              {duplicateWarn && !fieldErr.email && <div className="field-warn">{duplicateWarn}</div>}
            </div>
            <div>
              <label className="label" htmlFor="c-phone">Phone (optional)</label>
              <input
                id="c-phone"
                className="input"
                type="tel"
                placeholder="+14155551234"
                value={f.phone}
                onChange={(e) => setF({ ...f, phone: e.target.value })}
              />
              {fieldErr.phone && <div className="field-error">{fieldErr.phone}</div>}
            </div>
            {fieldErr.form && <div className="field-error">{fieldErr.form}</div>}
            <button type="button" className="btn btn-primary" disabled={busy} onClick={save}>
              {busy ? "Saving..." : "Save contact"}
            </button>
          </div>
        </Sheet>
      )}
      {del && (
        <Confirm text={`Delete ${del.name} from your contacts?`} action="Delete" onNo={() => setDel(null)} onYes={remove} />
      )}
    </>
  );
}
