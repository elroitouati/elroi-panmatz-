// בדיקות ללוגיקת הסנכרון עם My Day.
// הרצה:  node scripts/test-sync.mjs
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const dir = mkdtempSync(join(tmpdir(), 'panmatz-sync-'));
for (const f of ['date.js', 'fitness.js', 'syncRows.js']) {
  const src = readFileSync(join('src/utils', f), 'utf8').replace(/from '\.\/(\w+)'/g, "from './$1.js'");
  writeFileSync(join(dir, f), src);
}
const S = await import(join(dir, 'syncRows.js'));

let pass = 0, fail = 0;
const t = (name, fn) => {
  try { fn(); console.log('  PASS ', name); pass++; }
  catch (e) { console.log('  FAIL ', name, '->', e.message); fail++; }
};
const ok = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };

const goal = (o = {}) => ({
  id: 'pullups', name: 'מתח', tracking: 'measured', unit: 'חזרות', enabled: true,
  start: 2, current: 5, final: 30, step: 1, lowerIsBetter: false, trainingDays: [0, 2], history: [], ...o,
});
const state = (o = {}) => ({ goals: [goal(), goal({ id: 'core', name: 'בטן', tracking: 'check', unit: '', trainingDays: [0] })], logs: {}, ...o });

// 2026-10-25 = יום ראשון
t('יעדי יום ראשון', () => {
  const rows = S.rowsForDate(state(), '2026-10-25');
  ok(rows.length === 2);
  ok(rows[0].target === '5 חז׳', rows[0].target);
  ok(rows[1].target === '');
});
t('יום שני בלי אימון', () => ok(S.rowsForDate(state(), '2026-10-26').length === 0));
t('יעד כבוי לא נשלח', () => ok(S.rowsForDate(state({ goals: [goal({ enabled: false })] }), '2026-10-25').length === 0));
t('זמן ריצה מעוצב', () => ok(S.goalTarget(goal({ unit: 'זמן', current: 580 })) === '9:40 דק׳'));

t('diff: הכל חדש בפעם הראשונה', () => {
  const cur = S.rowsForRange(state(), '2026-10-25', '2026-10-27');
  ok(S.diffRows(cur, {}, '2026-10-25', '2026-10-25', '2026-10-27').length === 3);
});
t('diff: אין שינוי = אין שליחה', () => {
  const cur = S.rowsForRange(state(), '2026-10-25', '2026-10-27');
  ok(S.diffRows(cur, { ...cur }, '2026-10-25', '2026-10-25', '2026-10-27').length === 0);
});
t('diff: סימון נשלח', () => {
  const before = S.rowsForRange(state(), '2026-10-25', '2026-10-25');
  const after = S.rowsForRange(state({ logs: { '2026-10-25': { trained: true, goals: { pullups: { done: true } } } } }), '2026-10-25', '2026-10-25');
  const d = S.diffRows(after, before, '2026-10-25', '2026-10-25', '2026-10-25');
  ok(d.length === 1 && d[0].goal_id === 'pullups' && d[0].done === true);
});
t('diff: יעד שכובה היום → deleted, אבל לא בימים שעברו', () => {
  const pushed = {
    ...S.rowsForRange(state(), '2026-10-18', '2026-10-18'),
    ...S.rowsForRange(state(), '2026-10-25', '2026-10-25'),
  };
  const after = state({ goals: [goal()] });
  const cur = { ...S.rowsForRange(after, '2026-10-18', '2026-10-18'), ...S.rowsForRange(after, '2026-10-25', '2026-10-25') };
  const d = S.diffRows(cur, pushed, '2026-10-25', '2026-10-18', '2026-10-25');
  ok(d.length === 1 && d[0].deleted && d[0].date === '2026-10-25' && d[0].goal_id === 'core', JSON.stringify(d));
});
t('תור בלי כפילויות', () => {
  let q = [];
  q = S.enqueue(q, { date: 'd', goal_id: 'g', done: true });
  q = S.enqueue(q, { date: 'd', goal_id: 'g', done: false });
  ok(q.length === 1 && q[0].done === false);
});
t('applyDone מסמן יעד נמדד עם הערך הנוכחי', () => {
  const s = S.applyDone(state(), '2026-10-25', 'pullups', true);
  ok(s.logs['2026-10-25'].goals.pullups.done === true);
  ok(s.logs['2026-10-25'].goals.pullups.value === 5);
  ok(s.logs['2026-10-25'].trained === true);
  ok(s.goals[0].history.length === 1);
});
t('applyDone ביטול', () => {
  const s1 = S.applyDone(state(), '2026-10-25', 'core', true);
  const s2 = S.applyDone(s1, '2026-10-25', 'core', false);
  ok(!s2.logs['2026-10-25'].goals.core && s2.logs['2026-10-25'].trained === false);
});
t('applyDone ללא שינוי מחזיר את אותו אובייקט (בלי רינדור מיותר)', () => {
  const s = state();
  ok(S.applyDone(s, '2026-10-25', 'core', false) === s);
  ok(S.applyDone(s, '2026-10-25', 'nope', true) === s);
});

// ---------------------------------------------------------------------------
//  פסיכוטכני, שלבי קבלה, משימות
// ---------------------------------------------------------------------------
const TODAY = '2026-11-25';
const examPlan = (ids) => ({ tasks: ids.map((id) => ({ id, title: `T-${id}`, sub: `S-${id}`, minutes: 5 })) });
const exam = {
  daily: {
    '2026-11-24': { plan: examPlan(['diagnostic', 'words']), done: { diagnostic: true } },
    '2026-11-25': { plan: examPlan(['words', 'practice', 'lesson-series']), done: { words: true } },
  },
};
const planFor = (day) => (day === '2026-11-28' ? { tasks: [], off: true } : examPlan(['words', 'practice']));
const ctx = { exam, planFor, today: TODAY };

t('exam: היום — מהתוכנית השמורה, עם done', () => {
  const rows = S.examRowsForDate(exam, TODAY, TODAY, planFor);
  ok(rows.length === 3, rows.length);
  const w = rows.find((r) => r.goal_id === 'exam:words');
  ok(w && w.done === true && w.title === 'T-words' && w.target === 'S-words');
  ok(rows.find((r) => r.goal_id === 'exam:lesson-series').done === false);
});
t('exam: ימים קדימה — מ-planFor', () => {
  const rows = S.examRowsForDate(exam, '2026-11-26', TODAY, planFor);
  ok(rows.length === 2 && rows.every((r) => r.goal_id.startsWith('exam:') && !r.done));
});
t('exam: יום חופש — אין שורות', () => ok(S.examRowsForDate(exam, '2026-11-28', TODAY, planFor).length === 0));
t('exam: יום שעבר בלי תוכנית שמורה — אין הערכה', () => ok(S.examRowsForDate(exam, '2026-11-20', TODAY, planFor).length === 0));
t('exam: בלי מצב מבחן — אין שורות', () => ok(S.examRowsForDate(null, TODAY, TODAY, planFor).length === 0));

const stages = [
  { id: 'openday', name: 'יום פתוח', note: 'בפנימייה', date: '2026-11-22', completed: true },
  { id: 'fieldday', name: 'חצי יום שדה', note: '', date: '2026-12-10', completed: false },
  { id: 'medical', name: 'בדיקות רפואיות', date: null },
];
t('stage: רק שלבים עם תאריך', () => {
  const r = S.stageRows(stages);
  ok(r.length === 2 && r[0].goal_id === 'stage:openday' && r[0].done === true && r[0].date === '2026-11-22');
  ok(r[1].title === 'חצי יום שדה' && r[1].done === false);
});
t('task: משימות נוספות עם תאריך', () => {
  const r = S.taskRows([{ id: 'x1', date: '2026-11-30', title: 'להביא טפסים' }, { id: 'x2', title: 'בלי תאריך' }]);
  ok(r.length === 1 && r[0].goal_id === 'task:x1');
});
t('rowsForRange: אימונים + exam + stage יחד', () => {
  const st = state({ stages, tasks: [{ id: 'x1', date: '2026-11-26', title: 'טפסים' }] });
  const rows = S.rowsForRange(st, '2026-11-22', '2026-12-10', ctx);
  const ids = Object.values(rows).map((r) => r.goal_id);
  ok(ids.includes('pullups') && ids.includes('core'), 'אימונים');
  ok(ids.includes('exam:practice') && ids.includes('exam:diagnostic'), 'exam');
  ok(ids.includes('stage:openday') && ids.includes('stage:fieldday') && !ids.includes('stage:medical'), 'stage');
  ok(ids.includes('task:x1'), 'task');
});
t('rowsForRange בלי ctx — רק אימונים (כמו קודם)', () => {
  const rows = Object.values(S.rowsForRange(state(), '2026-10-25', '2026-10-27'));
  ok(rows.length === 3 && rows.every((r) => !r.goal_id.includes(':')));
});
t('diff: תוכנית לימוד שהשתנתה קדימה → השורה הישנה deleted', () => {
  const before = S.rowsForRange(state(), '2026-11-26', '2026-11-26', ctx);
  const ctx2 = { ...ctx, planFor: () => examPlan(['words', 'weekly']) };
  const after = S.rowsForRange(state(), '2026-11-26', '2026-11-26', ctx2);
  const d = S.diffRows(after, before, TODAY, '2026-11-26', '2026-11-26');
  ok(d.some((r) => r.goal_id === 'exam:practice' && r.deleted), 'practice נמחק');
  ok(d.some((r) => r.goal_id === 'exam:weekly' && !r.deleted), 'weekly נוסף');
  ok(!d.some((r) => r.goal_id === 'exam:words'), 'words לא השתנה');
});
t('diff: סימון משימת לימוד נשלח', () => {
  const before = S.rowsForRange(state(), TODAY, TODAY, ctx);
  const exam2 = { daily: { ...exam.daily, [TODAY]: { ...exam.daily[TODAY], done: { words: true, practice: true } } } };
  const after = S.rowsForRange(state(), TODAY, TODAY, { ...ctx, exam: exam2 });
  const d = S.diffRows(after, before, TODAY, TODAY, TODAY);
  ok(d.length === 1 && d[0].goal_id === 'exam:practice' && d[0].done === true);
});

t('parseGoalId לפי קידומת', () => {
  ok(S.parseGoalId('exam:lesson-verbal').type === 'exam' && S.parseGoalId('exam:lesson-verbal').id === 'lesson-verbal');
  ok(S.parseGoalId('stage:openday').type === 'stage' && S.parseGoalId('stage:openday').id === 'openday');
  ok(S.parseGoalId('task:x1').type === 'task');
  ok(S.parseGoalId('pullups').type === 'goal' && S.parseGoalId('pullups').id === 'pullups');
});
t('ניתוב: exam → onExam, בלי לגעת במצב פנמ"צ', () => {
  const st = state();
  const calls = [];
  const out = S.applyRemoteDone(st, TODAY, 'exam:practice', true, (...a) => calls.push(a));
  ok(out === st && calls.length === 1 && calls[0][0] === 'practice' && calls[0][1] === TODAY && calls[0][2] === true);
});
t('ניתוב: stage → completed', () => {
  const st = state({ stages });
  const out = S.applyRemoteDone(st, '2026-12-10', 'stage:fieldday', true);
  ok(out.stages.find((s) => s.id === 'fieldday').completed === true);
  ok(out.stages.find((s) => s.id === 'openday').completed === true);
});
t('ניתוב: task → done', () => {
  const st = state({ tasks: [{ id: 'x1', date: '2026-11-26', title: 'טפסים', done: false }] });
  ok(S.applyRemoteDone(st, '2026-11-26', 'task:x1', true).tasks[0].done === true);
});
t('ניתוב: אימון בלי קידומת — בדיוק כמו קודם', () => {
  const a = S.applyRemoteDone(state(), '2026-10-25', 'pullups', true);
  const b = S.applyDone(state(), '2026-10-25', 'pullups', true);
  ok(JSON.stringify(a) === JSON.stringify(b));
  ok(a.logs['2026-10-25'].goals.pullups.done === true);
});
t('אימונים לא נפגעים: שורות האימון זהות עם ובלי ctx', () => {
  const a = Object.values(S.rowsForRange(state(), '2026-10-25', '2026-10-27'));
  const b = Object.values(S.rowsForRange(state(), '2026-10-25', '2026-10-27', ctx)).filter((r) => !r.goal_id.includes(':'));
  ok(JSON.stringify(a) === JSON.stringify(b));
});
t('applyDone עם מזהה exam לא משנה יעדי אימון', () => {
  const st = state();
  ok(S.applyDone(st, TODAY, 'exam:practice', true) === st);
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
