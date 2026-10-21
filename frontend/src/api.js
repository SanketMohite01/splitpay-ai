// All backend calls live here.
const API = "https://splitpay-ai.onrender.com";

// Flip to true after Sanket merges the database PR (/api/contacts goes live).
const USE_REAL_CONTACTS = false;

async function request(path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 90000); // Render cold start can take 50s+
  try {
    const res = await fetch(API + path, {
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      ...options,
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(body || `Request failed (${res.status})`);
    }
    return res.status === 204 ? null : await res.json();
  } catch (err) {
    if (err.name === "AbortError") throw new Error("The server took too long to respond. Try again.");
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

const post = (path, body) => request(path, { method: "POST", body: JSON.stringify(body) });

export const splitExpense = (message, people) => post("/api/split", { message, people });
export const sendInvoices = (split) => post("/api/send", split);
export const getInvoices = () => request("/api/invoices");

// ---- Contacts (fake data until the real endpoints are live) ----
let fake = [
  { id: 1, name: "Test Friend 1", email: "friend1@example.com", phone: "555-0101" },
  { id: 2, name: "Test Friend 2", email: "friend2@example.com", phone: "555-0102" },
];
let nextId = 3;

export async function getContacts() {
  if (USE_REAL_CONTACTS) return (await request("/api/contacts")).contacts;
  return [...fake];
}
export async function addContact(c) {
  if (USE_REAL_CONTACTS) return post("/api/contacts", c);
  fake = [...fake, { ...c, id: nextId++ }];
}
export async function deleteContact(id) {
  if (USE_REAL_CONTACTS) return request(`/api/contacts/${id}`, { method: "DELETE" });
  fake = fake.filter((c) => c.id !== id);
}
