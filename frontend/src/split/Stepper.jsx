const STEPS = ["People", "Details", "Review", "Send"];
export default function Stepper({ step }) {
  return <div className="steps">{STEPS.map((s, i) => <div key={s} className={"step " + (i < step ? "done" : i === step ? "now" : "")}>{s}</div>)}</div>;
}
