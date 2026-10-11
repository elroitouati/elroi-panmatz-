import { dayKey, keyToDate, todayKey } from './date';
import { workoutFor } from './weekPlan';

// ============================================================================
//  יומן האימונים — הלוח מחובר לתוכנית השבועית.
//  יום "מחויב" = יום שהתוכנית קובעת בו אימון, או שיעד פעיל מתאמן בו.
//  יום מוצדק (מחלה/חופש) לא נחשב פספוס ולא שובר רצף.
//  לפני startedAt (תחילת המעקב) אין פספוסים — רק מה שסומן.
// ============================================================================

export function isDue(goals, plan, weekday) {
  if (workoutFor(plan, weekday) !== 'rest') return true;
  return (goals || []).some((g) => g.enabled && g.trainingDays.includes(weekday));
}

// 'done' | 'excused' | 'missed' | 'today' | 'rest' | 'future'
export function dayStatus({ goals, plan, log, key, today = todayKey(), startedAt }) {
  if (log?.trained) return 'done';
  if (log?.excused) return 'excused';
  const due = isDue(goals, plan, keyToDate(key).getDay());
  if (!due) return 'rest';
  if (key === today) return 'today';
  if (key > today) return 'future';
  if (startedAt && key < startedAt) return 'rest';
  return 'missed';
}

// רצף נוכחי: סופרים אחורה מהיום. יום מוצדק / יום בלי אימון מדלגים;
// היום עצמו עוד לא נגמר ולכן לא שובר; פספוס שובר.
export function currentStreak(goals, plan, logs, startedAt, today = todayKey()) {
  let streak = 0;
  const cursor = keyToDate(today);
  for (let i = 0; i < 800; i++) {
    const k = dayKey(cursor);
    if (startedAt && k < startedAt) break;
    const st = dayStatus({ goals, plan, log: logs[k], key: k, today, startedAt });
    if (st === 'done') streak += 1;
    else if (st === 'missed') break;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

// הרצף הארוך ביותר מאז תחילת המעקב
export function bestStreak(goals, plan, logs, startedAt, today = todayKey()) {
  const first = startedAt || Object.keys(logs).sort()[0] || today;
  let best = 0, run = 0;
  const cursor = keyToDate(first);
  for (let i = 0; i < 2000; i++) {
    const k = dayKey(cursor);
    if (k > today) break;
    const st = dayStatus({ goals, plan, log: logs[k], key: k, today, startedAt });
    if (st === 'done') { run += 1; best = Math.max(best, run); }
    else if (st === 'missed') run = 0;
    cursor.setDate(cursor.getDate() + 1);
  }
  return best;
}

// סיכום לטווח ימים (חודש / שבוע): כמה בוצעו מתוך המחויבים, ופילוח לפי סוג
export function rangeStats(keys, goals, plan, logs, startedAt, today = todayKey()) {
  const s = { done: 0, due: 0, met: 0, excused: 0, strength: 0, run: 0 };
  keys.forEach((k) => {
    if (!k || k > today) return;
    const st = dayStatus({ goals, plan, log: logs[k], key: k, today, startedAt });
    if (st === 'done') {
      s.done += 1;
      const type = workoutFor(plan, keyToDate(k).getDay());
      if (type === 'strength' || type === 'run') s[type] += 1;
    }
    if (st === 'excused') s.excused += 1;
    // היום נכנס לחישוב רק אם כבר בוצע — הוא עוד לא נגמר
    const counts = st === 'missed' || (st === 'done' && isDue(goals, plan, keyToDate(k).getDay()));
    if (counts) { s.due += 1; if (st === 'done') s.met += 1; }
  });
  s.adherence = s.due === 0 ? 0 : Math.round((s.met / s.due) * 100);
  return s;
}

// מפתחות שבוע ראשון–שבת של תאריך נתון
export function weekKeys(today = todayKey()) {
  const d = keyToDate(today);
  d.setDate(d.getDate() - d.getDay());
  const keys = [];
  for (let i = 0; i < 7; i++) { keys.push(dayKey(d)); d.setDate(d.getDate() + 1); }
  return keys;
}

// ---------------------------------------------------------------------------
//  אבני דרך ברצף: 7, 14, 30, ואחר כך כל 30 ימים.
//  last = אבן הדרך האחרונה שנחגגה (או null). חוגגים כל אבן דרך פעם אחת;
//  כשהרצף נשבר (יורד מתחת ל-last) מתחילים מחדש.
// ---------------------------------------------------------------------------
export function isMilestone(n) {
  return n === 7 || n === 14 || (n >= 30 && n % 30 === 0);
}

export function milestoneCheck(streak, last) {
  const base = last != null && streak < last ? null : last;
  if (isMilestone(streak) && base !== streak) return { celebrate: streak, last: streak };
  return { celebrate: null, last: base };
}
