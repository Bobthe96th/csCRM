/**
 * Custom timezone utilities for handling Cairo timezone conversions
 * Cairo timezone: UTC+2 (standard time) / UTC+3 (daylight saving time)
 */

// IANA timezone for Cairo
const CAIRO_TZ = 'Africa/Cairo';

/**
 * Compute timezone offset (in milliseconds) for a given UTC instant and IANA zone.
 * Positive if zone is ahead of UTC.
 */
function getOffsetMsForUtcInstant(timeZone: string, utcMs: number): number {
  const dtf = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  const parts = dtf.formatToParts(new Date(utcMs));
  const map: Record<string, string> = {};
  for (const p of parts) {
    if (p.type !== 'literal') map[p.type] = p.value;
  }
  const tzLocalMs = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour),
    Number(map.minute),
    Number(map.second)
  );
  return tzLocalMs - utcMs;
}

/**
 * Convert a UTC instant (Date) to Cairo local Date by adding zone offset.
 */
function utcToZoned(dateUtc: Date, timeZone: string): Date {
  const utcMs = dateUtc.getTime();
  const offsetMs = getOffsetMsForUtcInstant(timeZone, utcMs);
  return new Date(utcMs + offsetMs);
}

/**
 * Convert Cairo local Date to UTC instant by subtracting zone offset.
 */
function zonedToUtc(zonedDate: Date, timeZone: string): Date {
  // Iterate to account for offset at the resulting instant
  let guessUtcMs = Date.UTC(
    zonedDate.getFullYear(),
    zonedDate.getMonth(),
    zonedDate.getDate(),
    zonedDate.getHours(),
    zonedDate.getMinutes(),
    zonedDate.getSeconds(),
    zonedDate.getMilliseconds()
  );
  for (let i = 0; i < 2; i += 1) {
    const offsetMs = getOffsetMsForUtcInstant(timeZone, guessUtcMs);
    guessUtcMs = Date.UTC(
      zonedDate.getFullYear(),
      zonedDate.getMonth(),
      zonedDate.getDate(),
      zonedDate.getHours(),
      zonedDate.getMinutes(),
      zonedDate.getSeconds(),
      zonedDate.getMilliseconds()
    ) - offsetMs;
  }
  return new Date(guessUtcMs);
}

/**
 * Convert a UTC date to Cairo local time
 */
export function utcToCairoTime(utcDate: Date): Date {
  return utcToZoned(utcDate, CAIRO_TZ);
}

/**
 * Convert Cairo local time to UTC
 */
export function cairoTimeToUTC(cairoDate: Date): Date {
  return zonedToUtc(cairoDate, CAIRO_TZ);
}

/**
 * Get current Cairo time
 */
export function getCurrentCairoTime(): Date {
  const utcNow = new Date();
  return utcToCairoTime(utcNow);
}

/**
 * Format a date/time for Cairo timezone display
 */
export function formatCairoDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    timeZone: CAIRO_TZ,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(d);
}

/**
 * Get current Cairo time formatted for datetime-local input (YYYY-MM-DDTHH:mm)
 */
export function getCurrentCairoDateTimeForInput(): string {
  const nowUtc = new Date();
  const cairoNow = utcToZoned(nowUtc, CAIRO_TZ);
  const year = cairoNow.getFullYear();
  const month = String(cairoNow.getMonth() + 1).padStart(2, '0');
  const day = String(cairoNow.getDate()).padStart(2, '0');
  const hours = String(cairoNow.getHours()).padStart(2, '0');
  const minutes = String(cairoNow.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Convert datetime-local input (assumed to be Cairo time) to UTC ISO string
 */
export function cairoDateTimeInputToUTC(localDateTime: string): string {
  // Parse YYYY-MM-DDTHH:mm as Cairo wall-clock, then convert to UTC using IANA zone math
  const [datePart, timePart] = localDateTime.split('T');
  const [y, m, d] = datePart.split('-').map(Number);
  const [hh, mm] = timePart.split(':').map(Number);
  const cairoLocal = new Date(y, (m - 1), d, hh, mm, 0, 0);
  const utc = zonedToUtc(cairoLocal, CAIRO_TZ);
  return utc.toISOString();
}

/**
 * Get Cairo time with added hours (useful for default scheduling time)
 */
export function getCairoTimeWithAddedHours(hoursToAdd: number): string {
  const nowCairo = utcToZoned(new Date(), CAIRO_TZ);
  nowCairo.setHours(nowCairo.getHours() + hoursToAdd);
  const year = nowCairo.getFullYear();
  const month = String(nowCairo.getMonth() + 1).padStart(2, '0');
  const day = String(nowCairo.getDate()).padStart(2, '0');
  const hours = String(nowCairo.getHours()).padStart(2, '0');
  const minutes = String(nowCairo.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Check if a Cairo datetime is in the future
 */
export function isCairoDateTimeInFuture(cairoDateTime: string): boolean {
  const cairoLocal = new Date(cairoDateTime);
  const utc = zonedToUtc(cairoLocal, CAIRO_TZ);
  return utc.getTime() > Date.now();
}

/**
 * Get timezone info for display
 */
export function getCairoTimezoneInfo(): string {
  const offsetMs = getOffsetMsForUtcInstant(CAIRO_TZ, Date.now());
  const offsetHours = offsetMs / (60 * 60 * 1000);
  return `UTC+${offsetHours}`;
}

/**
 * Get Cairo offset from UTC in hours (e.g., 2 or 3 depending on DST)
 */
export function getCairoOffsetHours(): number {
  const offsetMs = getOffsetMsForUtcInstant(CAIRO_TZ, Date.now());
  return offsetMs / (60 * 60 * 1000);
}
