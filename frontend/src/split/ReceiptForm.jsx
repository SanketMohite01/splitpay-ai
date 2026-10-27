import { money } from "../components";
export default function ReceiptForm({ receipt, setReceipt, assign, setAssign, allNames, toggleAssign, onFile, onGo }) {
  if (!receipt) {
    return (
      <div className="card stack">
        <div className="muted">Take a clear, straight-on photo of the bill.</div>
        <label className="btn btn-secondary">
          Take or choose a photo
          <input type="file" accept="image/*" hidden onChange={onFile} />
        </label>
      </div>
    );
  }
  return (
    <div className="card stack">
      <h2 style={{ margin: 0 }}>{receipt.merchant}</h2>
      <div className="muted">Tap names to share an item between people.</div>
      {receipt.items.map((it, i) => (
        <div key={i} className="item col">
          <div className="row between"><span>{it.name}</span><span className="amount">{money(it.price)}</span></div>
          <div className="chips">
            <button type="button" className="chip" onClick={() => setAssign({ ...assign, [i]: allNames })}>Everyone</button>
            {allNames.map((n) => (
              <button type="button" key={n} className={"chip" + ((assign[i] || []).includes(n) ? " active" : "")} onClick={() => toggleAssign(i, n)}>{n}</button>
            ))}
          </div>
        </div>
      ))}
      <div className="row">
        <div className="grow"><label className="label">Tax</label><input className="input" inputMode="decimal" value={receipt.tax} onChange={(e) => setReceipt({ ...receipt, tax: e.target.value })} /></div>
        <div className="grow"><label className="label">Tip</label><input className="input" inputMode="decimal" value={receipt.tip} onChange={(e) => setReceipt({ ...receipt, tip: e.target.value })} /></div>
      </div>
      <button className="btn btn-primary" onClick={onGo}>Calculate split</button>
      <button className="btn btn-ghost" onClick={() => setReceipt(null)}>Scan a different receipt</button>
    </div>
  );
}
