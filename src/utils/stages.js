import { daysUntil } from './date';

// שלב נחשב "הושלם" רק אם הוזן לו תאריך אמיתי שכבר עבר.
// בלי תאריך אמיתי אי אפשר לדעת שעבר — לכן הוא עדיין רלוונטי.
export function stageIsPast(stage) {
  if (stage.completed) return true; // סומן כהושלם (למשל: נרשמת)
  return stage.date != null && daysUntil(stage.date) < 0;
}

// מיזוג שלבים שמורים עם רשימת שלבים חדשה (עדכון גרסה):
// הסדר, השמות והפרטים מהרשימה החדשה; תאריך שהמשתמש הזין נשמר,
// אלא אם ברשימה החדשה יש תאריך ידוע.
export function mergeStages(saved, defaults) {
  const byId = Object.fromEntries((saved || []).map((s) => [s.id, s]));
  return defaults.map((d) => {
    const old = byId[d.id];
    return { ...d, date: d.date ?? old?.date ?? null };
  });
}

// אינדקס השלב הנוכחי = השלב הראשון שעדיין לא עבר.
export function currentStageIndex(stages) {
  for (let i = 0; i < stages.length; i++) {
    if (!stageIsPast(stages[i])) return i;
  }
  return stages.length - 1; // הכל עבר — נשארים על האחרון
}

// מצב שלב לצורך מפת המסלול: 'done' | 'current' | 'upcoming'
export function stageStatus(stages, index) {
  const cur = currentStageIndex(stages);
  if (index < cur) return 'done';
  if (index === cur) return 'current';
  return 'upcoming';
}

// טקסט הספירה לשלב: מספר ימים מדויק אם יש תאריך, אחרת התווית החודשית בלבד.
export function stageCountdown(stage) {
  if (stage.date != null) {
    const d = daysUntil(stage.date);
    if (d > 1) return { big: String(d), small: 'ימים נותרו', hasDate: true };
    if (d === 1) return { big: 'מחר', small: 'השלב מתקרב', hasDate: true };
    if (d === 0) return { big: 'היום', small: 'זה קורה עכשיו', hasDate: true };
    return { big: 'עבר', small: 'השלב הושלם', hasDate: true };
  }
  // בלי תאריך אמיתי — מציגים רק את התווית, בלי ספירה מדויקת; הפירוט מה-note
  return { big: stage.defaultLabel, small: stage.note || 'התאריך המדויק יעודכן בהגדרות', hasDate: false };
}

// תזכורת לשלב: ערב לפני, ב-20:00. null אם אין תאריך, השלב הושלם או שהזמן עבר.
export const STAGE_REMINDER_HOUR = 20;
export function stageReminderTime(stage, now = new Date()) {
  if (!stage?.date || stage.completed) return null;
  const [y, m, d] = stage.date.split('-').map(Number);
  const t = new Date(y, m - 1, d - 1, STAGE_REMINDER_HOUR, 0, 0);
  return t > now ? t : null;
}
