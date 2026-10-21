import { useCallback, useEffect, useState } from "react";
import { getContacts } from "./api";
import Split from "./Split";
import Contacts from "./Contacts";
import Status from "./Status";

const TABS = [
  { id: "split", label: "Split", icon: "\u2797" },
  { id: "contacts", label: "Contacts", icon: "\uD83D\uDC65" },
  { id: "status", label: "Status", icon: "\uD83D\uDCCA" },
];

export default function App() {
  const [tab, setTab] = useState("split");
  const [contacts, setContacts] = useState([]);
  const [toast, setToast] = useState(null);

  const notify = useCallback((text, type = "ok") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const loadContacts = useCallback(async () => {
    try {
      setContacts(await getContacts());
    } catch (e) {
      notify(e.message, "error");
    }
  }, [notify]);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  return (
    <div className="app">
      <header className="header">
        <h1>SplitPay AI</h1>
        <p>Split bills. Get paid with PayPal.</p>
      </header>

      <main className="main">
        {/* Split stays mounted so work in progress is not lost when you switch tabs */}
        <div hidden={tab !== "split"}>
          <Split contacts={contacts} notify={notify} />
        </div>
        {tab === "contacts" && (
          <Contacts contacts={contacts} reload={loadContacts} notify={notify} />
        )}
        {tab === "status" && <Status notify={notify} />}
      </main>

      {toast && <div className={`toast ${toast.type}`}>{toast.text}</div>}

      <nav className="tabbar">
        <div className="tabbar-inner">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={"tab" + (tab === t.id ? " active" : "")}
              onClick={() => setTab(t.id)}
            >
              <span className="ico">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
