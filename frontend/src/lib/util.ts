export function todayKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

function randomHex(bytes: number): string {
  const values = new Uint8Array(bytes);
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    crypto.getRandomValues(values);
  } else {
    for (let i = 0; i < values.length; i += 1) {
      values[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(values, (value) => value.toString(16).padStart(2, '0')).join('');
}

export function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  const part1 = randomHex(4);
  const part2 = randomHex(2);
  const part3 = `4${randomHex(2).slice(1)}`;
  const variant = ((parseInt(randomHex(1), 16) & 0x3) | 0x8).toString(16);
  const part4 = `${variant}${randomHex(2).slice(1)}`;
  const part5 = randomHex(6);
  return `${part1}-${part2}-${part3}-${part4}-${part5}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}
