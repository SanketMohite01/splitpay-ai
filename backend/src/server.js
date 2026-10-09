import "dotenv/config";
import express from "express";
import cors from "cors";
import { parseSplit } from "./ai.js";
import { query } from "./db.js";
import {
  getAccessToken,
  createInvoice,
  sendInvoice,
  getInvoiceStatus,
} from "./paypal.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.send("SplitPay AI API is running"));

// ---------- Contacts ----------
app.get("/api/contacts", async (req, res) => {
  try {
    const { rows } = await query(
      "select * from contacts order by created_at desc",
    );
    res.json({ contacts: rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/contacts", async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    if (!name || !email)
      return res.status(400).json({ error: "name and email are required" });
    const { rows } = await query(
      "insert into contacts (name, email, phone) values ($1,$2,$3) returning *",
      [name, email, phone || null],
    );
    res.json({ contact: rows[0] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete("/api/contacts/:id", async (req, res) => {
  try {
    await query("delete from contacts where id = $1", [req.params.id]);
    res.json({ deleted: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ---------- AI split (nothing is sent) ----------
app.post("/api/split", async (req, res) => {
  try {
    const { message, people } = req.body;
    res.json(await parseSplit(message, people));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ---------- Confirm: save the split and send PayPal invoices ----------
app.post("/api/send", async (req, res) => {
  try {
    const { description, paidBy, shares } = req.body;
    const total = shares.reduce((sum, s) => sum + s.amount, 0);
    const split = await query(
      "insert into splits (description, total, paid_by) values ($1,$2,$3) returning id",
      [description, total, paidBy],
    );
    const splitId = split.rows[0].id;

    const token = await getAccessToken();
    const invoices = [];
    for (const s of shares) {
      if (s.name === paidBy) continue; // the payer doesn't invoice themselves
      const id = await createInvoice(token, { ...s, description });
      await sendInvoice(token, id);
      await query(
        "insert into invoices (split_id, name, email, amount, paypal_invoice_id, status) values ($1,$2,$3,$4,$5,'SENT')",
        [splitId, s.name, s.email, s.amount, id],
      );
      invoices.push({
        name: s.name,
        amount: s.amount,
        invoiceId: id,
        status: "SENT",
      });
    }
    res.json({ invoices });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ---------- Payment status (refreshed from PayPal, saved in the database) ----------
app.get("/api/invoices", async (req, res) => {
  try {
    const { rows } = await query(
      "select * from invoices order by created_at desc limit 50",
    );
    const token = await getAccessToken();
    for (const r of rows) {
      if (r.status === "PAID") continue;
      try {
        const s = await getInvoiceStatus(token, r.paypal_invoice_id);
        if (s !== r.status) {
          await query("update invoices set status = $1 where id = $2", [
            s,
            r.id,
          ]);
          r.status = s;
        }
      } catch {
        // keep the old status if PayPal can't be reached
      }
    }
    res.json({
      invoices: rows.map((r) => ({
        name: r.name,
        amount: Number(r.amount),
        invoiceId: r.paypal_invoice_id,
        status: r.status,
      })),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(process.env.PORT || 3001, () => console.log("API running"));
