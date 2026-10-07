import "dotenv/config";

const BASE = "https://api-m.sandbox.paypal.com";

export async function getAccessToken() {
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`,
  ).toString("base64");

  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const data = await res.json();
  if (!res.ok) throw new Error("Token error: " + JSON.stringify(data));
  return data.access_token;
}

export async function createInvoice(
  token,
  { name, email, amount, description },
) {
  const res = await fetch(`${BASE}/v2/invoicing/invoices`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      detail: {
        invoice_number: `SPLIT-${Date.now()}`,
        currency_code: "USD",
        note: "Created by SplitPay AI",
      },
      primary_recipients: [
        { billing_info: { name: { given_name: name }, email_address: email } },
      ],
      items: [
        {
          name: description,
          quantity: "1",
          unit_amount: { currency_code: "USD", value: amount.toFixed(2) },
        },
      ],
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error("Create error: " + JSON.stringify(data));
  return data.href.split("/").pop();
}

export async function sendInvoice(token, invoiceId) {
  const res = await fetch(`${BASE}/v2/invoicing/invoices/${invoiceId}/send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ send_to_recipient: true }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error("Send error: " + JSON.stringify(data));
  return data;
}

export async function getInvoiceStatus(token, invoiceId) {
  const res = await fetch(`${BASE}/v2/invoicing/invoices/${invoiceId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error("Status error: " + JSON.stringify(data));
  return data.status;
}
