// עזרי תאריכים — הכל מקומי, בלי אזורי זמן חיצוניים

// מפתח יום אחיד בפורמט YYYY-MM-DD לפי הזמן המקומי
export function dayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayKey() {
  return dayKey(new Date());
}

// המרת מפתח יום חזרה לאובייקט Date (בחצות מקומי)
export function keyToDate(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// מספר ימים שלמים בין היום לתאריך יעד (חיובי = בעתיד)
export function daysUntil(targetKey) {
  const today = keyToDate(todayKey());
  const target = keyToDate(targetKey);
  const ms = target.getTime() - today.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

export const HEB_MONTHS = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
];

export const HEB_WEEKDAYS_SHORT = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];
export const HEB_WEEKDAYS_FULL = [
  'ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת',
];

export function formatHebDate(key) {
  const d = keyToDate(key);
  return `${d.getDate()} ב${HEB_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function monthLabel(year, monthIndex) {
  return `${HEB_MONTHS[monthIndex]} ${year}`;
}

// גבולות השבוע הנוכחי (ראשון עד שבת) — לצורך יעדים שבועיים
export function weekBounds(date = new Date()) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay()); // חזרה ליום ראשון
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start, end };
}

// האם מפתח יום נמצא בשבוע הנוכחי
export function isInThisWeek(key) {
  const { start, end } = weekBounds();
  const d = keyToDate(key);
  return d >= start && d <= end;
}

// בניית לוח חודשי — מערך של שבועות, כל שבוע 7 תאים (null לתאים ריקים)
export function buildMonthGrid(year, monthIndex) {
  const first = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const startWeekday = first.getDay(); // 0=ראשון
  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(dayKey(new Date(year, monthIndex, d)));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}
