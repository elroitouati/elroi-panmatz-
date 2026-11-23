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

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
