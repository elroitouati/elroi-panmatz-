// ============================================================================
//  המוח — מנתח את כל הניסיונות ומחליט מה לתרגל.
//  עקרונות (מחקר על למידה):
//   • תרגול שליפה (Dunlosky 2013): לומדים דרך שאלות, לא דרך קריאה.
//   • ריווח: נושא שלא תורגל כמה ימים מקבל עדיפות.
//   • שזירה (interleaving): התרגול היומי מערבב נושאים, לא בלוק של אחד.
//   • קודם דיוק, אחר כך מהירות: לחץ זמן נכנס רק אחרי 80% דיוק.
//   • קריטריון שליטה: נושא "נשלט" רק אחרי 85% על לפחות 20 שאלות אחרונות.
//   • היכרות עם הפורמט: בדיקה שבועית וסימולציות מלאות בתנאי אמת.
//  ניתוח הזמן: תשובה מהירה מאוד ושגויה = פזיזות; שינוי מנכונה לשגויה = היסוס.
// ============================================================================
import { TOPICS, TOPIC, TIME_BUDGET, TOTAL_WEIGHT, subName } from '../topics';
import { seedFrom, makeRng } from '../gen/rng';
import { dayDiff, weekdayOf, addDays } from './time';
import { WORDS } from '../data/words';
import { todaysDeck, wordStats } from './srs';

export const TARGET = 0.9;           // היעד ביום המבחן ("100, לא 95")
export const START_BASE = 0.35;      // הערכת פתיחה לפני שיש נתונים
const PRIOR_K = 4;                   // כמה "שאלות דמיוניות" של 25% בהתחלה
const DECAY = 0.94;                  // משקל ניסיון ישן לעומת חדש
const MAX_ATTEMPTS = 6000;

export const REASONS = [
  { id: 'rule', label: 'לא ידעתי את החוק', icon: 'book-outline' },
  { id: 'calc', label: 'טעות בחישוב', icon: 'calculator-outline' },
  { id: 'read', label: 'קראתי לא נכון', icon: 'eye-outline' },
  { id: 'time', label: 'לחץ זמן', icon: 'timer-outline' },
  { id: 'guess', label: 'ניחשתי', icon: 'help-circle-outline' },
];

export function trimAttempts(list) {
  return list.length > MAX_ATTEMPTS ? list.slice(list.length - MAX_ATTEMPTS) : list;
}

// ---------------------------------------------------------------------------
//  מדדים לנושא / תת־נושא
// ---------------------------------------------------------------------------
export function statsFor(attempts, topic, sub) {
  const list = attempts.filter((a) => a.topic === topic && (!sub || a.sub === sub) && a.mode !== 'lesson');
  const n = list.length;
  let w = 0, wc = 0;
  for (let i = n - 1, k = 0; i >= 0; i--, k++) {
    const weight = DECAY ** k;
    w += weight;
    if (list[i].ok) wc += weight;
  }
  const mastery = (wc + 0.25 * PRIOR_K) / (w + PRIOR_K);
  const recent = list.slice(-20);
  const recentAcc = recent.length ? recent.filter((a) => a.ok).length / recent.length : 0;
  const okTimes = recent.filter((a) => a.ok).map((a) => a.ms);
  const avgMs = okTimes.length ? okTimes.reduce((s, x) => s + x, 0) / okTimes.length : 0;
  const budget = TIME_BUDGET[topic] * 1000;
  const fastWrong = recent.filter((a) => !a.ok && a.ms < budget * 0.35).length;
  const flipWrong = recent.filter((a) => !a.ok && a.firstOk === true).length;
  const last = n ? list[n - 1].d : null;
  return {
    n, mastery, recentAcc, avgMs, budget, fastWrong, flipWrong, last,
    mastered: recent.length >= 20 && recentAcc >= 0.85,
    speedPhase: recent.length >= 12 && recentAcc >= 0.8,
    slow: avgMs > budget * 1.25 && recent.length >= 8,
  };
}

export function topicTable(attempts) {
  return TOPICS.map((t) => ({ ...t, stats: statsFor(attempts, t.id), subs: t.subs.map(([id, name]) => ({ id, name, stats: statsFor(attempts, t.id, id) })) }));
}

// מוכנות = ממוצע משוקלל לפי משקל הנושא במבחן, עם קנס על איטיות.
export function readiness(attempts) {
  let sum = 0;
  for (const t of TOPICS) {
    const s = statsFor(attempts, t.id);
    const speed = s.slow ? 0.9 : 1;
    sum += t.weight * s.mastery * speed;
  }
  return sum / TOTAL_WEIGHT;
}

// ---------------------------------------------------------------------------
//  קצב: קו ישר מהפתיחה עד היעד ביום המבחן
// ---------------------------------------------------------------------------
export function pace(state, today) {
  const exam = state.settings.examDate;
  const start = state.startReadiness ?? START_BASE;
  const from = state.createdAt;
  const total = Math.max(1, dayDiff(from, exam));
  const elapsed = Math.min(total, Math.max(0, dayDiff(from, today)));
  const expected = start + (TARGET - start) * (elapsed / total);
  const now = readiness(state.attempts);
  const gap = now - expected;
  const status = gap >= 0.03 ? 'ahead' : gap >= -0.04 ? 'on' : 'behind';
  return { now, expected, target: TARGET, gap, status, daysLeft: Math.max(0, dayDiff(today, exam)), progress: elapsed / total };
}

export const PACE_LABEL = { ahead: 'לפני הקצב', on: 'בקצב', behind: 'מאחורי הקצב' };

// זמן יומי: 30 דקות בסיס; אם מאחרים — עולה עד 45.
export function dailyMinutes(state, today) {
  const base = state.settings.dailyMinutes || 30;
  if (!state.attempts.length) return base;
  const p = pace(state, today);
  if (p.status === 'behind') return Math.min(45, base + (p.gap < -0.1 ? 15 : 10));
  return base;
}

// ---------------------------------------------------------------------------
//  בחירת שאלות לתרגול יומי — שזירה, ריווח, חולשה
// ---------------------------------------------------------------------------
function topicPriority(attempts, t, today) {
  const s = statsFor(attempts, t.id);
  const weak = (1 - s.mastery) ** 1.5;
  // נושא שעוד לא תורגל: ריווח בינוני (לא מקסימלי) — כדי שחולשה מוכחת תקבל עדיפות
  const since = s.last ? dayDiff(s.last, today) : 2;
  const spacing = Math.min(since, 7) / 7;
  const provenWeak = s.n >= 5 && s.recentAcc < 0.6 ? 1.4 : 1;
  return t.weight * (0.15 + weak) * (0.6 + 0.6 * spacing) * provenWeak;
}

function pickSub(attempts, topicId, r) {
  const t = TOPIC[topicId];
  const scored = t.subs.map(([id]) => {
    const s = statsFor(attempts, topicId, id);
    return { id, score: (1 - s.mastery) + (s.n < 3 ? 0.4 : 0) + r.next() * 0.25 };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0].id;
}

function interleave(groups) {
  const out = [];
  const qs = groups.map((g) => g.slice());
  let last = null;
  while (qs.some((q) => q.length)) {
    qs.sort((a, b) => b.length - a.length);
    const pick = qs.find((q) => q.length && q[0].topic !== last) || qs.find((q) => q.length);
    const item = pick.shift();
    out.push(item);
    last = item.topic;
  }
  return out;
}

export function buildDaily(state, day, count) {
  const r = makeRng(seedFrom('daily', day));
  const pr = TOPICS.map((t) => ({ t, p: topicPriority(state.attempts, t, day) })).sort((a, b) => b.p - a.p);
  const chosen = pr.slice(0, 5);
  const total = chosen.reduce((s, x) => s + x.p, 0);
  const groups = chosen.map(({ t, p }, gi) => {
    const k = Math.max(2, Math.round((p / total) * count));
    return Array.from({ length: k }, (_, i) => ({ topic: t.id, sub: pickSub(state.attempts, t.id, r), seed: seedFrom('d', day, t.id, i, gi) }));
  });
  let items = interleave(groups);
  if (items.length > count) items = items.slice(0, count);
  return items;
}

export function buildTopic(state, topic, sub, count = 10, salt = '') {
  const r = makeRng(seedFrom('topic', topic, sub || '', salt));
  return Array.from({ length: count }, (_, i) => ({
    topic, sub: sub || pickSub(state.attempts, topic, r), seed: seedFrom('t', topic, sub || '', salt, i),
  }));
}

export function buildDiagnostic() {
  const groups = TOPICS.map((t) => t.subs.slice(0, 3).map(([sub], i) => ({ topic: t.id, sub, seed: seedFrom('diag', t.id, sub, i) })));
  return interleave(groups);
}

export function buildWeekly(day) {
  const groups = TOPICS.map((t) => Array.from({ length: 4 }, (_, i) => ({ topic: t.id, sub: null, seed: seedFrom('weekly', day, t.id, i) })));
  return interleave(groups);
}

export function buildErrors(state, max = 10) {
  return openErrors(state).slice(0, max).map((e) => ({ topic: e.topic, sub: e.sub, seed: e.seed, ref: e.ref, retry: true }));
}

export function openErrors(state) {
  return Object.entries(state.errors || {})
    .map(([qid, e]) => ({ qid, ...e }))
    .sort((a, b) => (a.at < b.at ? 1 : -1));
}

// ---------------------------------------------------------------------------
//  תוכנית היום
// ---------------------------------------------------------------------------
export function isSimDay(state, day) {
  return (state.settings.simDates || []).includes(day);
}

export function wordDeck(state, day) {
  const newToday = state.newToday?.d === day ? state.newToday.n : 0;
  return todaysDeck(WORDS, state.cards, day, { newIntroducedToday: newToday });
}

export function planForDay(state, day) {
  const minutes = dailyMinutes(state, day);
  const wd = weekdayOf(day);
  const off = (state.settings.offDays || []).includes(day);
  const tasks = [];
  if (off) return { minutes: 0, tasks, off: true };

  if (!state.diagnosticDone) {
    tasks.push({ id: 'diagnostic', kind: 'quiz', mode: 'diagnostic', title: 'אבחון פתיחה', sub: '24 שאלות מכל הנושאים', minutes: 25, count: 24 });
    tasks.push({ id: 'words', kind: 'cards', title: 'כרטיסיות מילים', sub: '10 מילים ראשונות', minutes: 5, count: 10 });
    return { minutes: 30, tasks };
  }
  if (isSimDay(state, day)) {
    tasks.push({ id: 'sim', kind: 'sim', title: 'סימולציה מלאה', sub: '180 שאלות · 3 שעות', minutes: 180, count: 180 });
    return { minutes: 180, tasks, sim: true };
  }
  const deck = wordDeck(state, day);
  const wordsMin = deck.length ? Math.max(3, Math.round(deck.length * 0.35)) : 0;
  if (wd === 5) {
    tasks.push({ id: 'weekly', kind: 'quiz', mode: 'weekly', title: 'בדיקה שבועית', sub: '32 שאלות · 30 דק׳ בזמן אמת', minutes: 30, count: 32 });
    if (deck.length) tasks.push({ id: 'words', kind: 'cards', title: 'כרטיסיות מילים', sub: `${deck.length} מילים`, minutes: wordsMin, count: deck.length });
    return { minutes: 30 + wordsMin, tasks, weekly: true };
  }
  if (deck.length) tasks.push({ id: 'words', kind: 'cards', title: 'כרטיסיות מילים', sub: `${deck.length} מילים`, minutes: wordsMin, count: deck.length });
  const errs = openErrors(state).length;
  let errMin = 0;
  if (errs >= 3) {
    const n = Math.min(8, errs);
    errMin = Math.max(4, Math.round(n * 0.8));
    tasks.push({ id: 'errors', kind: 'quiz', mode: 'errors', title: 'חזרה על טעויות', sub: `${n} שאלות שטעית בהן`, minutes: errMin, count: n });
  }
  // שיעור: הנושא החלש ביותר שעוד לא נלמד
  const lessonTopic = nextLessonTopic(state, day);
  let lessonMin = 0;
  if (lessonTopic) {
    lessonMin = 6;
    tasks.push({ id: `lesson-${lessonTopic}`, kind: 'lesson', topic: lessonTopic, title: `לימוד: ${TOPIC[lessonTopic].name}`, sub: 'הסבר קצר עם דוגמאות', minutes: lessonMin });
  }
  const practiceMin = Math.max(10, minutes - wordsMin - errMin - lessonMin);
  const count = Math.max(8, Math.round((practiceMin * 60) / 55));
  tasks.splice(lessonTopic ? tasks.length : tasks.length, 0, { id: 'practice', kind: 'quiz', mode: 'daily', title: 'תרגול מעורב', sub: `${count} שאלות משולבות`, minutes: practiceMin, count });
  return { minutes, tasks };
}

export function nextLessonTopic(state, day) {
  const pending = TOPICS.filter((t) => !state.lessons?.[t.id]?.done);
  if (!pending.length) return null;
  // שיעור אחד ביום לכל היותר; אם כבר נלמד שיעור היום — לא מוסיפים
  if (Object.values(state.lessons || {}).some((l) => l.at === day && l.done)) return null;
  pending.sort((a, b) => statsFor(state.attempts, a.id).mastery - statsFor(state.attempts, b.id).mastery);
  return pending[0].id;
}

export function dayProgress(state, day) {
  const plan = planForDay(state, day);
  const done = state.daily?.[day]?.done || {};
  const finished = plan.tasks.filter((t) => done[t.id]).length;
  return { plan, done, finished, total: plan.tasks.length, remaining: plan.tasks.filter((t) => !done[t.id]) };
}

// ---------------------------------------------------------------------------
//  מה המערכת החליטה — הסבר אנושי לכל החלטה (רק במסך ההתקדמות)
// ---------------------------------------------------------------------------
export function decisions(state, today) {
  const out = [];
  if (!state.attempts.length) {
    out.push({ icon: 'compass-outline', text: 'מתחילים באבחון פתיחה — 3 שאלות מכל נושא, כדי לדעת מאיפה להתחיל.' });
    return out;
  }
  const p = pace(state, today);
  const mins = dailyMinutes(state, today);
  if (p.status === 'behind') out.push({ icon: 'trending-up', text: `הזמן היומי עלה ל־${mins} דקות — המוכנות ${Math.round(p.now * 100)}% והקצב דורש ${Math.round(p.expected * 100)}%.` });
  else if (p.status === 'ahead') out.push({ icon: 'checkmark-circle-outline', text: `אתה לפני הקצב (${Math.round(p.now * 100)}% מול ${Math.round(p.expected * 100)}%). שומרים על ${mins} דקות ביום.` });

  const table = topicTable(state.attempts).filter((t) => t.stats.n >= 5);
  const weakest = [...table].sort((a, b) => a.stats.mastery - b.stats.mastery)[0];
  if (weakest) {
    const sub = [...weakest.subs].filter((s) => s.stats.n >= 2).sort((a, b) => a.stats.mastery - b.stats.mastery)[0];
    out.push({ icon: 'locate-outline', text: `יותר שאלות ב${weakest.name}${sub ? ` (בעיקר ${sub.name})` : ''} — דיוק ${Math.round(weakest.stats.recentAcc * 100)}% לאחרונה.` });
  }
  for (const t of table) {
    if (t.stats.fastWrong >= 3) out.push({ icon: 'flash-outline', text: `${t.stats.fastWrong} טעויות מהירות ב${t.name}. עונים מהר מדי — קרא את כל ארבע התשובות לפני שבוחרים.` });
    if (t.stats.flipWrong >= 2) out.push({ icon: 'swap-vertical', text: `ב${t.name} שינית ${t.stats.flipWrong} פעמים תשובה נכונה לשגויה. סמוך על הניתוח הראשון.` });
    if (t.stats.mastered) out.push({ icon: 'ribbon-outline', text: `${t.name} — נשלט (85%+). עובר לחזרה מרווחת, פחות שאלות ביום.` });
    else if (t.stats.speedPhase && t.stats.slow) out.push({ icon: 'timer-outline', text: `${t.name}: הדיוק טוב, עכשיו מהירות. היעד ${Math.round(TIME_BUDGET[t.id])} שניות לשאלה, כרגע ${Math.round(t.stats.avgMs / 1000)}.` });
  }
  const reasons = {};
  Object.values(state.errors || {}).forEach((e) => { if (e.reason) reasons[e.reason] = (reasons[e.reason] || 0) + 1; });
  if ((reasons.read || 0) >= 3) out.push({ icon: 'eye-outline', text: `${reasons.read} טעויות קריאה. לפני שבוחרים — לקרוא את השאלה עד הסוף, במיוחד מילים כמו "לא" ו"בהכרח".` });
  if ((reasons.rule || 0) >= 3) out.push({ icon: 'book-outline', text: 'כמה טעויות של "לא ידעתי את החוק" — כדאי לחזור על הלימוד בנושאים האלה.' });
  const errs = openErrors(state).length;
  if (errs) out.push({ icon: 'bookmark-outline', text: `${errs} שאלות במחברת הטעויות. כל אחת חוזרת עד שעונים נכון פעמיים.` });
  const ws = wordStats(WORDS, state.cards, today);
  if (ws.due) out.push({ icon: 'albums-outline', text: `${ws.due} מילים לחזרה היום (חזרה מרווחת). ${ws.mastered} מילים כבר נשלטות.` });
  const next = nextSimDate(state, today);
  if (next) out.push({ icon: 'calendar-outline', text: `הסימולציה המלאה הבאה: ${fmtDay(next)} — 3 שעות בתנאי מבחן.` });
  return out.slice(0, 7);
}

export function nextSimDate(state, today) {
  return (state.settings.simDates || []).filter((d) => d >= today).sort()[0] || null;
}

const MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
export function fmtDay(k) {
  const [y, m, d] = k.split('-').map(Number);
  return `${d} ב${MONTHS[m - 1]}`;
}

export { addDays, subName };
