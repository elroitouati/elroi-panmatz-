// תאריכים כמחרוזת YYYY-MM-DD מקומית — בלי אזורי זמן.
export function keyOf(d = new Date()) {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
export function parseKey(k) {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
}
export function addDays(k, n) {
  const d = parseKey(k);
  d.setDate(d.getDate() + n);
  return keyOf(d);
}
export function dayDiff(a, b) { // b - a בימים
  return Math.round((parseKey(b) - parseKey(a)) / 86400000);
}
export function weekdayOf(k) { return parseKey(k).getDay(); }
