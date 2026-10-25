// לוגיקה טהורה לסנכרון עם My Day: אילו שורות לשלוח, ואיך להחיל סימון שהגיע מהצד השני.
// שורה = { date, goal_id, title, target, done, deleted } — אחת לכל יעד בכל יום אימון.
import { dayKey, keyToDate } from './date';
import { formatValue, unitLabel } from './fitness';

export const SYNC_BACK_DAYS = 7;
export const SYNC_FORWARD_DAYS = 7;

export function addDays(key, n) {
  const d = keyToDate(key);
  d.setDate(d.getDate() + n);
  return dayKey(d);
}

export const rowKey = (r) => `${r.date}|${r.goal_id}`;
export const signature = (r) => `${r.title}|${r.target}|${r.done ? 1 : 0}|${r.deleted ? 1 : 0}`;

// היעד הנוכחי כטקסט קצר ("5 חז׳", "9:40 דק׳")
export function goalTarget(goal) {
  if (goal.tracking !== 'measured') return '';
  const unit = unitLabel(goal);
  return `${formatValue(goal, goal.current)}${unit ? ` ${unit}` : ''}`;
}

// היעדים של יום מסוים — בדיוק כמו "יעדי היום" במסך הבית
export function rowsForDate(state, dateKey) {
  const weekday = keyToDate(dateKey).getDay();
  const log = state.logs?.[dateKey];
  return (state.goals || [])
    .filter((g) => g.enabled && g.trainingDays.includes(weekday))
    .map((g) => ({
      date: dateKey,
      goal_id: g.id,
      title: g.name,
      target: goalTarget(g),
      done: !!log?.goals?.[g.id]?.done,
      deleted: false,
    }));
}

export function rowsForRange(state, fromKey, toKey) {
  const out = {};
  for (let k = fromKey; k <= toKey; k = addDays(k, 1)) {
    rowsForDate(state, k).forEach((r) => {
      out[rowKey(r)] = r;
    });
  }
  return out;
}

// מה השתנה מאז השליחה האחרונה. יעד שנעלם (כובה / הוסר מהיום) מסומן deleted —
// רק מהיום והלאה, כדי לא למחוק היסטוריה של ימים שעברו.
export function diffRows(current, pushed, todayKey, fromKey, toKey) {
  const out = [];
  Object.entries(current).forEach(([k, r]) => {
    if (!pushed[k] || signature(pushed[k]) !== signature(r)) out.push(r);
  });
  Object.entries(pushed).forEach(([k, p]) => {
    if (current[k] || p.deleted) return;
    if (p.date < todayKey || p.date < fromKey || p.date > toKey) return;
    out.push({ ...p, deleted: true });
  });
  return out;
}

// הוספה לתור — שינוי חדש לאותו יעד ויום מחליף את הקודם (בלי כפילויות)
export function enqueue(queue, row) {
  return [...queue.filter((q) => rowKey(q) !== rowKey(row)), row];
}

// סימון/ביטול יעד ביום מסוים — כמו סימון ממסך הבית, בלי הודעות וחגיגות
export function applyDone(state, dateKey, goalId, done) {
  const goal = state.goals.find((g) => g.id === goalId);
  if (!goal) return state;
  const log = state.logs[dateKey] || { trained: false, goals: {} };
  if (!!log.goals?.[goalId]?.done === !!done) return state;
  const goalsLog = { ...(log.goals || {}) };
  if (done) {
    const value = goal.tracking === 'measured' ? goal.current : null;
    goalsLog[goalId] = { done: true, value };
    const goals = goal.tracking === 'measured' && value != null
      ? state.goals.map((g) => (g.id === goalId ? { ...g, history: [...g.history, { date: dateKey, value }].slice(-120) } : g))
      : state.goals;
    return { ...state, goals, logs: { ...state.logs, [dateKey]: { ...log, trained: true, goals: goalsLog } } };
  }
  delete goalsLog[goalId];
  const stillTrained = Object.values(goalsLog).some((v) => v.done);
  return { ...state, logs: { ...state.logs, [dateKey]: { ...log, trained: stillTrained, goals: goalsLog } } };
}
