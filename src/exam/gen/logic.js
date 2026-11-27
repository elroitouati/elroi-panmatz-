// שאלות היגיון — ברמה של המבחן (לפי הדוגמאות של תיל): 4–5 פריטים, 2–4 רמזים קצרים,
// ושאלה אחת שהתשובה עליה נקבעת בוודאות. כמו בתיל — לפעמים "אין פתרון",
// לפעמים "מה איננו נכון". אפשר לפתור בראש או עם שרטוט קטן, בכדקה וחצי.
//  • order — סידור: חברים בשורה, חנויות במרכז מסחרי, מבחנים בימי השבוע.
//  • match — טבלת התאמה קטנה (3 אנשים) — מהגרסה הראשונה.
//  • must  — "מה בהכרח נכון / מה איננו נכון" מקטע קצר — מהגרסה השנייה.
// כל שאלה נבדקת על כל הסידורים האפשריים: התשובה נכונה בכולם, וכל מסיח שגוי בכולם.
import { makeRng, withDistractors } from './rng';
import { logicQuestion as logicV1 } from './v1/logic';
import { logicQuestion as logicV2 } from './v2/logic';

const SUBS = ['order', 'match', 'must'];
const NO_SOL = 'אין פתרון';
const PEOPLE = ['אבי', 'בתיה', 'גיל', 'דנה', 'הדר', 'ורד', 'זיו'];
const FEM = new Set(['בתיה', 'דנה', 'הדר', 'ורד']);
const ORD = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי'];
const SHOPS = ['התקליטים', 'הבגדים', 'הנעליים', 'הצעצועים', 'הספרים'];
const TESTS = ['אנגלית', 'ספרות', 'היסטוריה', 'מתמטיקה', 'ביולוגיה'];
const DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי'];

function perms(arr) {
  if (arr.length <= 1) return [arr];
  const out = [];
  arr.forEach((x, i) => perms([...arr.slice(0, i), ...arr.slice(i + 1)]).forEach((p) => out.push([x, ...p])));
  return out;
}
const pos = (p, x) => p.indexOf(x);
const adj = (p, a, b) => Math.abs(pos(p, a) - pos(p, b)) === 1;

// ניסוח לכל הקשר
const CTX = {
  row: {
    intro: (n) => `${n} חברים עומדים בשורה (מקום 1 הוא הראשון מימין).`,
    stands: (x) => (FEM.has(x) ? 'עומדת' : 'עומד'),
    before: (a, b) => `${a} ${CTX.row.stands(a)} לפני ${b}.`,
    right: (a, b) => `${a} ${CTX.row.stands(a)} מיד לפני ${b}.`,
    adj: (a, b) => `${a} ו${b} עומדים זה ליד זה.`,
    notAdj: (a, b) => `${a} ו${b} לא עומדים זה ליד זה.`,
    edge: (a) => `${a} ${CTX.row.stands(a)} באחד מקצות השורה.`,
    notAt: (a, i) => `${a} לא ${CTX.row.stands(a)} במקום ה${ORD[i]}.`,
    at: (a, i) => `${a} ${CTX.row.stands(a)} במקום ה${ORD[i]}`,
    askAt: (i) => `מי עומד במקום ה${ORD[i]}?`,
    askNext: (x) => `מי עומד ליד ${x}?`,
    isNext: (a, b) => `${a} ו${b} עומדים זה ליד זה`,
    name: (x) => x,
    directional: true,
  },
  shops: {
    intro: (n) => `במרכז מסחרי יש ${n} חנויות סמוכות המסודרות בשורה.`,
    adj: (a, b) => `חנות ${a} נמצאת ליד חנות ${b}.`,
    notAdj: (a, b) => `חנות ${a} לא נמצאת ליד חנות ${b}.`,
    edge: (a) => `חנות ${a} נמצאת באחד מקצות השורה.`,
    askNext: (x) => `איזו חנות נמצאת ליד חנות ${x}?`,
    isNext: (a, b) => `חנות ${a} נמצאת ליד חנות ${b}`,
    name: (x) => `חנות ${x}`,
    directional: false, // בלי "ימין/שמאל" — רק שכנות, כמו בדוגמה של תיל
  },
  days: {
    intro: (n) => `${n} מבחנים נקבעו לימים ${DAYS[0]} עד ${DAYS[n - 1]}, מבחן אחד בכל יום.`,
    before: (a, b) => `המבחן ב${a} יתקיים לפני המבחן ב${b}.`,
    right: (a, b) => `המבחן ב${b} יתקיים יום אחרי המבחן ב${a}.`,
    adj: (a, b) => `המבחנים ב${a} וב${b} יתקיימו בימים סמוכים.`,
    notAdj: (a, b) => `המבחנים ב${a} וב${b} לא יתקיימו בימים סמוכים.`,
    notAt: (a, i) => `המבחן ב${a} לא יתקיים ביום ${DAYS[i]}.`,
    at: (a, i) => `המבחן ב${a} יתקיים ביום ${DAYS[i]}`,
    askAt: (i) => `איזה מבחן יתקיים ביום ${DAYS[i]}?`,
    isNext: (a, b) => `המבחנים ב${a} וב${b} יתקיימו בימים סמוכים`,
    name: (x) => x,
    directional: true,
  },
};

// רמז שנכון לגבי הסידור ref
function makeClue(r, C, items, ref) {
  const n = items.length;
  const kinds = C.directional ? ['before', 'right', 'adj', 'notAdj', 'notAt', 'edge'] : ['adj', 'adj', 'notAdj', 'edge'];
  const k = r.pick(kinds.filter((x) => C[x]));
  const [a, b] = r.sample(items, 2);
  if (k === 'before') return pos(ref, a) < pos(ref, b) ? { t: C.before(a, b), f: (p) => pos(p, a) < pos(p, b) } : { t: C.before(b, a), f: (p) => pos(p, b) < pos(p, a) };
  if (k === 'right') { const i = r.int(0, n - 2); const [x, y] = [ref[i], ref[i + 1]]; return { t: C.right(x, y), f: (p) => pos(p, y) - pos(p, x) === 1 }; }
  if (k === 'adj') { const i = r.int(0, n - 2); const [x, y] = r.shuffle([ref[i], ref[i + 1]]); return { t: C.adj(x, y), f: (p) => adj(p, x, y) }; }
  if (k === 'notAdj') return adj(ref, a, b) ? null : { t: C.notAdj(a, b), f: (p) => !adj(p, a, b) };
  if (k === 'notAt') { const i = r.pick([...Array(n).keys()].filter((j) => j !== pos(ref, a))); return { t: C.notAt(a, i), f: (p) => pos(p, a) !== i }; }
  const e = r.pick([ref[0], ref[n - 1]]);
  return { t: C.edge(e), f: (p) => pos(p, e) === 0 || pos(p, e) === n - 1 };
}

// שאלות אפשריות על המצב הנוכחי — רק כאלה שהתשובה עליהן ודאית
function askable(r, C, items, cand) {
  const n = items.length;
  const out = [];
  if (C.askAt) {
    for (let i = 0; i < n; i++) {
      const who = new Set(cand.map((p) => p[i]));
      if (who.size === 1) {
        const ans = cand[0][i];
        out.push({ prompt: C.askAt(i), correct: C.name(ans), wrong: items.filter((x) => x !== ans).map(C.name) });
      }
    }
  }
  if (C.askNext) {
    for (const x of items) {
      const always = items.filter((y) => y !== x && cand.every((p) => adj(p, x, y)));
      const never = items.filter((y) => y !== x && cand.every((p) => !adj(p, x, y)));
      if (always.length === 1 && never.length >= 2) out.push({ prompt: C.askNext(x), correct: C.name(always[0]), wrong: never.map(C.name) });
    }
  }
  return out;
}

function orderQ(r, depth = 0) {
  const ctxId = r.pick(['row', 'row', 'shops', 'days']);
  const C = CTX[ctxId];
  const n = ctxId === 'shops' ? 4 : r.pick([4, 4, 5]);
  const pool = ctxId === 'row' ? PEOPLE : ctxId === 'shops' ? SHOPS : TESTS;
  const items = r.sample(pool, n);
  const sol = r.shuffle(items);
  const all = perms(items);
  let cand = all;
  const clues = [];
  let qs = [];
  for (let g = 0; g < 40 && clues.length < 4; g++) {
    const c = makeClue(r, C, items, sol);
    if (!c || clues.some((x) => x.t === c.t)) continue;
    const next = cand.filter(c.f);
    if (next.length === cand.length) continue;
    clues.push(c); cand = next;
    if (clues.length >= 2) { qs = askable(r, C, items, cand); if (qs.length) break; }
  }
  if (!qs.length) return depth < 40 ? orderQ(r, depth + 1) : null;
  const order = ctxId === 'days' ? sol.map((x, i) => `${DAYS[i]}: ${x}`).join(', ') : sol.map(C.name).join(', ');
  const solved = cand.length === 1 ? `הסידור (${ctxId === 'days' ? 'לפי הימים' : 'מימין לשמאל'}): ${order}.` : `יש ${cand.length} סידורים אפשריים, ובכולם התשובה זהה.`;
  const head = C.intro(n);
  const kind = r.pick(['ask', 'ask', 'ask', 'ask', 'not', 'not', 'none']);

  if (kind === 'none') {
    const alt = r.shuffle(items);
    for (let k = 0; k < 40; k++) {
      const c = makeClue(r, C, items, alt);
      if (!c || clues.some((x) => x.t === c.t)) continue;
      if (cand.every((p) => !c.f(p))) {
        const shown = [...clues];
        shown.splice(r.int(0, shown.length), 0, c);
        const q = r.pick(qs);
        return { prompt: `${head}\n${shown.map((x) => '• ' + x.t).join('\n')}\n${q.prompt}`, correct: NO_SOL, wrong: [q.correct, ...r.shuffle(q.wrong).slice(0, 2)],
          explain: `הרמזים סותרים: בלי הרמז "${c.t.replace(/\.$/, '')}" ${cand.length === 1 ? `הסידור היחיד הוא ${order}, והוא לא מקיים` : `יש ${cand.length} סידורים אפשריים, ואף אחד מהם לא מקיים`} את הרמז הזה. לכן אין פתרון.` };
      }
    }
  }
  if (kind === 'not') {
    // עובדות שנכונות בכל הסידורים, ועובדה אחת ששגויה בכולם
    const facts = [];
    for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
      const [a, b] = [items[i], items[j]];
      if (cand.every((p) => adj(p, a, b))) facts.push({ t: C.isNext(a, b), ok: true });
      else if (cand.every((p) => !adj(p, a, b))) facts.push({ t: C.isNext(a, b), ok: false });
    }
    if (C.at) for (const a of items) for (let i = 0; i < n; i++) {
      if (cand.every((p) => pos(p, a) === i)) facts.push({ t: C.at(a, i), ok: true });
      else if (cand.every((p) => pos(p, a) !== i) && cand.some((p) => Math.abs(pos(p, a) - i) <= 1)) facts.push({ t: C.at(a, i), ok: false });
    }
    const T = r.shuffle(facts.filter((x) => x.ok)), F = r.shuffle(facts.filter((x) => !x.ok));
    if (T.length >= 3 && F.length >= 1) {
      return { prompt: `${head}\n${clues.map((x) => '• ' + x.t).join('\n')}\nאיזה מהמשפטים הבאים איננו נכון?`, correct: F[0].t, wrong: T.slice(0, 3).map((x) => x.t),
        explain: `${solved} לכן "${F[0].t}" — לא נכון.` };
    }
  }
  const q = r.pick(qs);
  const wrong = r.shuffle(q.wrong).slice(0, 3);
  // בתיל "אין פתרון" מופיע גם כמסיח — כדי שלא יהיה רמז שהוא התשובה
  if (wrong.length < 3) wrong.push(NO_SOL);
  else if (r.chance(0.35)) wrong[2] = NO_SOL;
  return { prompt: `${head}\n${clues.map((x) => '• ' + x.t).join('\n')}\n${q.prompt}`, correct: q.correct, wrong, explain: `${solved} התשובה: ${q.correct}.` };
}

export function logicQuestion(seed, sub) {
  const r = makeRng(seed);
  const picked = r.pick(SUBS);
  const s = sub && SUBS.includes(sub) ? sub : picked;
  // התאמה ו"בהכרח נכון" — מהגרסאות הקודמות (כבר ברמת המבחן)
  if (s === 'match') {
    const q = logicV1(seed, 'match');
    // ניסוח טבעי יותר: "לכל אחד מהחברים — ורד, דנה ואבי — יש…" (במקום "לורד, דנה, אבי יש…")
    const prompt = q.prompt.replace(/^ל(.+?), ([^,]+) יש לכל אחד /, (m, a, b) => `לכל אחד מהחברים — ${a} ו${b} — יש `);
    return { ...q, prompt, v: 3 };
  }
  if (s === 'must') return { ...logicV2(seed, 'must'), v: 3 };
  let q = orderQ(r);
  for (let k = 1; !q && k < 20; k++) q = orderQ(makeRng(seed + k * 7919));
  const { options, answer } = withDistractors(r, q.correct, q.wrong, String);
  return { topic: 'logic', sub: s, seed, kind: 'text', v: 3, prompt: q.prompt, options, answer, explain: q.explain };
}

