// ============================================================================
//  מיזוג נתוני המבחן בין שני מכשירים (טלפון ↔ מחשב).
//  עיקרון: שום תשובה לא הולכת לאיבוד. רשימות מתאחדות לפי מזהה, מפות לפי
//  מפתח, ובמקום שיש התנגשות — הרשומה החדשה יותר (חותמת זמן) מנצחת.
//  איפוס במכשיר אחד (resetAt חדש יותר) גובר על כל מה שקדם לו.
//  הפונקציה טהורה וסימטרית: merge(a,b) ו-merge(b,a) נותנים אותו תוכן.
// ============================================================================

const MAX_ATTEMPTS = 6000;
const MAX_SESSIONS = 80;

const keysOf = (x, y) => [...new Set([...Object.keys(x || {}), ...Object.keys(y || {})])].sort();
const attemptKey = (a) => `${a.t}|${a.topic}|${a.seed}|${a.sid || ''}|${a.ref || ''}`;

function unionBy(a = [], b = [], key, sortKey) {
  const m = new Map();
  for (const x of a) m.set(key(x), x);
  for (const x of b) if (!m.has(key(x))) m.set(key(x), x);
  const out = [...m.values()];
  if (sortKey) out.sort((x, y) => (sortKey(x) < sortKey(y) ? -1 : sortKey(x) > sortKey(y) ? 1 : (key(x) < key(y) ? -1 : 1)));
  return out;
}

function newerCard(x, y) {
  if (!x) return y;
  if (!y) return x;
  if ((x.last || '') !== (y.last || '')) return (x.last || '') > (y.last || '') ? x : y;
  if ((x.seen || 0) !== (y.seen || 0)) return (x.seen || 0) > (y.seen || 0) ? x : y;
  return JSON.stringify(x) >= JSON.stringify(y) ? x : y;
}

export function mergeExam(a, b) {
  if (!a) return b;
  if (!b) return a;
  const ra = a.resetAt || 0, rb = b.resetAt || 0;
  if (ra !== rb) return ra > rb ? a : b;

  // ---- רשימות ----
  let attempts = unionBy(a.attempts, b.attempts, attemptKey, (x) => x.t);
  if (attempts.length > MAX_ATTEMPTS) attempts = attempts.slice(attempts.length - MAX_ATTEMPTS);
  let sessions = unionBy(a.sessions, b.sessions, (s) => s.id, (s) => s.t);
  if (sessions.length > MAX_SESSIONS) sessions = sessions.slice(sessions.length - MAX_SESSIONS);

  // ---- כרטיסיות מילים ----
  const cards = {};
  for (const id of keysOf(a.cards, b.cards)) cards[id] = newerCard(a.cards?.[id], b.cards?.[id]);

  // ---- טעויות + מצבות (טעות שנפתרה במכשיר אחד לא חוזרת מהשני) ----
  const gone = {};
  for (const k of keysOf(a.errorsGone, b.errorsGone)) gone[k] = Math.max(a.errorsGone?.[k] || 0, b.errorsGone?.[k] || 0);
  const errors = {};
  for (const q of keysOf(a.errors, b.errors)) {
    const x = a.errors?.[q], y = b.errors?.[q];
    const pick = !x ? y : !y ? x : (y.ts || 0) > (x.ts || 0) ? y : x;
    if ((pick.ts || 0) > (gone[q] || 0)) errors[q] = pick;
  }
  for (const k of Object.keys(gone)) if (errors[k]) delete gone[k];

  // ---- שיעורים ----
  const lessons = {};
  for (const t of keysOf(a.lessons, b.lessons)) {
    const x = a.lessons?.[t] || {}, y = b.lessons?.[t] || {};
    const ats = [x.at, y.at].filter(Boolean).sort();
    lessons[t] = { done: !!(x.done || y.done), step: Math.max(x.step || 0, y.step || 0), ...(ats.length ? { at: ats[0] } : {}) };
  }

  // ---- ימים ----
  const daily = {};
  for (const d of keysOf(a.daily, b.daily)) {
    const x = a.daily?.[d] || {}, y = b.daily?.[d] || {};
    const done = {};
    for (const k of keysOf(x.done, y.done)) done[k] = true;
    // תוכנית היום: הראשונה שנקבעה (יציב בשני המכשירים) — לפי תוכן, לא לפי סדר
    const plans = [x.plan, y.plan].filter(Boolean).sort((p, q) => (JSON.stringify(p) < JSON.stringify(q) ? -1 : 1));
    daily[d] = { plan: plans[0], done };
    if (!daily[d].plan) delete daily[d].plan;
  }

  // ---- הגדרות: האחרונה שנשמרה ----
  const settings = (b.settingsAt || 0) > (a.settingsAt || 0) ? b.settings : a.settings;
  const settingsAt = Math.max(a.settingsAt || 0, b.settingsAt || 0);

  // ---- סימולציה פתוחה ----
  const simB = (b.simAt || 0) > (a.simAt || 0);
  const activeSim = simB ? b.activeSim : a.activeSim;
  const simAt = Math.max(a.simAt || 0, b.simAt || 0);

  const na = a.newToday || { d: '', n: 0 }, nb = b.newToday || { d: '', n: 0 };
  const newToday = na.d === nb.d ? { d: na.d, n: Math.max(na.n, nb.n) } : na.d > nb.d ? na : nb;

  return {
    ...a,
    ...b,
    v: Math.max(a.v || 1, b.v || 1),
    createdAt: [a.createdAt, b.createdAt].filter(Boolean).sort()[0],
    startReadiness: a.startReadiness ?? b.startReadiness ?? null,
    diagnosticDone: !!(a.diagnosticDone || b.diagnosticDone),
    resetAt: ra,
    attempts, sessions, cards, errors, errorsGone: gone, lessons, daily,
    settings, settingsAt, activeSim, simAt, newToday,
  };
}

// טביעת אצבע יציבה — כדי לדעת אם יש בכלל מה לשלוח
export function fingerprint(s) {
  if (!s) return '';
  return [s.resetAt || 0, s.attempts?.length, s.attempts?.[s.attempts.length - 1]?.t, s.sessions?.length, Object.keys(s.cards || {}).length,
    JSON.stringify(s.cards || {}).length, Object.keys(s.errors || {}).length, JSON.stringify(s.errors || {}).length, JSON.stringify(s.lessons || {}),
    JSON.stringify(s.daily || {}).length, s.settingsAt || 0, s.simAt || 0, s.diagnosticDone ? 1 : 0, JSON.stringify(s.newToday || {})].join('|');
}
