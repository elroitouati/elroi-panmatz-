// בדיקות לעולם המבחן: מחוללים, מנוע חזרות ומוח. מריץ: node scripts/test-exam.mjs
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'exam-'));
function copy(dir, rel = '') {
  for (const f of fs.readdirSync(path.join(dir, rel))) {
    const p = path.join(rel, f);
    const full = path.join(dir, p);
    if (fs.statSync(full).isDirectory()) { fs.mkdirSync(path.join(tmp, p), { recursive: true }); copy(dir, p); continue; }
    if (!f.endsWith('.js')) continue;
    // רק קבצי לוגיקה (בלי React)
    const src = fs.readFileSync(full, 'utf8');
    if (/from 'react|from 'react-native|from 'expo/.test(src)) continue;
    fs.writeFileSync(path.join(tmp, p), src.replace(/from '(\.{1,2}\/[^']+?)(\.js)?'/g, "from '$1.js'"));
  }
}
copy(path.join(root, 'src/exam'));
const imp = (p) => import(pathToFileURL(path.join(tmp, p)).href);

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) pass++; else { fail++; console.log('✗', msg); } };

const { makeQuestion } = await imp('gen/index.js');
const { TOPICS } = await imp('topics.js');
const { WORDS } = await imp('data/words.js');
const { ANALOGIES } = await imp('data/analogies.js');
const { LESSONS } = await imp('data/lessons.js');

// ---- כל מחולל, כל תת־נושא, 400 זרעים ----
for (const t of TOPICS) {
  for (const [sub] of [...t.subs, [null]]) {
    let bad = 0, sample;
    for (let s = 1; s <= 400; s++) {
      const q = makeQuestion({ topic: t.id, sub, seed: s * 7919 });
      const opts = q.options.map((o) => JSON.stringify(o));
      const valid = q.options.length === 4 && new Set(opts).size === 4 && q.answer >= 0 && q.answer < 4 && q.prompt && q.explain
        && !opts.some((o) => o.includes('NaN') || o.includes('undefined') || o.includes('Infinity'));
      if (!valid) { bad++; sample = sample || q; }
      if (t.id === 'series') {
        // גרסה 2: התשובה היא זוג ("x, y") והוא חייב להתאים ל־answerPair
        const all = [...q.seq, ...q.answerPair];
        if (all.some((n) => !Number.isFinite(Number(n))) || q.options[q.answer] !== q.answerPair.join(', ') || q.blanks !== 2) { bad++; sample = q; }
      }
    }
    ok(bad === 0, `${t.id}/${sub}: ${bad} שאלות פגומות ${sample ? JSON.stringify(sample).slice(0, 300) : ''}`);
  }
}
// שחזור: שאלה שנוצרה בלי תת-נושא/פריט נבנית מחדש זהה כשמעבירים את מה שנבחר בפועל
for (const t of TOPICS) {
  for (const [sub] of [[null], ...t.subs]) {
    let diff = 0;
    for (let s = 1; s <= 150; s++) {
      const a = makeQuestion({ topic: t.id, sub, seed: s * 131 });
      const b = makeQuestion({ topic: t.id, sub: a.sub, seed: s * 131, ref: a.ref });
      if (JSON.stringify(a) !== JSON.stringify(b)) diff++;
    }
    ok(diff === 0, `שחזור ${t.id}/${sub}: ${diff} שונות`);
  }
}
// דטרמיניזם: אותו זרע = אותה שאלה
ok(JSON.stringify(makeQuestion({ topic: 'logic', sub: 'order', seed: 42 })) === JSON.stringify(makeQuestion({ topic: 'logic', sub: 'order', seed: 42 })), 'same seed same question');
ok(makeQuestion({ topic: 'vocab', sub: null, seed: 5, ref: WORDS[10].id }).wordId === WORDS[10].id, 'vocab ref respected');

// ---- גרסה 1 (שאלות ישנות שנשמרו) ממשיכה להיבנות בדיוק כמו קודם ----
ok(makeQuestion({ topic: 'series', sub: 'add', seed: 5, qid: 'series:add:5:' }).v === 1, 'qid ישן → מחולל v1');
ok(makeQuestion({ topic: 'series', sub: 'add', seed: 5, qid: 'series:add:5::v2' }).v === 2, 'qid חדש → מחולל v2');
ok(makeQuestion({ topic: 'series', sub: 'add', seed: 5 }).v === 2, 'שאלה חדשה → v2');
ok(makeQuestion({ topic: 'series', sub: 'add', seed: 5, v: 1 }).id === 'series:add:5:', 'מזהה v1 לא השתנה');
ok(/:v2$/.test(makeQuestion({ topic: 'logic', sub: 'order', seed: 5 }).id), 'מזהה v2 מסומן');
for (const t of TOPICS) {
  let bad = 0;
  for (let s = 1; s <= 60; s++) {
    const a = makeQuestion({ topic: t.id, seed: s * 17, v: 1 });
    const b = makeQuestion({ topic: t.id, sub: a.sub, seed: s * 17, ref: a.ref, qid: a.id });
    if (JSON.stringify(a) !== JSON.stringify(b) || a.options.length !== 4) bad++;
  }
  ok(bad === 0, `v1 ${t.id} נבנית מחדש מה־qid (${bad})`);
}

// סדרות v1: התשובה באמת ממשיכה את החוק (בדיקה ידנית לתת־נושא add)
for (let s = 1; s < 200; s++) {
  const q = makeQuestion({ topic: 'series', sub: 'add', seed: s, v: 1 });
  const d = q.seq[1] - q.seq[0];
  ok(Number(q.options[q.answer]) === q.seq[q.seq.length - 1] + d, `series add ${s}`);
}
// צורות v1: חיבור = איחוד
for (let s = 1; s < 200; s++) {
  const q = makeQuestion({ topic: 'figures', sub: 'union', seed: s, v: 1 });
  const a = q.matrix[6].s, b = q.matrix[7].s, c = q.options[q.answer].s;
  ok(JSON.stringify([...new Set([...a, ...b])].sort((x, y) => x - y)) === JSON.stringify(c), `figures union ${s}`);
}
// צורות v2: חיבור לפי שורה או לפי טור; ביטול; התא החסר הוא האחרון (למטה מימין)
const U = (a, b) => JSON.stringify([...new Set([...a, ...b])].sort((x, y) => x - y));
const X = (a, b) => JSON.stringify([...a, ...b].filter((x) => !(a.includes(x) && b.includes(x))).sort((x, y) => x - y));
for (let s = 1; s < 200; s++) {
  const q = makeQuestion({ topic: 'figures', sub: 'union', seed: s });
  const m = q.matrix, c = JSON.stringify(q.options[q.answer].s);
  const row = U(m[6].s, m[7].s) === c && U(m[0].s, m[1].s) === JSON.stringify(m[2].s);
  const col = U(m[2].s, m[5].s) === c && U(m[0].s, m[3].s) === JSON.stringify(m[6].s);
  ok(q.ltr && (row || col), `figures v2 union ${s}`);
  const z = makeQuestion({ topic: 'figures', sub: 'xor', seed: s });
  const n = z.matrix, d = JSON.stringify(z.options[z.answer].s);
  ok((X(n[6].s, n[7].s) === d && X(n[0].s, n[1].s) === JSON.stringify(n[2].s)) || (X(n[2].s, n[5].s) === d && X(n[0].s, n[3].s) === JSON.stringify(n[6].s)), `figures v2 xor ${s}`);
}
// סדרות v2: הזוג הנכון מופיע פעם אחת, ותמיד יש מסיח שהמספר הראשון בו נכון
for (let s = 1; s < 300; s++) {
  const q = makeQuestion({ topic: 'series', seed: s });
  const firsts = q.options.map((o) => o.split(', ')[0]);
  ok(q.options.filter((o) => o === q.answerPair.join(', ')).length === 1 && firsts.filter((f) => f === String(q.answerPair[0])).length >= 2, `series v2 pair ${s}`);
}
// היגיון v2: "אין פתרון" מופיע גם כמסיח וגם כתשובה נכונה
{
  let asAns = 0, asWrong = 0;
  for (let s = 1; s < 400; s++) {
    const q = makeQuestion({ topic: 'logic', sub: 'order', seed: s });
    const i = q.options.indexOf('אין פתרון');
    if (i === q.answer) asAns++; else if (i >= 0) asWrong++;
  }
  ok(asAns > 10 && asWrong > 50, `אין פתרון: נכון ${asAns}, מסיח ${asWrong}`);
}

// ---- תוכן ----
ok(WORDS.length >= 480, `מאגר מילים: ${WORDS.length}`);
ok(WORDS.every((w) => w.m && w.s && w.m.split(' ').length <= 6), 'כל מילה עם פירוש קצר ומשפט');
ok(new Set(WORDS.map((w) => w.id)).size === WORDS.length, 'מזהי מילים ייחודיים');
ok(ANALOGIES.length >= 60 && ANALOGIES.every((a) => a.wrong.length === 3 && a.pair.includes(':') && a.correct.includes(':')), `אנלוגיות: ${ANALOGIES.length}`);
for (const t of TOPICS) {
  const L = LESSONS[t.id];
  ok(L && L.length >= 5, `שיעור ל-${t.id}`);
  const check = L.find((s) => s.check);
  ok(check && check.check.options.length === 4, `בדיקה בשיעור ${t.id}`);
}

// ---- חזרה מרווחת ----
const srs = await imp('engine/srs.js');
let c = srs.review(null, true, '2026-11-23');
ok(c.box === 1 && c.due === '2026-11-24', 'srs first know');
c = srs.review(c, true, '2026-11-24');
ok(c.box === 2 && c.due === '2026-11-26', 'srs box2');
c = srs.review(c, false, '2026-11-26');
ok(c.box === 1 && c.lapses === 1 && c.due === '2026-11-27', 'srs lapse');
const deck = srs.todaysDeck(WORDS, {}, '2026-11-23');
ok(deck.length === 10, 'new words per day = 10');
const deck2 = srs.todaysDeck(WORDS, {}, '2026-11-23', { newIntroducedToday: 10 });
ok(deck2.length === 0, 'no more new words after 10');

// ---- המוח ----
const brain = await imp('engine/brain.js');
const base = {
  createdAt: '2026-11-23', attempts: [], cards: {}, lessons: {}, errors: {}, daily: {}, diagnosticDone: false,
  settings: { examDate: '2027-01-28', dailyMinutes: 30, simDates: ['2026-12-18', '2027-01-08', '2027-01-22'], offDays: [] },
};
let plan = brain.planForDay(base, '2026-11-23');
ok(plan.tasks[0].id === 'diagnostic', 'first day = diagnostic');
const st = { ...base, diagnosticDone: true };
plan = brain.planForDay(st, '2026-11-24');
ok(plan.tasks.some((t) => t.id === 'practice') && plan.tasks.some((t) => t.id === 'words'), 'regular day has practice + words');
ok(plan.tasks.reduce((s, t) => s + t.minutes, 0) <= 36, `regular day ≈30 min (${plan.tasks.reduce((s, t) => s + t.minutes, 0)})`);
ok(brain.planForDay(st, '2026-11-27').tasks[0].id === 'weekly', 'friday = weekly check');
ok(brain.planForDay(st, '2026-12-18').tasks[0].id === 'sim', 'sim day');
ok(brain.planForDay({ ...st, settings: { ...st.settings, offDays: ['2026-11-25'] } }, '2026-11-25').off, 'off day');
const daily = brain.buildDaily(st, '2026-11-24', 18);
ok(daily.length === 18, `daily count ${daily.length}`);
let adj = 0; for (let i = 1; i < daily.length; i++) if (daily[i].topic === daily[i - 1].topic) adj++;
ok(adj <= 2, `interleaving (${adj} רצופים)`);
ok(new Set(daily.map((d) => d.topic)).size >= 4, 'daily mixes ≥4 topics');
// חולשה מקבלת יותר שאלות
const weakAttempts = [];
for (let i = 0; i < 30; i++) {
  weakAttempts.push({ topic: 'figures', sub: 'xor', ok: i % 4 === 0, ms: 50000, d: '2026-11-24' });
  weakAttempts.push({ topic: 'vocab', sub: 'tierA', ok: true, ms: 15000, d: '2026-11-24' });
}
const st2 = { ...st, attempts: weakAttempts };
const d2 = brain.buildDaily(st2, '2026-11-25', 18);
ok(d2.filter((x) => x.topic === 'figures').length > d2.filter((x) => x.topic === 'vocab').length, 'weak topic gets more questions');
ok(brain.statsFor(weakAttempts, 'vocab').mastery > 0.8, 'mastery high for all-correct');
ok(brain.statsFor(weakAttempts, 'figures').mastery < 0.4, 'mastery low for weak');
const r = brain.readiness(weakAttempts);
ok(r > 0 && r < 1, `readiness ${r.toFixed(2)}`);
const p = brain.pace(st2, '2026-12-20');
ok(['ahead', 'on', 'behind'].includes(p.status) && p.daysLeft === 39, `pace ${p.status} ${p.daysLeft}`);
const dec = brain.decisions(st2, '2026-11-25');
ok(dec.length >= 2 && dec.some((d) => d.text.includes('צורות')), 'decisions mention weak topic');
ok(brain.buildDiagnostic().length === 24, 'diagnostic 24');
ok(brain.buildWeekly('2026-11-27').length === 32, 'weekly 32');
// פזיזות
const rushed = Array.from({ length: 12 }, () => ({ topic: 'logic', sub: 'order', ok: false, ms: 8000, d: '2026-11-24' }));
ok(brain.statsFor(rushed, 'logic').fastWrong >= 3, 'detects rushing');

// ---- מיזוג בין מכשירים ----
const { mergeExam, fingerprint } = await imp('engine/merge.js');
const A = { ...base, diagnosticDone: true, settingsAt: 5, settings: { ...base.settings, dailyMinutes: 40 },
  attempts: [{ t: 1, topic: 'vocab', seed: 1, sid: 's1', ok: true }, { t: 3, topic: 'logic', seed: 2, sid: 's1', ok: false }],
  sessions: [{ id: 's1', t: 3 }], cards: { w1: { box: 2, seen: 2, last: '2026-11-24' } },
  errors: { q1: { topic: 'logic', ts: 10 } }, errorsGone: {}, lessons: { series: { done: true, step: 8, at: '2026-11-24' } },
  daily: { '2026-11-24': { plan: { tasks: [] }, done: { words: true } } }, newToday: { d: '2026-11-24', n: 4 } };
const B = { ...base, settingsAt: 9, settings: { ...base.settings, dailyMinutes: 30 },
  attempts: [{ t: 2, topic: 'series', seed: 5, sid: 's2', ok: true }, { t: 1, topic: 'vocab', seed: 1, sid: 's1', ok: true }],
  sessions: [{ id: 's2', t: 2 }], cards: { w1: { box: 3, seen: 3, last: '2026-11-25' }, w2: { box: 1, seen: 1, last: '2026-11-25' } },
  errors: {}, errorsGone: { q1: 20 }, lessons: { series: { step: 3 }, figures: { step: 2 } },
  daily: { '2026-11-24': { done: { practice: true } } }, newToday: { d: '2026-11-24', n: 7 } };
const M = mergeExam(A, B);
ok(M.attempts.length === 3 && M.attempts.map((x) => x.t).join() === '1,2,3', 'attempts union sorted, no dupes');
ok(M.sessions.length === 2, 'sessions union');
ok(M.cards.w1.box === 3 && M.cards.w2, 'newer card wins');
ok(!M.errors.q1, 'error resolved on other device stays resolved');
ok(M.settings.dailyMinutes === 30, 'latest settings win');
ok(M.lessons.series.done && M.lessons.series.step === 8 && M.lessons.figures.step === 2, 'lessons merged');
ok(M.daily['2026-11-24'].done.words && M.daily['2026-11-24'].done.practice && M.daily['2026-11-24'].plan, 'daily done merged');
ok(M.newToday.n === 7 && M.diagnosticDone, 'newToday max, diagnostic OR');
ok(fingerprint(mergeExam(A, B)) === fingerprint(mergeExam(B, A)), 'merge symmetric');
ok(fingerprint(mergeExam(M, M)) === fingerprint(M), 'merge idempotent');
ok(fingerprint(mergeExam(M, A)) === fingerprint(M), 'merge absorbs older copy');
const R = { ...base, resetAt: 100, attempts: [] };
ok(mergeExam(M, R).attempts.length === 0 && mergeExam(R, M).attempts.length === 0, 'reset wins over older data');
const E2 = mergeExam({ ...A, errors: { q1: { topic: 'logic', ts: 30 } } }, B);
ok(!!E2.errors.q1, 'error made again after resolve comes back');

// ---- דקדוק בשאלות היגיון ----
let gram = 0;
for (let sd = 1; sd < 400; sd++) {
  const q = makeQuestion({ topic: 'logic', sub: 'order', seed: sd });
  if (/(בתיה|דנה|הדר|ורד) (עומד (?!אדם)|ראשון|אחרון)/.test(q.prompt) || /(אבי|גיל|זיו) (עומדת|ראשונה|אחרונה)/.test(q.prompt)) gram++;
}
ok(gram === 0, `logic grammar (${gram})`);

// ---- מדד מוכנות: לא קופץ מכמה שאלות בודדות ----
{
  const r0 = brain.readiness([]);
  ok(Math.abs(r0 - 0.25) < 1e-9, `בלי נתונים = ניחוש (${r0})`);
  const few = Array.from({ length: 3 }, (_, i) => ({ topic: 'vocab', sub: 'tierB', ok: true, ms: 9000, mode: 'daily', d: '2026-11-25' }));
  const sFew = brain.statsFor(few, 'vocab', 'tierB').mastery;
  ok(sFew < 0.45, `3 תשובות נכונות לא נותנות יותר מ־45% (${sFew.toFixed(2)})`);
  const st = brain.strengthOf(few, 'vocab');
  ok(st.covered === 0 && st.strength < 0.35, `נושא עם סוג אחד שתורגל מעט — חוזק נמוך (${st.strength.toFixed(2)})`);
  const many = TOPICS.flatMap((t) => t.subs.flatMap(([sub]) => Array.from({ length: 40 }, () => ({ topic: t.id, sub, ok: true, ms: 5000, mode: 'daily', d: '2026-12-01' }))));
  ok(brain.readiness(many) > 0.85, `הכול נכון בכל הסוגים → מוכנות גבוהה (${brain.readiness(many).toFixed(2)})`);
  ok(brain.readinessConfidence(few).solid === false && brain.readinessConfidence(many).solid === true, 'ביטחון במדד');
}

// ---- סימולציה של 70 ימי שימוש ----
const { makeRng } = await imp('gen/rng.js');
const time = await imp('engine/time.js');
{
  const rng = makeRng(99);
  let S = { ...base, attempts: [], diagnosticDone: false };
  let day = '2026-11-23';
  let bad = 0;
  for (let k = 0; k < 70; k++) {
    const plan = brain.planForDay(S, day);
    const mins = plan.tasks.reduce((a, t) => a + (t.minutes || 0), 0);
    if (!plan.off && (mins < 5 || mins > 200 || plan.tasks.some((t) => !t.title || !Number.isFinite(t.minutes)))) bad++;
    let items = [];
    for (const t of plan.tasks) {
      if (t.kind !== 'quiz') continue;
      items = t.mode === 'daily' ? brain.buildDaily(S, day, t.count) : t.mode === 'diagnostic' ? brain.buildDiagnostic() : t.mode === 'weekly' ? brain.buildWeekly(day) : brain.buildErrors(S, t.count);
      const skill = Math.min(0.92, 0.3 + k * 0.01);
      for (const it of items) {
        const q = makeQuestion(it);
        S.attempts.push({ t: Date.now() + k * 1000, d: day, topic: it.topic, sub: q.sub, seed: it.seed, ok: rng.next() < skill, ms: 20000 + rng.int(0, 60000), mode: t.mode });
      }
      if (t.mode === 'diagnostic') { S.diagnosticDone = true; S.startReadiness = brain.readiness(S.attempts); }
    }
    const r = brain.readiness(S.attempts);
    const p = brain.pace(S, day);
    const txt = brain.decisions(S, day).map((d) => d.text).join(' ');
    if (!(r >= 0 && r <= 1) || !Number.isFinite(p.expected) || /NaN|undefined|Infinity/.test(txt + JSON.stringify(plan))) bad++;
    day = time.addDays(day, 1);
  }
  ok(bad === 0, `70 ימי שימוש בלי ערכים שבורים (${bad})`);
  ok(brain.readiness(S.attempts) > 0.5, `המוכנות עולה עם שיפור (${brain.readiness(S.attempts).toFixed(2)})`);
}
ok(brain.dailyMinutes({ ...base, attempts: [{ topic: 'vocab', ok: false, ms: 1, d: '2026-11-23' }], startReadiness: 0.6 }, '2026-11-25') === 30, 'שבוע ראשון בלי תוספת זמן');

// ---- תאריך התחלה ----
ok(brain.planForDay({ ...base, settings: { ...base.settings, startDate: '2026-11-24' } }, '2026-11-23').notStarted, 'לפני תאריך ההתחלה — אין משימות');
ok(!brain.planForDay({ ...base, settings: { ...base.settings, startDate: '2026-11-24' } }, '2026-11-24').notStarted, 'ביום ההתחלה — יש משימות');

// ---- השלמות ----
{
  const S0 = { ...base, diagnosticDone: true, settings: { ...base.settings, startDate: '2026-11-24' },
    sessions: [{ id: 'd', mode: 'diagnostic', complete: true, d: '2026-11-24', t: 1 }], attempts: [{ topic: 'vocab', sub: 'tierA', ok: true, ms: 9000, d: '2026-11-24' }] };
  // 25.11 נפתח ותורגל; 26.11 נפתח ולא תורגל; 29.11 (ראשון) — לא נפתח בכלל
  const mk = (d, done, extra = 0) => ({ plan: { tasks: [{ id: 'practice', minutes: 18 + extra, ...(extra ? { extra } : {}) }] }, done: done ? { practice: true } : {} });
  const S1 = { ...S0, daily: { '2026-11-25': mk('2026-11-25', true), '2026-11-26': mk('2026-11-26', false) } };
  const c1 = brain.catchUp(S1, '2026-11-27');
  ok(c1.debt === 18, `חוב אחרי יום שפוספס (${c1.debt})`);
  const S1w = { ...S1, sessions: [...S1.sessions, { id: 'w0', mode: 'weekly', complete: true, d: '2026-11-27', t: 2 }] };
  const p2 = brain.planForDay(S1w, '2026-11-28');
  const pr = p2.tasks.find((t) => t.id === 'practice');
  ok(pr && pr.extra === 15 && /השלמה/.test(pr.sub), `השלמה נכנסת לתרגול (${pr && pr.extra})`);
  ok(p2.minutes <= 45, `תקרת יום (${p2.minutes})`);
  // אחרי שעשה את התרגול עם התוספת — החוב יורד
  const S2 = { ...S1w, daily: { ...S1.daily, '2026-11-28': mk('2026-11-28', true, 15) } };
  ok(brain.catchUp(S2, '2026-11-29').debt === 3, `החוב יורד אחרי השלמה (${brain.catchUp(S2, '2026-11-29').debt})`);
  // בדיקה שבועית שפוספסה ביום שישי 27.11 → נכנסת ב-28.11
  const pw = brain.planForDay(S1, '2026-11-28');
  ok(pw.tasks[0].id === 'weekly' && pw.tasks[0].makeup === '2026-11-27', 'בדיקה שבועית שפוספסה עוברת ליום הבא');
  const S3 = { ...S1, sessions: [...S1.sessions, { id: 'w', mode: 'weekly', complete: true, d: '2026-11-27', t: 2 }] };
  ok(brain.planForDay(S3, '2026-11-28').tasks[0].id !== 'weekly', 'בדיקה שנעשתה לא חוזרת');
  // הבדיקה שעברה לשבת תפסה את התרגול — הדקות נכנסות לחוב מיום ראשון
  const pw2 = brain.planForDay(S1, '2026-11-28');
  ok(pw2.tasks[0].displaced >= 10, `דקות התרגול שנדחקו נרשמות (${pw2.tasks[0].displaced})`);
  const S6 = { ...S1, daily: { ...S1.daily, '2026-11-28': { plan: pw2, done: { weekly: true } } },
    sessions: [...S1.sessions, { id: 'w1', mode: 'weekly', complete: true, d: '2026-11-28', t: 3 }] };
  const c6 = brain.catchUp(S6, '2026-11-29');
  ok(c6.debt === 18 + pw2.tasks[0].displaced, `החוב כולל את התרגול שנדחק (${c6.debt})`);
  ok(!c6.weeklyDue, 'הבדיקה לא חוזרת אחרי שנעשתה');
  const p29 = brain.planForDay(S6, '2026-11-29').tasks.find((t) => t.id === 'practice');
  ok(p29 && p29.extra > 0, `ביום ראשון יש השלמה (${p29 && p29.extra})`);
  // סימולציה שפוספסה ב-18.12 (שישי) → שבת 19.12
  const S4 = { ...S0, daily: {} };
  ok(brain.planForDay(S4, '2026-12-19').tasks[0].makeup === '2026-12-18', 'סימולציה שפוספסה עוברת לשבת');
  // יום חופש לא נחשב כפספוס
  const S5 = { ...S1, settings: { ...S1.settings, offDays: ['2026-11-26'] } };
  ok(brain.catchUp(S5, '2026-11-27').debt === 0, 'יום חופש לא יוצר חוב');
  ok(brain.decisions(S1, '2026-11-27').some((d) => /פוספסו/.test(d.text)), 'ההחלטות מסבירות את ההשלמה');
}

// ---- יום חופש קבוע (שבת) ----
{
  const W = { ...base, diagnosticDone: true, settings: { ...base.settings, startDate: '2026-11-24', weeklyOff: [6], onDays: [] },
    sessions: [{ id: 'd', mode: 'diagnostic', complete: true, d: '2026-11-24', t: 1 }], attempts: [{ topic: 'vocab', ok: true, ms: 9000, d: '2026-11-24' }] };
  ok(brain.planForDay(W, '2026-11-28').off, 'שבת = חופש');
  ok(!brain.planForDay({ ...W, settings: { ...W.settings, onDays: ['2026-11-28'] } }, '2026-11-28').off, 'בכל זאת להתאמן בשבת');
  ok(brain.catchUp(W, '2026-11-30').debt === brain.catchUp({ ...W, daily: {} }, '2026-11-30').debt, 'ok');
  const c = brain.catchUp(W, '2026-11-29');
  ok(!c.weeklyDue || c.weeklyDue === '2026-11-27', 'בדיקה שבועית שפוספסה בשישי לא נופלת על שבת');
  ok(brain.planForDay(W, '2026-11-28').tasks.length === 0, 'אין משימות בשבת');
  ok(brain.planForDay(W, '2026-11-29').tasks[0].id === 'weekly', 'בדיקה שפוספסה בשישי עוברת לראשון (שבת חופש)');
  // סטטוס יום ללוח
  const D = { ...W, daily: { '2026-11-25': { plan: { tasks: [{ id: 'a', minutes: 5 }, { id: 'b', minutes: 20 }] }, done: { a: true, b: true } },
    '2026-11-26': { plan: { tasks: [{ id: 'a', minutes: 5 }, { id: 'b', minutes: 20 }] }, done: { a: true } } } };
  ok(brain.examDay(D, '2026-11-25', '2026-11-30').status === 'done', 'לוח: יום שהושלם');
  ok(brain.examDay(D, '2026-11-26', '2026-11-30').status === 'partial', 'לוח: יום חלקי');
  ok(brain.examDay(D, '2026-11-27', '2026-11-30').status === 'missed', 'לוח: יום שלא נפתח');
  ok(brain.examDay(D, '2026-11-28', '2026-11-30').status === 'off', 'לוח: שבת חופש');
  ok(brain.examDay(D, '2026-11-23', '2026-11-30').status === 'none', 'לוח: לפני ההתחלה');
  ok(brain.examDay(D, '2026-12-18', '2026-11-30').kind === 'sim', 'לוח: יום סימולציה עתידי');
  const ms = brain.examMonthStats(D, ['2026-11-24', '2026-11-25', '2026-11-26', '2026-11-27', '2026-11-28', '2026-11-29'], '2026-11-30');
  ok(ms.due === 5 && ms.done === 1, `סיכום חודשי ${ms.done}/${ms.due}`);
}

// ---- יום מוצדק: לא פספוס בלוח, אבל החומר מתפזר ----
{
  const E = { ...base, diagnosticDone: true, settings: { ...base.settings, startDate: '2026-11-24', weeklyOff: [6], excusedDays: ['2026-11-26'] },
    sessions: [{ id: 'd', mode: 'diagnostic', complete: true, d: '2026-11-24', t: 1 }], attempts: [{ topic: 'vocab', ok: true, ms: 9000, d: '2026-11-24' }],
    daily: { '2026-11-26': { plan: { tasks: [{ id: 'practice', minutes: 18 }] }, done: {} } } };
  ok(brain.examDay(E, '2026-11-26', '2026-11-27').status === 'excused', 'לוח: יום מוצדק');
  const noEx = { ...E, settings: { ...E.settings, excusedDays: [] } };
  ok(brain.catchUp(E, '2026-11-27').debt === brain.catchUp(noEx, '2026-11-27').debt && brain.catchUp(E, '2026-11-27').debt >= 18, `יום מוצדק עדיין מתפזר (${brain.catchUp(E, '2026-11-27').debt})`);
  const ms = brain.examMonthStats(E, ['2026-11-25', '2026-11-26'], '2026-11-27');
  ok(ms.due === 1, `יום מוצדק לא נספר בסיכום (${ms.due})`);
  ok(!brain.planForDay(E, '2026-11-26').off, 'יום מוצדק הוא לא יום חופש — המשימות נשארות');
}

console.log(`\n${pass} עברו, ${fail} נכשלו`);
fs.rmSync(tmp, { recursive: true, force: true });
process.exit(fail ? 1 : 0);
