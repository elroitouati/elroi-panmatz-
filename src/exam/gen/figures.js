// סדרות צורות: מטריצה 3×3 שהתא האחרון חסר בה. כל מטריצה נבנית מחוק אחד:
//  • סיבוב — חץ שמסתובב בזווית קבועה לאורך השורה.
//  • חיבור — עמודה 3 = כל הקווים של עמודה 1 + עמודה 2.
//  • ביטול — קו שמופיע בשתיהן נעלם; קו שמופיע באחת נשאר.
//  • ספירה — מספר הנקודות גדל בקבוע.
//  • מילוי — כל צורה וכל מילוי מופיעים פעם אחת בכל שורה (ריבוע לטיני).
// תא = אובייקט שמתאר מה לצייר (FigureView.js מצייר אותו).
import { makeRng, withDistractors } from './rng';

const SUBS = ['rotate', 'union', 'xor', 'count', 'shade'];
const key = (c) => JSON.stringify(c);
const sortU = (a) => [...new Set(a)].sort((x, y) => x - y);

function randomSpokes(r, n) {
  return sortU(r.sample([0, 1, 2, 3, 4, 5, 6, 7], n));
}

function build(r, sub) {
  if (sub === 'rotate') {
    const step = r.pick([1, 2, 3, -1, -2]); // ב־45°
    const shape = r.pick(['arrow', 'flag', 'arrow']);
    const cells = [];
    for (let row = 0; row < 3; row++) {
      const start = r.int(0, 7);
      for (let col = 0; col < 3; col++) cells.push({ t: shape, a: (((start + step * col) % 8) + 8) % 8 });
    }
    const c = cells[8];
    const wrong = [1, -1, 4, step, -step].map((k) => ({ t: shape, a: (((c.a + k) % 8) + 8) % 8 }));
    const dir = step > 0 ? 'עם כיוון השעון' : 'נגד כיוון השעון';
    return { cells, correct: c, wrong, explain: `בכל שורה הצורה מסתובבת ${Math.abs(step) * 45}° ${dir} מתא לתא.` };
  }
  if (sub === 'union' || sub === 'xor') {
    const cells = [];
    for (let row = 0; row < 3; row++) {
      const a = randomSpokes(r, r.int(2, 3));
      const b = randomSpokes(r, r.int(2, 3));
      const c = sub === 'union'
        ? sortU([...a, ...b])
        : sortU([...a.filter((x) => !b.includes(x)), ...b.filter((x) => !a.includes(x))]);
      if (c.length === 0) return build(r, sub);
      cells.push({ t: 'spokes', s: a }, { t: 'spokes', s: b }, { t: 'spokes', s: c });
    }
    const a = cells[6].s, b = cells[7].s, c = cells[8].s;
    const uni = sortU([...a, ...b]);
    const inter = a.filter((x) => b.includes(x));
    const xor = sortU([...a.filter((x) => !b.includes(x)), ...b.filter((x) => !a.includes(x))]);
    const extra = sortU([...c, r.int(0, 7)]);
    const missing = c.slice(1);
    const wrong = [sub === 'union' ? xor : uni, inter.length ? inter : missing, extra, missing, a].map((s) => ({ t: 'spokes', s }));
    const explain = sub === 'union'
      ? 'התא השלישי בכל שורה מחבר את כל הקווים של שני התאים הראשונים.'
      : 'קו שמופיע בשני התאים הראשונים — נעלם. קו שמופיע רק באחד מהם — נשאר.';
    return { cells, correct: { t: 'spokes', s: c }, wrong, explain };
  }
  if (sub === 'count') {
    const shape = r.pick(['dot', 'square', 'tri']);
    const step = r.pick([1, 2]);
    const cells = [];
    for (let row = 0; row < 3; row++) {
      const base = row + 1;
      for (let col = 0; col < 3; col++) cells.push({ t: 'many', k: shape, n: base + step * col });
    }
    const c = cells[8];
    const others = ['dot', 'square', 'tri'].filter((x) => x !== shape);
    const wrong = [{ ...c, n: c.n - 1 }, { ...c, n: c.n + 1 }, { ...c, k: others[0] }, { ...c, n: c.n - step - 1 }];
    return { cells, correct: c, wrong, explain: `בכל שורה מספר הצורות גדל ב־${step}, וכל שורה מתחילה ב־1 יותר מהקודמת.` };
  }
  // shade — ריבוע לטיני של צורה × מילוי
  const shapes = r.shuffle(['circle', 'square', 'tri']);
  const fills = r.shuffle(['none', 'half', 'full']);
  const cells = [];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      cells.push({ t: 'shape', k: shapes[(row + col) % 3], f: fills[(row * 2 + col) % 3] });
    }
  }
  const c = cells[8];
  const wrong = [
    { ...c, f: fills.find((f) => f !== c.f) },
    { ...c, k: shapes.find((s) => s !== c.k) },
    { t: 'shape', k: shapes.find((s) => s !== c.k), f: fills.find((f) => f !== c.f) },
    cells[7],
  ];
  return { cells, correct: c, wrong, explain: 'בכל שורה וכל עמודה, כל צורה מופיעה פעם אחת וכל סוג מילוי מופיע פעם אחת. מה שחסר בשורה האחרונה הוא התשובה.' };
}

export function figuresQuestion(seed, sub) {
  const r = makeRng(seed);
  const s = sub && SUBS.includes(sub) ? sub : r.pick(SUBS);
  const q = build(r, s);
  const { options, answer } = withDistractors(r, q.correct, q.wrong, key);
  // אם לא נמצאו 3 מסיחים שונים — מוסיפים סיבובים/שינויים אקראיים
  while (options.length < 4) {
    const extra = { ...q.correct, a: ((q.correct.a ?? 0) + options.length) % 8, n: (q.correct.n ?? 1) + options.length };
    if (!options.some((o) => key(o) === key(extra))) options.push(extra);
  }
  const matrix = q.cells.slice(0, 8);
  return { topic: 'figures', sub: s, seed, kind: 'figures', prompt: 'איזו צורה משלימה את המטריצה?', matrix, options, answer, explain: q.explain };
}
