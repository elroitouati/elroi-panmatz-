// סדרות מספרים — רמה קשה, בפורמט של תיל: בסוף הסדרה שני מקומות ריקים,
// וכל תשובה היא זוג מספרים. המסיחים: זוג שהמספר הראשון בו נכון והשני לא,
// זוג שהשני נכון והראשון לא, וזוג שבנוי מחוק "כמעט נכון".
import { makeRng, withDistractors } from './rng';

const SUBS = ['add', 'mul', 'alt', 'fib', 'diff2', 'powers', 'mixed'];
const fmt = (a, b) => `${a}, ${b}`;

// כל תבנית מחזירה { full (הסדרה כולל שני האיברים החסרים), explain, near: [חלופות ל־x], nearY: [חלופות ל־y] }
const T = {
  add: [
    (r) => { // ‎+a, ‎−b, ‎+a, ‎−(b+1)…  (בסגנון תיל, אבל ארוכה יותר)
      const a = r.int(3, 7), b = r.int(1, 2), s0 = r.int(1, 20);
      const s = [s0]; let k = 0;
      for (let i = 0; i < 8; i++) { if (i % 2 === 0) s.push(s[i] + a); else { s.push(s[i] - (b + k)); k++; } }
      return { full: s, explain: `לסירוגין: ‎+${a}, ואחר כך מחסירים מספר שגדל ב־1 בכל פעם (‎−${b}, ‎−${b + 1}, ‎−${b + 2}…).` };
    },
    (r) => { // הפרש שמחליף סימן וגדל
      const a = r.int(10, 40), d = r.int(2, 5);
      const s = [a];
      for (let i = 0; i < 8; i++) s.push(s[i] + (i % 2 === 0 ? 1 : -1) * (d + i));
      return { full: s, explain: `ההפרשים מחליפים סימן וגדלים ב־1: ‎+${d}, ‎−${d + 1}, ‎+${d + 2}, ‎−${d + 3}…` };
    },
    (r) => { // הפרשים חוזרים במחזור של שלושה
      const [p, q, w] = r.sample([2, 3, 4, 5, 6, 7, 8, -2, -3, -4], 3), a = r.int(10, 30);
      if (p + q + w === 0) return T.add[1](r); // מחזור שסכומו אפס = סדרה שחוזרת על עצמה, קל מדי
      const D = [p, q, w];
      const s = [a];
      for (let i = 0; i < 8; i++) s.push(s[i] + D[i % 3]);
      return { full: s, explain: `ההפרשים חוזרים במחזור של שלושה: ${D.map((x) => (x > 0 ? '+' : '−') + Math.abs(x)).join(', ')}, ושוב מההתחלה.` };
    },
  ],
  mul: [
    (r) => { // ×m + c
      const a = r.int(1, 5), m = r.pick([2, 3]), c = r.pick([1, 2, 3, -1]);
      const s = [a];
      for (let i = 0; i < 6; i++) s.push(s[i] * m + c);
      if (s.some((x) => x <= 0)) return T.mul[1](r);
      return { full: s, explain: `כל מספר = הקודם ×${m} ${c > 0 ? '+' : '−'} ${Math.abs(c)}.` };
    },
    (r) => { // ×1, ×2, ×3…
      const a = r.int(1, 3), st = r.int(1, 2);
      const s = [a];
      for (let i = 0; i < 6; i++) s.push(s[i] * (st + i));
      return { full: s, explain: `כופלים במספר שגדל בכל צעד: ×${st}, ×${st + 1}, ×${st + 2}…` };
    },
    (r) => { // ×2 − מספר המקום
      const a = r.int(3, 9);
      const s = [a];
      for (let i = 1; i < 8; i++) s.push(s[i - 1] * 2 - i);
      return { full: s, explain: 'כל מספר = הקודם ×2, פחות מספר הצעד (1, 2, 3…).' };
    },
  ],
  alt: [
    (r) => { // ×m לסירוגין עם −k
      const a = r.int(1, 3), b = r.int(40, 70), m = r.pick([2, 3]), k = r.int(3, 8);
      const s = [];
      for (let i = 0; i < 5; i++) { s.push(a * m ** i); s.push(b - k * i); }
      return { full: s.slice(0, 10), explain: `שתי סדרות משולבות: במקומות האי־זוגיים ×${m}, ובזוגיים ‎−${k}.` };
    },
    (r) => { // שתי סדרות עם הפרש עולה
      const a = r.int(1, 10), b = r.int(20, 50), da = r.int(1, 3), db = r.int(2, 6);
      const s = [];
      let x = a, y = b;
      for (let i = 0; i < 5; i++) { s.push(x); s.push(y); x += da + i; y -= db; }
      return { full: s, explain: `שתי סדרות משולבות: באי־זוגיים ההפרש גדל (‎+${da}, ‎+${da + 1}, ‎+${da + 2}…), ובזוגיים ‎−${db} בכל פעם.` };
    },
    (r) => { // ריבועים לסירוגין עם סדרה יורדת
      const st = r.int(1, 4), b = r.int(60, 99), k = r.pick([4, 6, 7, 9]);
      const s = [];
      for (let i = 0; i < 5; i++) { s.push((st + i) ** 2); s.push(b - k * i); }
      return { full: s, explain: `שתי סדרות משולבות: באי־זוגיים ריבועים (${st}², ${st + 1}², ${st + 2}²…), ובזוגיים ‎−${k}.` };
    },
  ],
  fib: [
    (r) => { // פיבונאצ'י עם התחלה לא רגילה
      const s = [r.int(1, 6), r.int(2, 9)];
      while (s.length < 9) s.push(s[s.length - 1] + s[s.length - 2]);
      return { full: s, explain: 'כל מספר הוא סכום שני המספרים שלפניו.' };
    },
    (r) => { // סכום שלושת הקודמים
      const s = [r.int(0, 2), r.int(1, 3), r.int(1, 4)];
      while (s.length < 9) s.push(s[s.length - 1] + s[s.length - 2] + s[s.length - 3]);
      return { full: s, explain: 'כל מספר הוא סכום שלושת המספרים שלפניו.' };
    },
    (r) => { // סכום שני הקודמים פחות קבוע
      const k = r.int(1, 3), s = [r.int(3, 8), r.int(4, 9)];
      while (s.length < 9) s.push(s[s.length - 1] + s[s.length - 2] - k);
      return { full: s, explain: `כל מספר = סכום שני הקודמים, פחות ${k}.` };
    },
  ],
  diff2: [
    (r) => { // הפרשים שמוכפלים
      const a = r.int(1, 9), d = r.int(1, 3), m = 2;
      const s = [a]; let dd = d;
      for (let i = 0; i < 7; i++) { s.push(s[i] + dd); dd *= m; }
      return { full: s, explain: `ההפרשים מוכפלים פי ${m} בכל צעד: ${s.slice(1).map((x, i) => x - s[i]).join(', ')}.` };
    },
    (r) => { // הפרשים ראשוניים
      const P = [2, 3, 5, 7, 11, 13, 17, 19, 23];
      const a = r.int(1, 20);
      const s = [a];
      for (let i = 0; i < 8; i++) s.push(s[i] + P[i]);
      return { full: s, explain: `ההפרשים הם המספרים הראשוניים: ${P.slice(0, 8).join(', ')}.` };
    },
    (r) => { // הפרשי הפרשים קבועים (גדלים ב־dd)
      const a = r.int(1, 10), d = r.int(1, 4), dd = r.int(2, 4);
      const s = [a];
      for (let i = 0; i < 8; i++) s.push(s[i] + d + dd * i);
      return { full: s, explain: `ההפרשים (${s.slice(1, 5).map((x, i) => x - s[i]).join(', ')}…) גדלים ב־${dd} בכל צעד.` };
    },
  ],
  powers: [
    (r) => { // n² ± n
      const st = r.int(1, 5), sg = r.pick([1, -1]);
      const s = Array.from({ length: 8 }, (_, i) => (st + i) ** 2 + sg * (st + i));
      return { full: s, explain: `n² ${sg > 0 ? '+' : '−'} n עבור n = ${st}, ${st + 1}, ${st + 2}…` };
    },
    (r) => { // n³ ± c
      const st = r.int(1, 3), c = r.pick([1, 2, -1, -2]);
      const s = Array.from({ length: 7 }, (_, i) => (st + i) ** 3 + c);
      return { full: s, explain: `חזקה שלישית ${c > 0 ? 'ועוד' : 'פחות'} ${Math.abs(c)}: ${st}³, ${st + 1}³, ${st + 2}³… ${c > 0 ? '+' : '−'} ${Math.abs(c)}.` };
    },
    (r) => { // חזקות של 2 ועוד מספר המקום
      const st = r.int(0, 2);
      const s = Array.from({ length: 8 }, (_, i) => 2 ** (st + i) + i);
      return { full: s, explain: `חזקות של 2 (${2 ** st}, ${2 ** (st + 1)}, ${2 ** (st + 2)}…), ועוד מספר המקום (0, 1, 2…).` };
    },
  ],
  mixed: [
    (r) => { // ×m ואז −k
      const a = r.int(3, 7), m = r.pick([2, 3]), k = r.int(1, 5);
      const s = [a];
      for (let i = 0; i < 7; i++) s.push(i % 2 === 0 ? s[i] * m : s[i] - k);
      return { full: s, explain: `שתי פעולות מתחלפות: ×${m} ואז ‎−${k}.` };
    },
    (r) => { // +k ואז ×2
      const a = r.int(2, 6), k = r.int(2, 6);
      const s = [a];
      for (let i = 0; i < 7; i++) s.push(i % 2 === 0 ? s[i] + k : s[i] * 2);
      return { full: s, explain: `שתי פעולות מתחלפות: ‎+${k} ואז ×2.` };
    },
    (r) => { // שלוש פעולות במחזור
      const a = r.int(2, 5), k = r.int(1, 4), j = r.int(2, 5);
      const ops = [(x) => x + k, (x) => x * 2, (x) => x - j];
      const s = [a];
      for (let i = 0; i < 8; i++) s.push(ops[i % 3](s[i]));
      return { full: s, explain: `שלוש פעולות במחזור: ‎+${k}, ×2, ‎−${j}, ושוב מההתחלה.` };
    },
  ],
};

export function seriesQuestion(seed, sub) {
  const r = makeRng(seed);
  const picked = r.pick(SUBS);
  const s = sub && SUBS.includes(sub) ? sub : picked;
  const tmpl = r.pick(T[s]);
  const b = tmpl(r);
  const full = b.full;
  const n = full.length;
  const x = full[n - 2], y = full[n - 1];
  const shown = full.slice(0, n - 2);
  const p = shown[shown.length - 1], pp = shown[shown.length - 2];
  const d = p - pp;
  // חלופות "כמעט נכונות": המשך בהפרש האחרון, טעות של ±1/±2, מכפלה במקום חיבור
  const nearX = [p + d, x + 1, x - 1, x + 2, x - 2, x + d].filter((v) => v !== x && Number.isFinite(v));
  const nearY = [x + (x - p), y + 1, y - 1, y + 2, y - 2, y + d].filter((v) => v !== y && Number.isFinite(v));
  const x1 = nearX[0], x2 = nearX.find((v) => v !== x1) ?? x + 3;
  const y1 = nearY[0], y2 = nearY.find((v) => v !== y1) ?? y + 3;
  const cands = [[x, y1], [x1, y], [x1, x1 + (x1 - p)], [x2, y2], [x, y2], [x2, y]];
  const { options, answer } = withDistractors(r, fmt(x, y), cands.map(([a, c]) => fmt(a, c)), String);
  return {
    topic: 'series', sub: s, seed, kind: 'series', v: 2,
    prompt: 'אילו שני מספרים ממשיכים את הסדרה?',
    seq: shown, blanks: 2, answerPair: [x, y],
    options, answer, explain: `${b.explain} לכן: ${x}, ${y}.`,
  };
}
