import { dayKey, todayKey } from './date';

// לוגיקת יעדים מתקדמים (progressive goals) ומדדים

// עיצוב ערך יעד לתצוגה: זמן ריצה כדקות:שניות, אחרת מספר גולמי
export function formatValue(goal, value) {
  if (goal.unit === 'זמן') {
    const v = Math.max(0, Math.round(value));
    const m = Math.floor(v / 60);
    const s = v % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }
  return String(Math.round(value));
}

// טקסט יחידה קצר לתצוגה ליד המספר
export function unitLabel(goal) {
  if (goal.unit === 'זמן') return 'דק׳';
  if (goal.unit === 'חזרות') return 'חז׳';
  return '';
}

// אחוז ההתקדמות של יעד מ-start ליעד הסופי (0..1)
export function goalProgress(goal) {
  const span = Math.abs(goal.final - goal.start);
  if (span === 0) return 1;
  const done = Math.abs(goal.current - goal.start);
  return Math.max(0, Math.min(1, done / span));
}

// האם היעד הנוכחי כבר הגיע ליעד הסופי
export function reachedFinal(goal) {
  if (goal.lowerIsBetter) return goal.current <= goal.final;
  return goal.current >= goal.final;
}

// חישוב היעד הנוכחי הבא אחרי לחיצת "קל לי" — עולה בהדרגה עד היעד הסופי
export function bumpedCurrent(goal) {
  if (goal.lowerIsBetter) {
    return Math.max(goal.final, goal.current - goal.step);
  }
  return Math.min(goal.final, goal.current + goal.step);
}

// חישוב היעד הנוכחי אחרי לחיצת "קשה לי" — יורד בהדרגה, לא מתחת לנקודת הפתיחה
export function loweredCurrent(goal) {
  if (goal.lowerIsBetter) {
    // בריצה זמן גבוה יותר = קל יותר
    return Math.min(goal.start, goal.current + goal.step);
  }
  return Math.max(goal.start, goal.current - goal.step);
}

// האם היעד כבר ברמת הבסיס (אי אפשר להוריד עוד)
export function atStart(goal) {
  if (goal.lowerIsBetter) return goal.current >= goal.start;
  return goal.current <= goal.start;
}

// האם יום מסוים (0=ראשון..6=שבת) הוא יום אימון עבור היעד
export function isTrainingWeekday(goal, weekday) {
  return goal.trainingDays.includes(weekday);
}

// האם יעד כלשהו פעיל מתאמן ביום השבוע הנתון (לצורך סיווג היום בלוח)
export function anyGoalTrainsOn(goals, weekday) {
  return goals.some((g) => g.enabled && g.trainingDays.includes(weekday));
}

// סיווג מצב יום בלוח: 'done' | 'rest' | 'missed' | 'future' | 'empty'
// log = רשומת היום (או undefined), weekday = יום בשבוע, isPast = האם עבר
export function classifyDay(goals, log, weekday, isPast, isToday) {
  const trainingDay = anyGoalTrainsOn(goals, weekday);
  const trained = log && log.trained;
  if (trained) return 'done';
  if (!trainingDay) return 'rest';
  if (isToday) return 'today';
  if (isPast) return 'missed';
  return 'future';
}

// שיא אישי עבור יעד נמדד — הערך הטוב ביותר בהיסטוריה
export function personalBest(goal) {
  if (!goal.history || goal.history.length === 0) return null;
  const values = goal.history.map((h) => h.value);
  return goal.lowerIsBetter ? Math.min(...values) : Math.max(...values);
}

// בדיקה אם ערך חדש הוא שיא אישי (לצורך התראת חיזוק)
export function isNewPersonalBest(goal, value) {
  const best = personalBest(goal);
  if (best == null) return true;
  return goal.lowerIsBetter ? value < best : value > best;
}

// אייקון ייצוגי לפי קטגוריית היעד — לתגי-אייקון עגולים ברחבי האפליקציה
export function categoryIcon(category) {
  switch (category) {
    case 'strength': return 'barbell-outline';
    case 'run': return 'walk-outline';
    case 'calisthenics': return 'body-outline';
    case 'aerobic': return 'heart-outline';
    default: return 'ellipse-outline';
  }
}

// רצף ימי אימון נוכחי — נספר אחורה מהיום, ימים שאינם ימי אימון לא שוברים רצף
export function computeStreak(goals, logs) {
  let streak = 0;
  const today = todayKey();
  const cursor = new Date();
  for (let i = 0; i < 400; i++) {
    const k = dayKey(cursor);
    const trainingDay = anyGoalTrainsOn(goals, cursor.getDay());
    const trained = logs[k]?.trained;
    if (trainingDay) {
      if (trained) streak += 1;
      else if (k !== today) break; // היום עוד לא נגמר — לא שובר את הרצף
    }
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
