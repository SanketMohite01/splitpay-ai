import { Avatar, money } from "../components";

export default function ReceiptForm({ receipt, setReceipt, assign, setAssign, allNames, contacts, toggleAssign, onFile, onGo }) {
  const byName = new Map((contacts || []).map((c) => [c.name, c]));

  const personChip = (label, { id, active, onClick, ariaLabel }) => (
    <button
      type="button"
      aria-pressed={active}
      aria-label={ariaLabel || label}
      className={"chip-person" + (active ? " active" : "")}
      onClick={onClick}
    >
      <Avatar name={label} id={id} size="sm" selected={active} />
      <span className="chip-person__label">{label}</span>
    </button>
  );

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
          <div className="row between">
            <span>{it.name}</span>
            <span className="amount">{money(it.price)}</span>
          </div>
          <div className="chips">
            {personChip("Everyone", {
              id: "__everyone__",
              active: (assign[i] || []).length === allNames.length && allNames.length > 0,
              onClick: () => setAssign({ ...assign, [i]: allNames }),
            })}
            {allNames.map((n) => {
              const on = (assign[i] || []).includes(n);
              return (
                <span key={n}>
                  {personChip(n, {
                    id: byName.get(n)?.id,
                    active: on,
                    onClick: () => toggleAssign(i, n),
                  })}
                </span>
              );
            })}
          </div>
        </div>
      ))}
      <div className="row">
        <div className="grow">
          <label className="label" htmlFor="rc-tax">Tax</label>
          <input id="rc-tax" className="input" inputMode="decimal" value={receipt.tax} onChange={(e) => setReceipt({ ...receipt, tax: e.target.value })} />
        </div>
        <div className="grow">
          <label className="label" htmlFor="rc-tip">Tip</label>
          <input id="rc-tip" className="input" inputMode="decimal" value={receipt.tip} onChange={(e) => setReceipt({ ...receipt, tip: e.target.value })} />
        </div>
      </div>
      <button type="button" className="btn btn-primary" onClick={onGo}>Preview split</button>
      <button type="button" className="btn btn-ghost" onClick={() => setReceipt(null)}>Scan a different receipt</button>
    </div>
  );
}
