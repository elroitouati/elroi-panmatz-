// הסקה מתרשים: תרשים עמודות או קו עם 5–6 ערכים, ושאלה של קריאה / השוואה / שינוי.
import { makeRng, withDistractors } from './rng';

const SETS = [
  { title: 'מספר מבקרים במוזיאון (באלפים)', labels: ['ינו׳', 'פבר׳', 'מרץ', 'אפר׳', 'מאי', 'יוני'] },
  { title: 'מכירות בחנות (ביחידות)', labels: ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳'] },
  { title: 'מספר תלמידים בשכבה', labels: ['2021', '2022', '2023', '2024', '2025'] },
  { title: 'גשם בחודש (מ״מ)', labels: ['אוק׳', 'נוב׳', 'דצמ׳', 'ינו׳', 'פבר׳', 'מרץ'] },
  { title: 'ייצור במפעל (בטונות)', labels: ['רבעון 1', 'רבעון 2', 'רבעון 3', 'רבעון 4'] },
];
const SUBS = ['read', 'compare', 'change'];

export function chartsQuestion(seed, sub) {
  const r = makeRng(seed);
  const s = sub && SUBS.includes(sub) ? sub : r.pick(SUBS);
  const set = r.pick(SETS);
  const step = r.pick([5, 10, 20]);
  const values = set.labels.map(() => step * r.int(2, 10));
  const chart = { type: r.chance(0.6) ? 'bar' : 'line', title: set.title, labels: set.labels, values, step };
  const L = set.labels;
  let text, ans, d, ex;
  if (s === 'read') {
    const i = r.int(0, L.length - 1), j = r.int(0, L.length - 1);
    if (i === j) return chartsQuestion(seed + 1, s);
    ans = values[i] + values[j];
    text = `מה הסכום של ${L[i]} ו־${L[j]}?`;
    d = [ans + step, ans - step, Math.abs(values[i] - values[j]), values[i] * 2];
    ex = `${L[i]}: ${values[i]}, ${L[j]}: ${values[j]}. סכום: ${ans}.`;
  } else if (s === 'compare') {
    const kind = r.int(0, 1);
    if (kind === 0) {
      const max = Math.max(...values), min = Math.min(...values);
      ans = max - min;
      if (ans === 0) return chartsQuestion(seed + 1, s);
      text = 'מה ההפרש בין הערך הגבוה ביותר לנמוך ביותר?';
      d = [ans + step, ans - step || step * 3, max];
      ex = `הגבוה: ${max}, הנמוך: ${min}. הפרש: ${ans}.`;
    } else {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      ans = values.filter((v) => v > avg).length;
      text = 'בכמה מהתקופות הערך גבוה מהממוצע?';
      d = [ans + 1, ans - 1, values.length - ans, ans + 2].filter((x) => x >= 0);
      ex = `הממוצע: ${Math.round(avg * 10) / 10}. מעליו: ${values.filter((v) => v > avg).join(', ') || 'אף אחד'}.`;
    }
  } else {
    let i = r.int(0, L.length - 2);
    const a = values[i], b = values[i + 1];
    const pct = ((b - a) / a) * 100;
    if (!Number.isInteger(pct) || a === b) {
      // מכוונים ערך כך שהשינוי יהיה אחוז שלם
      const p = r.pick([25, 50, -25, -50, 100, 20, -20]);
      values[i + 1] = a * (1 + p / 100);
      if (!Number.isInteger(values[i + 1])) { values[i] = 20; values[i + 1] = 20 * (1 + p / 100); }
    }
    const a2 = values[i], b2 = values[i + 1];
    ans = Math.round(((b2 - a2) / a2) * 100);
    text = `בכמה אחוזים השתנה הערך מ־${L[i]} ל־${L[i + 1]}? (שלילי = ירידה)`;
    const wrongBase = Math.round(((b2 - a2) / b2) * 100);
    d = [wrongBase, -ans, ans + 10, b2 - a2];
    ex = `שינוי: ${b2 - a2}. מחלקים בערך ההתחלתי (${a2}), לא בסופי: ${ans}%.`;
    const { options, answer } = withDistractors(r, ans, d.filter(Number.isFinite), String);
    return { topic: 'charts', sub: s, seed, kind: 'chart', chart, prompt: text, options: options.map((o) => `${o}%`), answer, explain: ex };
  }
  const { options, answer } = withDistractors(r, ans, [...d, ans + 2 * step, ans + 1].filter((x) => Number.isFinite(x) && x >= 0), String);
  return { topic: 'charts', sub: s, seed, kind: 'chart', chart, prompt: text, options: options.map(String), answer, explain: ex };
}
