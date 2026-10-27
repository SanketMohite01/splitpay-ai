export default function DescribeForm({ message, setMessage, onGo }) {
  return (
    <div className="card stack">
      <div>
        <label className="label" htmlFor="msg">Describe the expense</label>
        <textarea id="msg" className="input" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Dinner was $120. Rahul had drinks so he owes more." />
      </div>
      <div className="muted">The AI works out a fair split. It assumes you paid.</div>
      <button className="btn btn-primary" onClick={onGo}>Split with AI</button>
    </div>
  );
}
