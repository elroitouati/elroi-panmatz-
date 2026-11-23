// שאלות חשבון מילוליות. המספרים נבחרים כך שהתשובה שלמה — כמו במבחן, בלי מחשבון.
// המסיחים = הטעויות הנפוצות: אחוז מהמספר הלא נכון, ממוצע פשוט של מהירויות, היפוך יחס.
import { makeRng, withDistractors } from './rng';

const NAMES = ['דני', 'נועה', 'יואב', 'מיכל', 'אורי', 'שירה', 'איתי', 'תמר', 'עידו', 'רוני'];
const SUBS = ['fractions', 'percent', 'ratio', 'motion', 'work', 'average'];

function build(r, sub) {
  const n = r.pick(NAMES);
  switch (sub) {
    case 'percent': {
      const kind = r.int(0, 2);
      if (kind === 0) {
        const price = r.pick([80, 120, 160, 200, 240, 300, 400, 500]), p = r.pick([10, 15, 20, 25, 30, 40]);
        const ans = price * (100 - p) / 100;
        return { text: `מחיר חולצה ${price} ש״ח. בהנחה של ${p}%, כמה ${n} ישלם?`, ans, d: [price * p / 100, price - p, ans - 10, price * (100 + p) / 100], ex: `${p}% מ־${price} הם ${price * p / 100}. ‏${price} פחות ${price * p / 100} = ${ans}.` };
      }
      if (kind === 1) {
        const base = r.pick([40, 50, 80, 120, 200]), up = r.pick([10, 20, 25, 50]);
        const ans = base * (1 + up / 100) * (1 - up / 100);
        if (!Number.isInteger(ans)) return build(r, 'percent');
        return { text: `מחיר מוצר היה ${base} ש״ח. הוא עלה ב־${up}% ואחר כך ירד ב־${up}%. מה המחיר עכשיו?`, ans, d: [base, base * (1 + up / 100), base + up - up + 2], ex: `אחרי עלייה: ${base * (1 + up / 100)}. ירידה של ${up}% מהמחיר החדש (לא מהמקורי) נותנת ${ans} — פחות ממה שהיה.` };
      }
      const part = r.pick([6, 9, 12, 15, 18, 24]), p = r.pick([20, 25, 30, 40, 60, 75]);
      const total = part * 100 / p;
      if (!Number.isInteger(total)) return build(r, 'percent');
      return { text: `${part} תלמידים הם ${p}% מהכיתה. כמה תלמידים בכיתה?`, ans: total, d: [part * p / 100, total + part, Math.round(total / 2)], ex: `${p}% = ${part}, לכן 1% = ${part}/${p}, ו־100% = ${total}.` };
    }
    case 'fractions': {
      const den = r.pick([3, 4, 5, 6, 8]), num = r.int(1, den - 1), mult = r.pick([2, 3, 4, 5, 6]);
      const total = den * mult * r.pick([1, 2]);
      const spent = (total * num) / den;
      const rest = total - spent;
      const half = rest / 2;
      if (!Number.isInteger(half)) return build(r, 'fractions');
      return { text: `ל${n} היו ${total} ש״ח. ${n} הוציא ${num}/${den} מהכסף, ומהיתרה חצי. כמה נשאר?`, ans: half, d: [rest, spent, total - spent - total / 2], ex: `${num}/${den} מ־${total} = ${spent}. נשאר ${rest}, חצי ממנו = ${half}.` };
    }
    case 'ratio': {
      const a = r.int(1, 5), b = r.int(2, 7);
      if (a === b) return build(r, 'ratio');
      const k = r.pick([3, 4, 5, 6, 7, 8]);
      const total = (a + b) * k;
      return { text: `היחס בין בנים לבנות בחוג הוא ${a}:${b}. בחוג ${total} ילדים. כמה בנות?`, ans: b * k, d: [a * k, total / 2, b * (k + 1)], ex: `${a}+${b} = ${a + b} חלקים. כל חלק = ${total}/${a + b} = ${k}. בנות: ${b}×${k} = ${b * k}.` };
    }
    case 'motion': {
      const kind = r.int(0, 1);
      if (kind === 0) {
        const v1 = r.pick([30, 40, 60]), v2 = r.pick([20, 40, 60, 120]);
        if (v1 === v2) return build(r, 'motion');
        const d = (v1 * v2) / 10 * r.pick([1, 2]);
        const t = d / v1 + d / v2;
        const avg = (2 * d) / t;
        if (!Number.isInteger(avg) || !Number.isInteger(d)) return build(r, 'motion');
        return { text: `${n} נסע ${d} ק״מ במהירות ${v1} קמ״ש, וחזר באותה דרך במהירות ${v2} קמ״ש. מה המהירות הממוצעת בכל הנסיעה?`, ans: avg, d: [(v1 + v2) / 2, Math.max(v1, v2) - 5, avg + 5], ex: `זמן: ${d}/${v1} + ${d}/${v2} = ${t} שעות. דרך: ${2 * d}. ממוצע = ${2 * d}/${t} = ${avg} — לא הממוצע הפשוט של המהירויות.` };
      }
      const v = r.pick([4, 5, 6, 8, 10, 12, 15]), w = r.pick([2, 3, 4, 5, 6]);
      const t = r.pick([2, 3, 4]);
      return { text: `שני רוכבים יוצאים זה לקראת זה. מהירות אחד ${v} קמ״ש ושל השני ${w} קמ״ש. הם נפגשים אחרי ${t} שעות. מה המרחק ביניהם בהתחלה?`, ans: (v + w) * t, d: [Math.abs(v - w) * t, v * t, (v + w) * t + t], ex: `כשנעים זה לקראת זה המהירויות מתחברות: ${v + w} קמ״ש × ${t} = ${(v + w) * t} ק״מ.` };
    }
    case 'work': {
      const pairs = [[3, 6, 2], [4, 12, 3], [6, 12, 4], [10, 15, 6], [12, 24, 8], [5, 20, 4], [6, 3, 2], [20, 30, 12]];
      const [a, b, ans] = r.pick(pairs);
      return { text: `ברז אחד ממלא בריכה ב־${a} שעות, וברז שני ב־${b} שעות. בכמה שעות ימלאו אותה שני הברזים יחד?`, ans, d: [(a + b) / 2, a + b, Math.min(a, b) - 1].filter((x) => x > 0), ex: `בשעה: 1/${a} + 1/${b} = 1/${ans} מהבריכה. לכן יחד — ${ans} שעות. תמיד פחות מהברז המהיר.` };
    }
    default: { // average
      const k = r.pick([4, 5, 6]);
      const avg = r.int(60, 85);
      const newAvg = avg + r.pick([1, 2, 3, -2, -3]);
      const ans = newAvg * (k + 1) - avg * k;
      if (ans > 100 || ans < 20) return build(r, 'average');
      return { text: `הממוצע של ${n} ב־${k} מבחנים הוא ${avg}. איזה ציון צריך במבחן הבא כדי שהממוצע יהיה ${newAvg}?`, ans, d: [newAvg, ans + (newAvg - avg), avg + (newAvg - avg) * 2], ex: `סכום עכשיו: ${avg}×${k} = ${avg * k}. סכום דרוש: ${newAvg}×${k + 1} = ${newAvg * (k + 1)}. הפרש: ${ans}.` };
    }
  }
}

export function arithmeticQuestion(seed, sub) {
  const r = makeRng(seed);
  const picked = r.pick(SUBS);
  const s = sub && SUBS.includes(sub) ? sub : picked;
  const q = build(r, s);
  const fallback = [q.ans + 2, q.ans - 2, q.ans + 5, q.ans * 2, q.ans + 10];
  const ds = [...q.d, ...fallback].filter((x) => Number.isFinite(x) && x > 0).map((x) => Math.round(x * 100) / 100);
  const { options, answer } = withDistractors(r, q.ans, ds, String);
  return { topic: 'arithmetic', sub: s, seed, kind: 'text', prompt: q.text, options: options.map(String), answer, explain: q.ex };
}
