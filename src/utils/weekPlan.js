// התוכנית השבועית: סוג אימון לכל יום בשבוע.

export const WORKOUTS = {
  strength: { label: 'אימון כוח', short: 'כוח', icon: 'barbell' },
  run: { label: 'ריצה', short: 'ריצה', icon: 'walk' },
  rest: { label: 'מנוחה', short: 'מנוחה', icon: 'moon' },
};
export const WORKOUT_ORDER = ['strength', 'run', 'rest'];

export function workoutFor(plan, weekday) {
  const type = plan?.[weekday];
  return WORKOUTS[type] ? type : 'rest';
}

// ימים שנשלחת בהם תזכורת: ימי אימון של יעדים פעילים + ימים שאינם מנוחה בתוכנית
export function reminderDays(goals, plan) {
  const days = new Set();
  (goals || []).forEach((g) => { if (g.enabled) g.trainingDays.forEach((d) => days.add(d)); });
  (plan || []).forEach((t, d) => { if (WORKOUTS[t] && t !== 'rest') days.add(d); });
  return [...days].sort((a, b) => a - b);
}

// ספירה לסיכום: { strength: 3, run: 3, rest: 1 }
export function planCounts(plan) {
  const c = { strength: 0, run: 0, rest: 0 };
  for (let d = 0; d < 7; d++) c[workoutFor(plan, d)] += 1;
  return c;
}
