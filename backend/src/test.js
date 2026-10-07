import { getAccessToken, createInvoice, sendInvoice } from "./paypal.js";

const token = await getAccessToken();
console.log("Got token");

const id = await createInvoice(token, {
  name: "Rahul",
  email: "sb-rjxce53233259@personal.example.com",
  amount: 40.5,
  description: "Dinner split",
});
console.log("Created invoice:", id);

await sendInvoice(token, id);
console.log("Invoice sent");
