// סדרות מספרים. כל סדרה נבנית מחוק, והמסיחים הם הטעויות הנפוצות של אותו חוק
// (הפרש אחרון במקום החוק, טעות של ±1, חוק של הסדרה השנייה וכו').
import { makeRng, withDistractors } from './rng';

const SUBS = ['add', 'mul', 'alt', 'fib', 'diff2', 'powers', 'mixed'];

function build(r, sub) {
  switch (sub) {
    case 'add': {
      const a = r.int(2, 60), d = r.pick([3, 4, 6, 7, 8, 9, 11, 12, 13, -3, -4, -6, -7, -9]);
      const s = Array.from({ length: 6 }, (_, i) => a + (d < 0 ? 80 : 0) + d * i);
      return { seq: s, explain: `בכל צעד ${d > 0 ? 'מוסיפים' : 'מחסירים'} ${Math.abs(d)}.`, near: [s[5] + d, s[5] - d] };
    }
    case 'mul': {
      const a = r.int(1, 5), m = r.pick([2, 3, 2, 3, 4]);
      const s = Array.from({ length: 6 }, (_, i) => a * m ** i);
      return { seq: s, explain: `כל מספר כפול ${m} מהקודם.`, near: [s[4] * m + m, s[5] + (s[4] - s[3]), s[5] * (m + 1)] };
    }
    case 'alt': {
      const a = r.int(1, 20), b = r.int(20, 60), da = r.pick([2, 3, 4, 5]), db = r.pick([-2, -3, -4, -5, 6, 7]);
      const s = [];
      for (let i = 0; i < 4; i++) { s.push(a + da * i); s.push(b + db * i); }
      const seq = s.slice(0, 7);
      return {
        seq, explain: `שתי סדרות שמשולבות לסירוגין: במקומות האי־זוגיים ${da > 0 ? '+' : ''}${da}, ובזוגיים ${db > 0 ? '+' : ''}${db}. המספר הבא שייך לסדרה השנייה.`,
        near: [seq[6] + da, seq[6] + db, s[7] + db],
      };
    }
    case 'fib': {
      const a = r.int(1, 6), b = r.int(2, 9);
      const s = [a, b];
      while (s.length < 7) s.push(s[s.length - 1] + s[s.length - 2]);
      return { seq: s, explain: 'כל מספר הוא סכום שני המספרים שלפניו.', near: [s[6] + s[4], s[6] * 2, s[6] + 1] };
    }
    case 'diff2': {
      const a = r.int(1, 30), d0 = r.int(1, 5), dd = r.pick([1, 2, 3]);
      const s = [a];
      for (let i = 0; i < 5; i++) s.push(s[i] + d0 + dd * i);
      const lastD = d0 + dd * 4;
      return { seq: s, explain: `ההפרשים גדלים ב־${dd} בכל צעד: ${Array.from({ length: 5 }, (_, i) => d0 + dd * i).join(', ')}…`, near: [s[5] + lastD, s[5] + lastD + 2 * dd, s[5] + lastD + dd + 1] };
    }
    case 'powers': {
      const kind = r.pick(['sq', 'sq1', 'cube']);
      const st = r.int(1, 5);
      const f = kind === 'sq' ? (n) => n * n : kind === 'sq1' ? (n) => n * n + 1 : (n) => n * n * n;
      const s = Array.from({ length: 6 }, (_, i) => f(st + i));
      const ex = kind === 'sq' ? 'ריבועים של מספרים עוקבים' : kind === 'sq1' ? 'ריבוע ועוד 1 של מספרים עוקבים' : 'חזקות שלישיות של מספרים עוקבים';
      return { seq: s, explain: `${ex}: ${st}, ${st + 1}, ${st + 2}…`, near: [s[5] + (s[5] - s[4]), f(st + 6) + 1, f(st + 6) - 1] };
    }
    default: { // mixed: ‎×2 ואז ‎+k לסירוגין
      const a = r.int(1, 8), k = r.pick([1, 2, 3, 4, 5]), m = r.pick([2, 3]);
      const s = [a];
      for (let i = 0; i < 6; i++) s.push(i % 2 === 0 ? s[i] * m : s[i] + k);
      return { seq: s, explain: `שתי פעולות מתחלפות: ‎×${m} ואז ‎+${k}.`, near: [s[6] + k, s[6] * m + k, s[6] * (m + 1)] };
    }
  }
}

export function seriesQuestion(seed, sub) {
  const r = makeRng(seed);
  const picked = r.pick(SUBS);
  const s = sub && SUBS.includes(sub) ? sub : picked;
  const { seq, explain, near } = build(r, s);
  const shown = seq.slice(0, -1);
  const correct = seq[seq.length - 1];
  const fallback = [correct + 1, correct - 1, correct + 2, correct - 2, correct + 10];
  const { options, answer } = withDistractors(r, correct, [...near.filter((n) => Number.isFinite(n)), ...fallback], String);
  return {
    topic: 'series', sub: s, seed, kind: 'series',
    prompt: 'איזה מספר ממשיך את הסדרה?',
    seq: shown,
    options: options.map(String), answer, explain,
  };
}
