import "dotenv/config";
import express from "express";
import cors from "cors";
import { parseSplit } from "./ai.js";
import {
  getAccessToken,
  createInvoice,
  sendInvoice,
  getInvoiceStatus,
} from "./paypal.js";

const app = express();
app.use(cors());
app.use(express.json());

const store = []; // in memory for now; resets when the server restarts

app.get("/", (req, res) => res.send("SplitPay AI API is running"));
// 1) AI turns a message into a split (nothing is sent yet)
app.post("/api/split", async (req, res) => {
  try {
    const { message, people } = req.body;
    res.json(await parseSplit(message, people));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// 2) After the user confirms, create and send a PayPal invoice per person
app.post("/api/send", async (req, res) => {
  try {
    const { description, paidBy, shares } = req.body;
    const token = await getAccessToken();
    const invoices = [];
    for (const s of shares) {
      if (s.name === paidBy) continue; // the payer doesn't invoice themselves
      const id = await createInvoice(token, { ...s, description });
      await sendInvoice(token, id);
      const rec = {
        name: s.name,
        amount: s.amount,
        invoiceId: id,
        status: "SENT",
      };
      store.push(rec);
      invoices.push(rec);
    }
    res.json({ invoices });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 3) Live payment status from PayPal
app.get("/api/invoices", async (req, res) => {
  try {
    const token = await getAccessToken();
    for (const rec of store)
      rec.status = await getInvoiceStatus(token, rec.invoiceId);
    res.json({ invoices: store });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(process.env.PORT || 3001, () => console.log("API running"));
