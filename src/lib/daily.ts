/** Picks a different item each calendar day, cycling through the array. */
export function pickByDay<T>(items: T[]): T {
  const startOfYear = Date.UTC(new Date().getUTCFullYear(), 0, 1);
  const dayOfYear = Math.floor((Date.now() - startOfYear) / 86_400_000);
  return items[dayOfYear % items.length];
}
