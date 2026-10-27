export default function Settings({ me, setMe, onBack }) {
  return (
    <>
      <h2>Settings</h2>
      <div className="card">
        <label className="label" htmlFor="dn">Display name</label>
        <input id="dn" className="input" value={me} onChange={(e) => setMe(e.target.value)} />
        <p className="muted">This is the name shown as the person who paid the bill.</p>
      </div>
      <div className="card"><p className="muted" style={{ margin: 0 }}>Payments are handled by PayPal. SplitPay never sees card details.</p></div>
      <p className="muted">Version 1.0.0</p>
      <button className="btn btn-primary" onClick={onBack}>Done</button>
    </>
  );
}
