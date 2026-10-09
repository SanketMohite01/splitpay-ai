import fs from "fs";

const API = "http://localhost:3001";
const EMAIL = "sb-rjxce53233259@personal.example.com";
const file = process.argv[2];
if (!file) {
  console.log("Usage: node src/test-receipt.js path/to/receipt.jpg");
  process.exit(1);
}

const post = (path, body) =>
  fetch(API + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then((r) => r.json());

const mimeType = file.toLowerCase().endsWith(".png")
  ? "image/png"
  : "image/jpeg";
const scan = await post("/api/receipt/scan", {
  imageBase64: fs.readFileSync(file).toString("base64"),
  mimeType,
});
console.log("SCAN", JSON.stringify(scan, null, 2));
if (scan.error) process.exit(1);

// Example assignment: even items to Friend 1, odd items shared by both
const items = scan.items.map((it, i) => ({
  ...it,
  assignedTo: i % 2 === 0 ? ["Friend 1"] : ["Friend 1", "Friend 2"],
}));
const split = await post("/api/split/items", {
  description: scan.merchant || "Receipt",
  paidBy: "Sanket",
  items,
  tax: scan.tax,
  tip: scan.tip,
  people: [
    { name: "Friend 1", email: EMAIL, phone: "+910000000001" },
    { name: "Friend 2", email: EMAIL, phone: "+910000000002" },
  ],
});
console.log("SPLIT", JSON.stringify(split, null, 2));
