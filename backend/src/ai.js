import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Tries these in order. If one is busy or missing, the next one is used.
const MODELS = [
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
];

const SYSTEM = `You split group expenses fairly.
Return ONLY valid JSON in this shape:
{"description": string, "total": number, "paidBy": string,
 "shares": [{"name": string, "amount": number}]}
Rules: "shares" includes EVERY person, including the one who paid.
Amounts are in dollars and must add up to total. Use only names from the given list.`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function parseSplit(message, people) {
  const names = people.map((p) => p.name).join(", ");
  let lastError;

  for (const model of MODELS) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const res = await ai.models.generateContent({
          model,
          contents: `People: ${names}\nExpense: ${message}`,
          config: {
            systemInstruction: SYSTEM,
            responseMimeType: "application/json",
          },
        });
        console.log("AI model used:", model);
        return verify(JSON.parse(res.text), people);
      } catch (e) {
        lastError = e;
        const busy = e.status === 503 || e.status === 429;
        const missing = e.status === 404;
        if (missing) break; // go to the next model
        if (!busy) throw e; // a real error, so stop
        await sleep(attempt * 3000); // wait 3s, then 6s
      }
    }
  }
  throw lastError;
}

// Never trust AI arithmetic: work in cents and fix rounding.
function verify(parsed, people) {
  const totalCents = Math.round(parsed.total * 100);
  const shares = parsed.shares.map((s) => ({
    name: s.name,
    cents: Math.round(s.amount * 100),
  }));

  const diff = totalCents - shares.reduce((sum, s) => sum + s.cents, 0);
  if (Math.abs(diff) > 50) {
    throw new Error("The split did not add up. Please rephrase.");
  }
  if (diff !== 0) {
    shares.sort((a, b) => b.cents - a.cents)[0].cents += diff;
  }

  return {
    description: parsed.description,
    total: totalCents / 100,
    paidBy: parsed.paidBy,
    shares: shares.map((s) => ({
      name: s.name,
      email: people.find((p) => p.name === s.name)?.email,
      phone: people.find((p) => p.name === s.name)?.phone,
      amount: s.cents / 100,
    })),
  };
}

const RECEIPT_SYSTEM = `You read receipts. Return ONLY valid JSON:
{"merchant": string, "items": [{"name": string, "price": number}],
 "tax": number, "tip": number, "total": number}
Plain numbers only. Use 0 for anything missing. Each item price is the line total for that item.`;

export async function scanReceipt(base64, mimeType) {
  let lastError;
  for (const model of MODELS) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const res = await ai.models.generateContent({
          model,
          contents: [
            {
              role: "user",
              parts: [
                { inlineData: { mimeType, data: base64 } },
                { text: "Extract the receipt." },
              ],
            },
          ],
          config: {
            systemInstruction: RECEIPT_SYSTEM,
            responseMimeType: "application/json",
          },
        });
        return JSON.parse(res.text);
      } catch (e) {
        lastError = e;
        if (e.status === 404) break;
        if (e.status !== 503 && e.status !== 429) throw e;
        await sleep(attempt * 3000);
      }
    }
  }
  throw lastError;
}
