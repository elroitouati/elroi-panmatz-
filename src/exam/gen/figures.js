// סדרות צורות — רמה קשה. מטריצה 3×3 שקוראים משמאל לימין (כמו במבחן של תיל),
// והתא החסר הוא האחרון: למטה מימין. חלק מהחוקים פועלים לפי טור (מלמעלה למטה),
// וחלק מהמטריצות בנויות משני חוקים בבת אחת.
//  • rotate — שני מחוגים שמסתובבים בקצב שונה.
//  • union  — חיבור קווים (בשורה או בטור).
//  • xor    — ביטול משבצות ברשת 3×3 (בשורה או בטור).
//  • count  — שני סמנים שנעים על שפת ריבוע, כל אחד בקצב אחר.
//  • shade  — צורה, כמות ומילוי — כל אחד פעם אחת בכל שורה ובכל טור.
import { makeRng, withDistractors } from './rng';

const SUBS = ['rotate', 'union', 'xor', 'count', 'shade'];
const key = (c) => JSON.stringify(c);
const sortU = (a) => [...new Set(a)].sort((x, y) => x - y);
const m8 = (x) => ((x % 8) + 8) % 8;
const dirTxt = (s, unit) => `${unit(Math.abs(s))} ${s > 0 ? 'עם כיוון השעון' : 'נגד כיוון השעון'}`;

// בונה מטריצה מפעולה בין שני תאים, לפי שורה או לפי טור
function opMatrix(r, make, op) {
  const byCol = r.chance(0.4);
  const g = [[], [], []];
  for (let k = 0; k < 3; k++) {
    const a = make(), b = make(), c = op(a, b);
    if (!c.length) return null;
    if (byCol) { g[0][k] = a; g[1][k] = b; g[2][k] = c; } else { g[k][0] = a; g[k][1] = b; g[k][2] = c; }
  }
  return { grid: g, byCol };
}

function build(r, sub) {
  if (sub === 'rotate') {
    const s1 = r.pick([1, 2, 3, -1]), s2 = r.pick([-1, -2, 2, 3]);
    if (s1 === s2) return build(r, sub);
    const cells = [];
    for (let row = 0; row < 3; row++) {
      const a0 = r.int(0, 7), b0 = r.int(0, 7);
      for (let col = 0; col < 3; col++) cells.push({ t: 'hands', a: m8(a0 + s1 * col), b: m8(b0 + s2 * col) });
    }
    const c = cells[8];
    const wrong = [{ t: 'hands', a: c.b, b: c.a }, { t: 'hands', a: m8(c.a + 1), b: c.b }, { t: 'hands', a: c.a, b: m8(c.b + s2) }, { t: 'hands', a: m8(c.a - s1), b: c.b }, { t: 'hands', a: m8(c.a + 4), b: m8(c.b + 4) }];
    const deg = (k) => `${k * 45}°`;
    return { cells, correct: c, wrong, explain: `משמאל לימין: המחוג הארוך (עם הנקודה) מסתובב ${dirTxt(s1, deg)} בכל תא, והמחוג הקצר ${dirTxt(s2, deg)}.` };
  }
  if (sub === 'union') {
    const mk = () => sortU(r.sample([0, 1, 2, 3, 4, 5, 6, 7], r.int(2, 3)));
    const m = opMatrix(r, mk, (a, b) => sortU([...a, ...b]));
    if (!m) return build(r, sub);
    const cells = m.grid.flat().map((s) => ({ t: 'spokes', s }));
    const [a, b, c] = m.byCol ? [m.grid[0][2], m.grid[1][2], m.grid[2][2]] : [m.grid[2][0], m.grid[2][1], m.grid[2][2]];
    const xor = sortU([...a, ...b].filter((x) => !(a.includes(x) && b.includes(x))));
    const more = [0, 1, 2, 3, 4, 5, 6, 7].find((x) => !c.includes(x));
    const wrong = [xor, c.slice(1), sortU([...c, more]), sortU(c.map((x) => m8(x + 1))), a.filter((x) => b.includes(x))].filter((s) => s.length).map((s) => ({ t: 'spokes', s }));
    return { cells, correct: cells[8], wrong, explain: `${m.byCol ? 'בכל טור, מלמעלה למטה' : 'בכל שורה, משמאל לימין'}: התא השלישי מחבר את כל הקווים של שני התאים הראשונים (קו משותף מצויר פעם אחת).` };
  }
  if (sub === 'xor') {
    const mk = () => sortU(r.sample([0, 1, 2, 3, 4, 5, 6, 7, 8], r.int(3, 4)));
    const m = opMatrix(r, mk, (a, b) => sortU([...a, ...b].filter((x) => !(a.includes(x) && b.includes(x)))));
    if (!m) return build(r, sub);
    const cells = m.grid.flat().map((s) => ({ t: 'grid', s }));
    const [a, b, c] = m.byCol ? [m.grid[0][2], m.grid[1][2], m.grid[2][2]] : [m.grid[2][0], m.grid[2][1], m.grid[2][2]];
    const flip = (s, k) => sortU(s.includes(k) ? s.filter((x) => x !== k) : [...s, k]);
    const inter = a.filter((x) => b.includes(x));
    const wrong = [sortU([...a, ...b]), inter.length ? inter : flip(c, 4), flip(c, c[0] === 0 ? 1 : 0), flip(c, 8), sortU(c.map((x) => 8 - x))].filter((s) => s.length).map((s) => ({ t: 'grid', s }));
    return { cells, correct: cells[8], wrong, explain: `${m.byCol ? 'בכל טור, מלמעלה למטה' : 'בכל שורה, משמאל לימין'}: משבצת שחורה בשני התאים הראשונים — נמחקת. משבצת שחורה רק באחד מהם — נשארת (ביטול).` };
  }
  if (sub === 'count') {
    const s1 = r.pick([1, 2, 3]), s2 = r.pick([-1, -2, -3, 2]);
    if (s1 === s2) return build(r, sub);
    const cells = [];
    for (let row = 0; row < 3; row++) {
      const a0 = r.int(0, 7), b0 = r.int(0, 7);
      for (let col = 0; col < 3; col++) {
        const a = m8(a0 + s1 * col), b = m8(b0 + s2 * col);
        if (a === b) return build(r, sub);
        cells.push({ t: 'move', a, b });
      }
    }
    const c = cells[8];
    const wrong = [{ t: 'move', a: c.b, b: c.a }, { t: 'move', a: m8(c.a + 1), b: c.b }, { t: 'move', a: c.a, b: m8(c.b - s2) }, { t: 'move', a: m8(c.a + s1), b: m8(c.b + s2) }, { t: 'move', a: m8(c.a - 1), b: m8(c.b + 1) }].filter((x) => x.a !== x.b);
    const st = (k) => `${k} ${k === 1 ? 'משבצת' : 'משבצות'}`;
    return { cells, correct: c, wrong, explain: `משמאל לימין: העיגול השחור זז ${dirTxt(s1, st)} בכל תא, והעיגול הריק זז ${dirTxt(s2, st)}.` };
  }
  // shade — שלוש תכונות, כל אחת פעם אחת בכל שורה וטור
  const shapes = r.shuffle(['circle', 'square', 'tri']);
  const counts = r.shuffle([1, 2, 3]);
  const fills = r.shuffle(['none', 'full', 'half']);
  const cells = [];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) cells.push({ t: 'multi', k: shapes[(row + col) % 3], n: counts[(row * 2 + col) % 3], f: fills[(row + 2 * col) % 3] });
  }
  const c = cells[8];
  const other = (arr, v) => arr.find((x) => x !== v);
  const wrong = [{ ...c, n: other(counts, c.n) }, { ...c, f: other(fills, c.f) }, { ...c, k: other(shapes, c.k) }, { ...c, k: other(shapes, c.k), n: other(counts, c.n) }, cells[7], cells[5]];
  return { cells, correct: c, wrong, explain: 'שלושה חוקים יחד: בכל שורה ובכל טור כל צורה מופיעה פעם אחת, כל כמות (1, 2, 3) פעם אחת, וכל סוג מילוי (ריק, חצי, מלא) פעם אחת.' };
}

export function figuresQuestion(seed, sub) {
  const r = makeRng(seed);
  const picked = r.pick(SUBS);
  const s = sub && SUBS.includes(sub) ? sub : picked;
  let q = build(r, s);
  let { options, answer } = withDistractors(r, q.correct, q.wrong, key);
  let guard = 0;
  while (options.length < 4 && guard++ < 20) {
    q = build(r, s);
    ({ options, answer } = withDistractors(r, q.correct, q.wrong, key));
  }
  return { topic: 'figures', sub: s, seed, kind: 'figures', v: 2, ltr: true, prompt: 'איזה תא משלים את המטריצה?', matrix: q.cells.slice(0, 8), options, answer, explain: q.explain };
}
