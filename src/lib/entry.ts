/**
 * Helpers for the per-runner entry fields: typed finish times and
 * free-form ("own route") distances.
 */

export const MIN_TIME_MS = 60 * 1000; // 1:00
export const MAX_TIME_MS = 3 * 60 * 60 * 1000; // 3:00:00
export const MIN_OWN_DISTANCE_KM = 0.5;
export const MAX_OWN_DISTANCE_KM = 30;
export const OWN_DISTANCE_PRESETS = [3, 5, 8, 10];

/** Format ms as m:ss, or h:mm:ss over an hour. */
export function formatTimeMs(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0
    ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    : `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Turn what was typed into the time field's display text.
 * Phone number pads have no ':' key, so plain digits get colons inserted
 * from the right (2745 → 27:45, 10210 → 1:02:10). If a colon was typed,
 * the text is kept as typed (digits and colons only).
 */
export function autoFormatTimeText(raw: string): string {
  if (raw.includes(':')) {
    return raw.replace(/[^\d:]/g, '').slice(0, 8);
  }
  const d = raw.replace(/\D/g, '').slice(0, 6);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, -2)}:${d.slice(-2)}`;
  return `${d.slice(0, -4)}:${d.slice(-4, -2)}:${d.slice(-2)}`;
}

export type TimeParse = { ok: true; ms: number } | { ok: false; error: string };

/** Parse "mm:ss" or "h:mm:ss" with the sanity limits used on race day. */
export function parseTimeText(text: string): TimeParse {
  const t = text.trim();
  if (!t) return { ok: false, error: 'Enter a time' };
  const parts = t.split(':');
  if (parts.length < 2 || parts.length > 3 || parts.some((p) => !/^\d+$/.test(p))) {
    return { ok: false, error: 'Use mm:ss or h:mm:ss' };
  }
  const nums = parts.map(Number);
  const [h, m, s] = nums.length === 3 ? nums : [0, nums[0], nums[1]];
  if (s > 59) return { ok: false, error: 'Seconds must be 00–59' };
  if (m > 59) return { ok: false, error: 'Minutes must be 00–59 (use h:mm:ss)' };
  const ms = (h * 3600 + m * 60 + s) * 1000;
  if (ms < MIN_TIME_MS) return { ok: false, error: 'Too short: at least 1:00' };
  if (ms > MAX_TIME_MS) return { ok: false, error: 'Too long: at most 3:00:00' };
  return { ok: true, ms };
}

export type DistanceParse = { ok: true; km: number } | { ok: false; error: string };

export function parseDistanceText(text: string): DistanceParse {
  const t = text.trim().replace(',', '.');
  if (!t) return { ok: false, error: 'Pick or enter a distance' };
  if (!/^\d+(\.\d*)?$|^\.\d+$/.test(t)) return { ok: false, error: 'Enter km, e.g. 5 or 6.4' };
  const km = Number(t);
  if (km < MIN_OWN_DISTANCE_KM) return { ok: false, error: `At least ${MIN_OWN_DISTANCE_KM} km` };
  if (km > MAX_OWN_DISTANCE_KM) return { ok: false, error: `At most ${MAX_OWN_DISTANCE_KM} km` };
  return { ok: true, km: Math.round(km * 100) / 100 };
}

export function isOwnDistanceValid(km: number | undefined): boolean {
  return typeof km === 'number' && km >= MIN_OWN_DISTANCE_KM && km <= MAX_OWN_DISTANCE_KM;
}
