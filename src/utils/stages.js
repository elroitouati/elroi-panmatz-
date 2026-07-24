import { daysUntil } from './date';

// שלב נחשב "הושלם" רק אם הוזן לו תאריך אמיתי שכבר עבר.
// בלי תאריך אמיתי אי אפשר לדעת שעבר — לכן הוא עדיין רלוונטי.
export function stageIsPast(stage) {
  return stage.date != null && daysUntil(stage.date) < 0;
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
  // בלי תאריך אמיתי — מציגים רק את התווית החודשית, בלי ספירה מדויקת
  return { big: stage.defaultLabel, small: 'התאריך המדויק יעודכן בהגדרות', hasDate: false };
}
