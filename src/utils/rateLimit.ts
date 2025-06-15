const store = new Map<string, number[]>();

export function isRateLimited(
  phone: string,
  command: string,
  max: number,
  windowMs: number
): boolean {
  const key = `${phone}:${command}`;
  const now = Date.now();

  const history = store.get(key) || [];
  const recent = history.filter((t) => now - t < windowMs);
  recent.push(now);

  store.set(key, recent);
  return recent.length > max;
}
