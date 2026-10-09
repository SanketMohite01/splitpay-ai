const cents = (n) => Math.round(Number(n) * 100);

// items: [{name, price, assignedTo:[names]}]. Returns cents owed per person.
export function splitByItems({ items, tax = 0, tip = 0 }) {
  if (!Array.isArray(items) || items.length === 0)
    throw new Error("items are required");
  const owed = {};
  let subtotal = 0;

  for (const it of items) {
    const who = it.assignedTo || [];
    if (!who.length)
      throw new Error(`Assign "${it.name}" to at least one person`);
    const price = cents(it.price);
    subtotal += price;
    const base = Math.floor(price / who.length);
    let rest = price - base * who.length;
    for (const n of who) {
      owed[n] = (owed[n] || 0) + base + (rest-- > 0 ? 1 : 0);
    }
  }

  // tax and tip are shared in proportion to each person's items
  const extra = cents(tax) + cents(tip);
  const names = Object.keys(owed);
  let allocated = 0;
  names.forEach((n, i) => {
    const part =
      i === names.length - 1
        ? extra - allocated
        : Math.round((extra * owed[n]) / subtotal);
    allocated += part;
    owed[n] += part;
  });
  return owed;
}
