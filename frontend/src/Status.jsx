import { useCallback, useEffect, useState } from "react";
import { getInvoices } from "./api";
import { Avatar, Badge, Skeleton, PayActions, money } from "./components";
import { RefreshIcon } from "./Icons";

const isPaid = (i) => i.paid === true || ["PAID", "MARKED_AS_PAID"].includes(String(i.status || "").toUpperCase());
const sum = (a) => a.reduce((s, i) => s + Number(i.amount || 0), 0);

export default function Status({ notify }) {
  const [items, setItems] = useState(null);
  const [filter, setFilter] = useState("all");

  const load = useCallback(async () => {
    setItems(null);
    try { setItems((await getInvoices()) || []); }
    catch (e) { notify(e.message, "error"); setItems([]); }
  }, [notify]);
  useEffect(() => { load(); }, [load]);

  const all = items || [];
  const total = sum(all), got = sum(all.filter(isPaid));
  const shown = all.filter((i) => filter === "all" || (filter === "paid") === isPaid(i));

  return (
    <>
      <div className="row between" style={{ marginBottom: 10 }}>
        <h2 style={{ margin: 0 }}>Status</h2>
        <button className="btn btn-ghost btn-sm" onClick={load}><RefreshIcon s={16} /> Refresh</button>
      </div>
      {items === null ? <Skeleton /> : (
        <>
          <div className="card">
            <div className="muted">Total requested</div>
            <div className="total">{money(total)}</div>
            <div className="bar"><i style={{ width: `${total ? (got / total) * 100 : 0}%` }} /></div>
            <div className="row between muted"><span>Paid {money(got)}</span><span>Pending {money(total - got)}</span></div>
          </div>
          <div className="segmented">
            {["all", "paid", "pending"].map((k) => (
              <button key={k} className={filter === k ? "active" : ""} onClick={() => setFilter(k)}>{k[0].toUpperCase() + k.slice(1)}</button>
            ))}
          </div>
          {shown.length === 0 && <div className="empty">No invoices here yet.</div>}
          {shown.map((i, n) => (
            <div className="card" key={i.invoiceId || i.id || n}>
              <div className="row between">
                <div className="row"><Avatar name={i.name || i.email} /><div><b>{i.name || i.email}</b><div className="muted">{money(i.amount)}</div></div></div>
                <Badge paid={isPaid(i)} />
              </div>
              {!isPaid(i) && <PayActions inv={i} />}
            </div>
          ))}
        </>
      )}
    </>
  );
}
