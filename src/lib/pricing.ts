export function applyPercent(priceCents: number, percent: number) {
  const discount = Math.min(100, Math.max(0, Math.round(percent)));
  if (discount <= 0 || priceCents <= 0) return priceCents;
  return Math.max(0, Math.round((priceCents * (100 - discount)) / 100));
}
