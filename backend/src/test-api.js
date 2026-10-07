const API = "https://splitpay-ai.onrender.com";
const post = (path, body) =>
  fetch(API + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then((r) => r.json());

// Use your US sandbox PERSONAL email for Rahul and Priya (the same email twice is fine)
const people = [
  { name: "Sanket", email: "a@test.com" },
  { name: "Rahul", email: "sb-rjxce53233259@personal.example.com" },
  { name: "Priya", email: "sb-rjxce53233259@personal.example.com" },
];

console.log("1. Splitting with AI...");
const split = await post("/api/split", {
  message:
    "Dinner was $120. Sanket paid. Sanket and Rahul had drinks so they owe more than Priya.",
  people,
});
console.log(JSON.stringify(split, null, 2));
if (split.error) process.exit(1);

console.log("2. Sending PayPal invoices...");
const sent = await post("/api/send", split);
console.log(JSON.stringify(sent, null, 2));

console.log("3. Checking status...");
const status = await fetch(API + "/api/invoices").then((r) => r.json());
console.log(JSON.stringify(status, null, 2));
