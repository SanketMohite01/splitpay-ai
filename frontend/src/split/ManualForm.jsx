import { Avatar } from "../components";
export default function ManualForm({ chosen, description, setDescription, amounts, setAmounts, onGo }) {
  return (
    <div className="card stack">
      <div>
        <label className="label" htmlFor="why">What is it for?</label>
        <input id="why" className="input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Trip cab" />
      </div>
      {chosen.length === 0 ? <div className="empty">Pick people above.</div> : chosen.map((c) => (
        <div className="row" key={c.id}>
          <Avatar name={c.name} id={c.id} size="md" />
          <div className="grow"><strong>{c.name}</strong></div>
          <input className="input amount-input" inputMode="decimal" placeholder="0.00" aria-label={`Amount for ${c.name}`} value={amounts[c.id] || ""} onChange={(e) => setAmounts({ ...amounts, [c.id]: e.target.value })} />
        </div>
      ))}
      <button type="button" className="btn btn-primary" onClick={onGo}>Preview split</button>
    </div>
  );
}
