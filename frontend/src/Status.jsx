import { useCallback, useEffect, useState } from "react";
import { getInvoices } from "./api";
import { Loading, PayActions, money } from "./components";

const LABEL = { PAID: "Paid", SENT: "Waiting" };
const sum = (list) => list.reduce((s, i) => s + i.amount, 0);

export default function Status({ notify }) {
  const [invoices, setInvoices] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      setInvoices(await getInvoices());
    } catch (e) {
      notify(e.message, "error");
      setInvoices((v) => v || []);
    } finally {
      setRefreshing(false);
    }
  }, [notify]);

  useEffect(() => {
    load();
  }, [load]);

  if (invoices === null) return <Loading text="Checking PayPal for payments..." />;

  const paid = invoices.filter((i) => i.status === "PAID");
  const total = sum(invoices);
  const pct = total ? Math.round((sum(paid) / total) * 100) : 0;

  return (
    <div>
      <div className="card">
        <div className="row between">
          <h2>Payments</h2>
          <button className="btn btn-secondary btn-sm" onClick={load} disabled={refreshing}>
            {refreshing ? "Checking..." : "Refresh"}
          </button>
        </div>
        <div className="total">{money(sum(paid))}</div>
        <div className="muted">paid of {money(total)}</div>
        <div className="bar"><div style={{ width: pct + "%" }} /></div>
      </div>

      <div className="card">
        {invoices.length === 0 && <div className="empty">No invoices yet. Send your first split.</div>}
        {invoices.map((inv) => (
          <div className="item col" key={inv.invoiceId}>
            <div className="row">
              <div className="avatar">{inv.name[0]?.toUpperCase()}</div>
              <div className="grow"><strong>{inv.name}</strong></div>
              <span className="amount">{money(inv.amount)}</span>
              <span className={"badge " + (inv.status === "PAID" ? "paid" : inv.status === "SENT" ? "sent" : "other")}>
                {LABEL[inv.status] || inv.status}
              </span>
            </div>
            {inv.status !== "PAID" && <PayActions inv={inv} />}
          </div>
        ))}
      </div>
    </div>
  );
}
