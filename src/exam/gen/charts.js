// הסקה מתרשים — רמה קשה: בכל תרשים שתי סדרות (עמודות מלאות ומקווקוות),
// ושאלות על אחוזים מהסכום, פערים, הפרשי סכומים, ממוצעים ואחוזי שינוי.
import { makeRng, withDistractors } from './rng';

const SETS = [
  { title: 'מכירות של שתי חנויות (ביחידות)', labels: ['ינו׳', 'פבר׳', 'מרץ', 'אפר׳', 'מאי'], series: ['חנות א׳', 'חנות ב׳'] },
  { title: 'מספר מתגייסים לשתי יחידות', labels: ['2021', '2022', '2023', '2024', '2025'], series: ['יחידה א׳', 'יחידה ב׳'] },
  { title: 'כמות גשם בשתי ערים (מ״מ)', labels: ['אוק׳', 'נוב׳', 'דצמ׳', 'ינו׳', 'פבר׳', 'מרץ'], series: ['חיפה', 'באר שבע'] },
  { title: 'ייצור בשני מפעלים (בטונות)', labels: ['רבעון 1', 'רבעון 2', 'רבעון 3', 'רבעון 4'], series: ['מפעל א׳', 'מפעל ב׳'] },
  { title: 'מבקרים בשני מוזיאונים (באלפים)', labels: ['יולי', 'אוג׳', 'ספט׳', 'אוק׳', 'נוב׳', 'דצמ׳'], series: ['מוזיאון א׳', 'מוזיאון ב׳'] },
];
const SUBS = ['read', 'compare', 'change'];
const sum = (a) => a.reduce((x, y) => x + y, 0);
// מילית יחס לפני תווית: "ב־2023" עם מקף, "בינו׳" בלי
const pre = (p, l) => (/^\d/.test(l) ? `${p}־${l}` : `${p}${l}`);

function make(r, s, depth = 0) {
  const set = r.pick(SETS);
  const step = r.pick([10, 20]);
  const A = set.labels.map(() => step * r.int(2, 9));
  const B = set.labels.map(() => step * r.int(2, 9));
  const L = set.labels, n = L.length;
  const retry = () => (depth < 40 ? make(r, s, depth + 1) : null);
  const kind = s === 'read' ? r.pick(['share', 'sum2']) : s === 'compare' ? r.pick(['gap', 'sumdiff', 'avg']) : 'change';
  let text, ans, d, ex, pct = false, opts = null;
  if (kind === 'share') {
    const k = r.int(0, n - 1);
    for (let t = 0; t < 40 && !Number.isInteger((A[k] / sum(A)) * 100); t++) { const j = r.int(0, n - 1); if (j !== k) A[j] = step * r.int(2, 9); }
    ans = (A[k] / sum(A)) * 100;
    if (!Number.isInteger(ans)) return retry();
    pct = true;
    text = `איזה אחוז מהסכום הכולל של ${set.series[0]} מהווה ${L[k]}?`;
    d = [Math.round((A[k] / (sum(A) + sum(B))) * 100), Math.round(100 / n), ans + 5, ans * 2];
    ex = `${set.series[0]} בסך הכול: ${sum(A)}. ${L[k]}: ${A[k]}. ${A[k]}/${sum(A)} = ${ans}%.`;
  } else if (kind === 'sum2') {
    const [i, j] = r.sample([...Array(n).keys()], 2);
    ans = A[i] + B[j];
    text = `מה הסכום של ${set.series[0]} ${pre('ב', L[i])} ושל ${set.series[1]} ${pre('ב', L[j])}?`;
    d = [A[i] + A[j], B[i] + B[j], A[j] + B[i], ans + step];
    ex = `${set.series[0]} ${pre('ב', L[i])}: ${A[i]}. ${set.series[1]} ${pre('ב', L[j])}: ${B[j]}. סכום: ${ans}.`;
  } else if (kind === 'gap') {
    const gaps = A.map((v, i) => Math.abs(v - B[i]));
    const mx = Math.max(...gaps);
    if (gaps.filter((g) => g === mx).length !== 1) return retry();
    const k = gaps.indexOf(mx);
    const maxA = A.indexOf(Math.max(...A)), maxB = B.indexOf(Math.max(...B));
    text = `באיזו תקופה ההפרש בין ${set.series[0]} ל${set.series[1]} הוא הגדול ביותר?`;
    opts = { correct: L[k], wrong: r.shuffle([...new Set([L[maxA], L[maxB], ...L])].filter((x) => x !== L[k])) };
    ex = `ההפרשים: ${L.map((l, i) => `${l} ${gaps[i]}`).join(', ')}. הגדול: ${L[k]} (${mx}).`;
  } else if (kind === 'sumdiff') {
    ans = Math.abs(sum(A) - sum(B));
    if (ans === 0) return retry();
    const big = sum(A) > sum(B) ? 0 : 1;
    text = `בכמה גדול הסכום הכולל של ${set.series[big]} מהסכום הכולל של ${set.series[1 - big]}?`;
    d = [ans + step, ans - step, Math.abs(Math.max(...A) - Math.max(...B)), ans + 2 * step];
    ex = `${set.series[0]}: ${sum(A)}. ${set.series[1]}: ${sum(B)}. הפרש: ${ans}.`;
  } else if (kind === 'avg') {
    const tot = sum(A) + sum(B);
    if (tot % (2 * n) !== 0) return retry();
    ans = tot / (2 * n);
    text = `מה הממוצע של כל ${2 * n} העמודות בתרשים?`;
    d = [ans + step / 2, ans - step / 2, Math.round(tot / n), ans + step];
    ex = `סכום כל העמודות: ${tot}. חלקי ${2 * n} = ${ans}.`;
  } else {
    const i = r.int(0, n - 2), j = r.int(i + 1, n - 1);
    const p = r.pick([25, 50, 75, -25, -50, 150, 20, -20, -40, 60]);
    const target = A[i] * (1 + p / 100);
    if (!Number.isInteger(target / step) || target <= 0 || target > step * 12) return retry();
    A[j] = target;
    ans = p; pct = true;
    text = `בכמה אחוזים השתנה הערך של ${set.series[0]} ${pre('מ', L[i])} ${pre('ל', L[j])}? (שלילי = ירידה)`;
    d = [Math.round(((target - A[i]) / target) * 100), -p, p + 10, (target - A[i])];
    ex = `${set.series[0]}: ${L[i]} = ${A[i]}, ${L[j]} = ${target}. השינוי ${target - A[i]} מחולק בערך ההתחלתי ${A[i]}: ${p}%.`;
  }
  const chart = { type: 'bars2', title: set.title, labels: L, series: set.series, values: [A, B], step };
  if (opts) {
    const { options, answer } = withDistractors(r, opts.correct, opts.wrong, String);
    return { chart, text, options, answer, ex };
  }
  const fb = [step, -step, 2 * step, 5, -5].map((k) => ans + k);
  const ds = [...d, ...fb].filter((x) => Number.isFinite(x) && x !== ans && (pct || x > 0));
  const { options, answer } = withDistractors(r, ans, ds, String);
  return { chart, text, options: options.map((o) => (pct ? `${o}%` : String(o))), answer, ex };
}

export function chartsQuestion(seed, sub) {
  const r = makeRng(seed);
  const picked = r.pick(SUBS);
  const s = sub && SUBS.includes(sub) ? sub : picked;
  let q = make(r, s);
  while (!q) q = make(r, 'read');
  return { topic: 'charts', sub: s, seed, kind: 'chart', v: 2, chart: q.chart, prompt: q.text, options: q.options, answer: q.answer, explain: q.ex };
}
