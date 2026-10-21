// All backend calls live here. Components never call fetch directly.
const API = import.meta.env.VITE_API_URL || "https://splitpay-ai.onrender.com";

async function request(path, options = {}) {
  const res = await fetch(API + path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  let data = {};
  try {
    data = await res.json();
  } catch {
    // empty or non-JSON response
  }
  if (!res.ok || data.error) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

const post = (path, body) =>
  request(path, { method: "POST", body: JSON.stringify(body) });

// ----- Contacts -----
export const getContacts = () => request("/api/contacts").then((d) => d.contacts);
export const addContact = (c) => post("/api/contacts", c).then((d) => d.contact);
export const deleteContact = (id) => request(`/api/contacts/${id}`, { method: "DELETE" });

// ----- Splits (each returns a preview: { description, total, paidBy, shares }) -----
export const aiSplit = (message, people) => post("/api/split", { message, people });
export const manualSplit = (payload) => post("/api/split/manual", payload);
export const splitByItems = (payload) => post("/api/split/items", payload);
export const scanReceipt = (imageBase64, mimeType) =>
  post("/api/receipt/scan", { imageBase64, mimeType });

// ----- Send invoices and check status -----
export const sendInvoices = (preview) => post("/api/send", preview).then((d) => d.invoices);
export const getInvoices = () => request("/api/invoices").then((d) => d.invoices);

// Shrinks a phone photo before upload (the server accepts up to 10 MB of JSON)
export function resizeImage(file, maxSize = 1280) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      resolve({ imageBase64: dataUrl.split(",")[1], mimeType: "image/jpeg" });
    };
    img.onerror = () => reject(new Error("Could not read that image"));
    img.src = url;
  });
}
