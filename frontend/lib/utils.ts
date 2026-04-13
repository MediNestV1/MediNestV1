/**
 * Returns today's date in YYYY-MM-DD format using LOCAL time.
 * IMPORTANT: Do NOT use new Date().toISOString().split('T')[0] — that uses UTC
 * and will give the wrong date for users in timezones ahead of UTC (e.g. IST).
 */
export function getLocalTodayStr(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns the YYYY-MM-DD for the start of the current week (Sunday) in LOCAL time.
 */
export function getLocalWeekStartStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay()); // Go back to Sunday
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns the YYYY-MM-DD for the start of the current month in LOCAL time.
 */
export function getLocalMonthStartStr(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
}

