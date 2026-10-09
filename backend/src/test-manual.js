const API = "http://localhost:3001";
const EMAIL = "sb-rjxce53233259@personal.example.com";
const MY_PHONE = process.env.MY_PHONE || "+910000000001";

const post = (path, body) =>
  fetch(API + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then((r) => r.json());

const preview = await post("/api/split/manual", {
  description: "Trip cab",
  paidBy: "Sanket",
  shares: [
    { name: "Friend 1", email: EMAIL, phone: MY_PHONE, amount: 110 },
    { name: "Friend 2", email: EMAIL, phone: "+910000000002", amount: 200 },
  ],
});
if (preview.error) {
  console.log("ERROR", preview.error);
  process.exit(1);
}

const sent = await post("/api/send", preview);
if (sent.error) {
  console.log("ERROR", sent.error);
  process.exit(1);
}

for (const inv of sent.invoices) {
  console.log("\n" + inv.name, "$" + inv.amount, inv.status);
  console.log("PAY LINK:", inv.payUrl);
  console.log("WHATSAPP:", inv.whatsappLink);
}
