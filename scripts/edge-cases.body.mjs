import * as F from './fitness.js';
import * as S from './stages.js';
import { todayKey, dayKey, buildMonthGrid } from './date.js';

export default function run() {
let pass = 0, fail = 0;
const t = (name, fn) => {
  try { fn(); console.log('  PASS ', name); pass++; }
  catch (e) { console.log('  FAIL ', name, '->', e.message); fail++; }
};
const ok = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };

const goal = (o = {}) => ({
  id: 'g', name: 'מתח', category: 'strength', tracking: 'measured', unit: 'חזרות',
  enabled: true, emphasis: false, start: 2, current: 2, final: 30, step: 1,
  lowerIsBetter: false, maintenance: false, trainingDays: [0,1,2,3,4], history: [], ...o,
});

console.log('--- אפס יעדים ---');
t('רצף עם אפס יעדים = 0', () => ok(F.computeStreak([], {}) === 0));
t('אין יעד שמתאמן היום', () => ok(F.anyGoalTrainsOn([], 3) === false));
t('סיווג יום בלי יעדים = מנוחה', () => ok(F.classifyDay([], undefined, 3, true, false) === 'rest'));

console.log('--- יעד יחיד ---');
t('התקדמות בנקודת הפתיחה = 0', () => ok(F.goalProgress(goal()) === 0));
t('התקדמות ביעד הסופי = 1', () => ok(F.goalProgress(goal({ current: 30 })) === 1));
t('span אפס לא מחלק באפס', () => ok(F.goalProgress(goal({ start: 5, final: 5, current: 5 })) === 1));
t('שיא אישי בלי היסטוריה = null', () => ok(F.personalBest(goal()) === null));
t('כל ערך ראשון הוא שיא', () => ok(F.isNewPersonalBest(goal(), 1) === true));

console.log('--- גבולות קל לי / קשה לי ---');
t('קל לי לא עובר את היעד הסופי', () => ok(F.bumpedCurrent(goal({ current: 30 })) === 30));
t('קשה לי לא יורד מתחת לפתיחה', () => ok(F.loweredCurrent(goal({ current: 2 })) === 2));
t('atStart בפתיחה', () => ok(F.atStart(goal()) === true));
const run = goal({ unit: 'זמן', lowerIsBetter: true, start: 580, current: 580, final: 480, step: 10 });
t('ריצה: קל לי מוריד זמן', () => ok(F.bumpedCurrent(run) === 570));
t('ריצה: קשה לי לא עולה מעל הפתיחה', () => ok(F.loweredCurrent(run) === 580));
t('ריצה: לא יורד מתחת ליעד', () => ok(F.bumpedCurrent({ ...run, current: 480 }) === 480));

console.log('--- עיצוב ערכים ---');
t('זמן 0 => 0:00', () => ok(F.formatValue(run, 0) === '0:00'));
t('זמן 480 => 8:00', () => ok(F.formatValue(run, 480) === '8:00'));
t('זמן 605 => 10:05', () => ok(F.formatValue(run, 605) === '10:05'));
t('חזרות מעוגלות', () => ok(F.formatValue(goal(), 12.6) === '13'));

console.log('--- עשרים יעדים ---');
const many = Array.from({ length: 20 }, (_, i) => goal({ id: 'g' + i, trainingDays: [i % 7] }));
t('20 יעדים לא שוברים רצף', () => ok(typeof F.computeStreak(many, {}) === 'number'));
t('כל קטגוריה מחזירה אייקון', () =>
  ok(['strength','run','calisthenics','aerobic','xxx'].every(c => typeof F.categoryIcon(c) === 'string')));

console.log('--- שם ארוך במיוחד ---');
const longName = 'עליות מתח רחבות באחיזה עליונה עם עצירה בנקודה העליונה';
t('שם ארוך לא שובר לוגיקה', () => ok(F.goalProgress(goal({ name: longName })) === 0));
t('אורך השם נשמר', () => ok(goal({ name: longName }).name.length > 40));

console.log('--- שלבים ---');
const stages = [
  { id:'a', name:'הרשמה', date:null, defaultLabel:'נובמבר 2026' },
  { id:'b', name:'פסיכוטכני', date:null, defaultLabel:'דצמבר 2026' },
];
t('בלי תאריך — אין ספירת ימים', () => {
  const c = S.stageCountdown(stages[0]);
  ok(c.hasDate === false, 'hasDate צריך להיות false');
  ok(c.big === 'נובמבר 2026', 'צריך להציג את החודש המשוער');
});
t('השלב הנוכחי הוא הראשון שלא עבר', () => ok(S.currentStageIndex(stages) === 0));
t('תאריך עבר מקדם את השלב', () => {
  const past = [{ ...stages[0], date: '2020-01-01' }, stages[1]];
  ok(S.currentStageIndex(past) === 1);
});
t('הכל עבר — נשארים על האחרון', () => {
  const all = stages.map(s => ({ ...s, date: '2020-01-01' }));
  ok(S.currentStageIndex(all) === all.length - 1);
});

console.log('--- לוח שנה ---');
t('כל חודש מתחלק לשבועות שלמים', () => {
  for (let m = 0; m < 12; m++) {
    const w = buildMonthGrid(2026, m);
    ok(w.every(x => x.length === 7), 'שבוע חייב 7 תאים בחודש ' + m);
  }
});
t('פברואר מעוברת', () => {
  const days = buildMonthGrid(2028, 1).flat().filter(Boolean).length;
  ok(days === 29, 'קיבלנו ' + days);
});

console.log('\n' + pass + ' עברו, ' + fail + ' נכשלו');
return fail === 0;
}
