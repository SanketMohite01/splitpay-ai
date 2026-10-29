import { useCallback, useEffect, useState } from "react";
import { getContacts } from "./api";
import Split from "./Split";
import Contacts from "./Contacts";
import Status from "./Status";
import Settings from "./Settings";
import { Avatar, Skeleton } from "./components";
import { SplitIcon, UsersIcon, ListIcon, GearIcon } from "./Icons";

const TABS = [["split", "Split AI", SplitIcon], ["contacts", "Contacts", UsersIcon], ["status", "Status", ListIcon]];

export default function App() {
  const [tab, setTab] = useState("split");
  const [settings, setSettings] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [contactsErr, setContactsErr] = useState("");
  const [toast, setToast] = useState(null);
  const [me, setMe] = useState(() => localStorage.getItem("me") || "Me");

  useEffect(() => { localStorage.setItem("me", me); }, [me]);

  const notify = useCallback((msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const loadContacts = useCallback(() => {
    setContactsLoading(true);
    setContactsErr("");
    return getContacts()
      .then((list) => {
        setContacts(list);
        setContactsLoading(false);
      })
      .catch((e) => {
        setContactsLoading(false);
        setContactsErr(e.message);
        notify("Could not load contacts: " + e.message, "error");
      });
  }, [notify]);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  return (
    <div className="app">
      <header className="header">
        <div className="logo">Split<span>Pay</span></div>
        <div className="hright">
          <button className="iconbtn" aria-label="Settings" onClick={() => setSettings(true)}><GearIcon /></button>
          <Avatar name={me} size="sm" />
        </div>
      </header>
      <main className="main">
        {settings ? <Settings me={me} setMe={setMe} onBack={() => setSettings(false)} />
          : tab === "split" ? (
            <Split
              contacts={contacts}
              notify={notify}
              me={me}
              openSettings={() => setSettings(true)}
              goStatus={() => setTab("status")}
              goContacts={() => { setSettings(false); setTab("contacts"); }}
            />
          )
          : tab === "contacts" ? (
            contactsLoading ? (
              <Skeleton n={4} />
            ) : contactsErr ? (
              <div className="card error-card">
                <p className="muted">Could not load contacts. {contactsErr}</p>
                <button type="button" className="btn btn-secondary btn-sm" onClick={loadContacts}>Retry</button>
              </div>
            ) : (
              <Contacts contacts={contacts} setContacts={setContacts} notify={notify} />
            )
          )
          : <Status notify={notify} />}
      </main>
      {toast && <div className={"toast " + (toast.type === "error" ? "error" : "")} role="status">{toast.msg}</div>}
      <nav className="nav">
        {TABS.map(([k, label, Icon]) => (
          <button key={k} className={tab === k && !settings ? "on" : ""} onClick={() => { setSettings(false); setTab(k); }}><Icon />{label}</button>
        ))}
      </nav>
    </div>
  );
}
