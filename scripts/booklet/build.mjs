// בונה את חוברת התרגול להדפסה (PDF, A4): 120 שאלות קשות — 15 מכל נושא,
// דף סימון תשובות, ובסוף מפתח תשובות עם הסברים.
// הרצה: node scripts/booklet/build.mjs [תיקיית פלט] [seed]
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const outDir = path.resolve(process.argv[2] || path.join(root, 'dist-booklet'));
const SEED = Number(process.argv[3] || 20261125);
fs.mkdirSync(outDir, { recursive: true });

// ---- טוענים את קבצי הלוגיקה והמאגרים של האפליקציה (כמו בבדיקות) ----
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'booklet-'));
(function copy(rel = '') {
  const dir = path.join(root, 'src/exam', rel);
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(rel, f), full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) { fs.mkdirSync(path.join(tmp, p), { recursive: true }); copy(p); continue; }
    if (!f.endsWith('.js')) continue;
    const src = fs.readFileSync(full, 'utf8');
    if (/from 'react|from 'react-native|from 'expo/.test(src)) continue;
    fs.writeFileSync(path.join(tmp, p), src.replace(/from '(\.{1,2}\/[^']+?)(\.js)?'/g, "from '$1.js'"));
  }
})();
const imp = (p) => import(pathToFileURL(path.join(tmp, p)).href);
const { makeRng, withDistractors } = await imp('gen/rng.js');
const { WORDS } = await imp('data/words.js');
const { ANALOGIES } = await imp('data/analogies.js');
const { TECH_CONCEPTS } = await imp('data/technical.js');
const { TOPIC } = await imp('topics.js');

const { makeQuestion } = await imp('gen/index.js');
const { TOPICS } = await imp('topics.js');
void makeRng; void withDistractors; void WORDS; void ANALOGIES; void TECH_CONCEPTS;

// החוברת משתמשת באותם מחוללים קשים של האפליקציה (גרסה 2, בפורמט של תיל):
// 15 שאלות לכל נושא, בסבב על כל סוגי השאלות, בלי כפילויות.
const PLAN = {
  vocab: ['tierB', 'phrases', 'tierB'],
  technical: ['gears', 'levers', 'pulleys', 'concepts', 'gears', 'concepts'],
};
function pickFor(topic) {
  const t = TOPICS.find((x) => x.id === topic);
  const subs = PLAN[topic] || t.subs.map(([id]) => id);
  const out = [], seen = new Set();
  for (let k = 0; out.length < 15 && k < 400; k++) {
    const q = makeQuestion({ topic, sub: subs[out.length % subs.length], seed: (SEED * 31 + k * 7919 + topic.length * 104729) >>> 0 });
    const sig = q.prompt + (q.word || '') + (q.pair || '') + (q.ref || '') + JSON.stringify(q.seq || q.matrix || q.chart || q.diagram || '');
    if (seen.has(sig) || (q.ref && [...seen].some((x) => x.endsWith('#' + q.ref)))) continue;
    seen.add(sig); if (q.ref) seen.add('#' + q.ref);
    out.push(q);
  }
  return out;
}
const sections = TOPICS.map((t) => ({ topic: t.id, qs: pickFor(t.id) }));

// ---- בדיקות תקינות: 4 תשובות שונות, תשובה נכונה אחת, 15 בכל פרק ----
const errs = [];
sections.forEach((s) => {
  if (s.qs.length !== 15) errs.push(`${s.topic}: ${s.qs.length} שאלות`);
  s.qs.forEach((q, i) => {
    const keys = q.options.map((o) => (typeof o === 'string' ? o : JSON.stringify(o)));
    if (q.options.length !== 4) errs.push(`${s.topic} #${i + 1}: ${q.options.length} תשובות`);
    if (new Set(keys).size !== keys.length) errs.push(`${s.topic} #${i + 1}: תשובות כפולות`);
    if (!(q.answer >= 0 && q.answer < q.options.length)) errs.push(`${s.topic} #${i + 1}: אין תשובה נכונה`);
    if (keys.some((k) => /NaN|undefined|Infinity/.test(k)) || /NaN|undefined|Infinity/.test(q.prompt + q.explain)) errs.push(`${s.topic} #${i + 1}: ערך לא תקין`);
  });
});
const allPrompts = sections.flatMap((s) => s.qs.map((q) => q.prompt + (q.word || '') + (q.pair || '') + JSON.stringify(q.seq || q.matrix || q.chart || q.diagram || '')));
if (new Set(allPrompts).size !== allPrompts.length) errs.push('יש שאלות כפולות');
if (errs.length) { console.error(errs.join('\n')); process.exit(1); }

// ============================== ציורים (SVG) ==============================
const INK = '#1d2116', MID = '#6b7256', LIGHT = '#c9ccbd', OLIVE = '#424c29';
const ANG = (k) => (k * 45 * Math.PI) / 180;
const P = (cx, cy, r, k) => [cx + r * Math.sin(ANG(k)), cy - r * Math.cos(ANG(k))];
let uid = 0;

function shapeSvg(k, x, y, s, fill) {
  const id = `h${++uid}`;
  const geo = k === 'circle' ? `<circle cx="${x}" cy="${y}" r="${s / 2}"/>`
    : k === 'square' ? `<rect x="${x - s / 2}" y="${y - s / 2}" width="${s}" height="${s}"/>`
    : `<polygon points="${x},${y - s / 2} ${x + s / 2},${y + s / 2} ${x - s / 2},${y + s / 2}"/>`;
  // חצי מילוי = החצי השמאלי (חלוקה אנכית — חצי שטח גם במשולש)
  const clip = fill === 'half' ? `<clipPath id="${id}"><rect x="${x - s}" y="${y - s}" width="${s}" height="${2 * s}"/></clipPath>` : '';
  return `${clip}${fill === 'full' ? `<g fill="${INK}">${geo}</g>` : ''}${fill === 'half' ? `<g fill="${INK}" clip-path="url(#${id})">${geo}</g>` : ''}<g fill="none" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round">${geo}</g>`;
}

function cellSvg(c, size = 74) {
  let b = '';
  if (c.t === 'spokes') {
    b = `<circle cx="50" cy="50" r="5" fill="${INK}"/>` + c.s.map((k) => { const [x, y] = P(50, 50, 38, k); return `<line x1="50" y1="50" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`; }).join('');
  } else if (c.t === 'grid') {
    for (let i = 0; i < 9; i++) {
      const x = 17 + (i % 3) * 22, y = 17 + Math.floor(i / 3) * 22;
      b += `<rect x="${x}" y="${y}" width="22" height="22" fill="${c.s.includes(i) ? INK : 'none'}" stroke="${INK}" stroke-width="2.5"/>`;
    }
  } else if (c.t === 'hands') {
    const [ax, ay] = P(50, 50, 36, c.a), [bx, by] = P(50, 50, 22, c.b);
    b = `<circle cx="50" cy="50" r="44" fill="none" stroke="${LIGHT}" stroke-width="2"/>`
      + `<line x1="50" y1="50" x2="${ax.toFixed(1)}" y2="${ay.toFixed(1)}" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`
      + `<circle cx="${ax.toFixed(1)}" cy="${ay.toFixed(1)}" r="5.5" fill="${INK}"/>`
      + `<line x1="50" y1="50" x2="${bx.toFixed(1)}" y2="${by.toFixed(1)}" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>`
      + `<circle cx="50" cy="50" r="4" fill="#fff" stroke="${INK}" stroke-width="2"/>`;
  } else if (c.t === 'multi') {
    const s = 22, gap = 30, x0 = 50 - ((c.n - 1) * gap) / 2;
    for (let i = 0; i < c.n; i++) b += shapeSvg(c.k, x0 + i * gap, 50, s, c.f);
  } else if (c.t === 'move') {
    const pts = [[50, 14], [86, 14], [86, 50], [86, 86], [50, 86], [14, 86], [14, 50], [14, 14]];
    b = `<rect x="14" y="14" width="72" height="72" fill="none" stroke="${MID}" stroke-width="2.5"/>`
      + pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.2" fill="${MID}"/>`).join('')
      + `<circle cx="${pts[c.a][0]}" cy="${pts[c.a][1]}" r="9" fill="${INK}"/>`
      + `<circle cx="${pts[c.b][0]}" cy="${pts[c.b][1]}" r="8" fill="#fff" stroke="${INK}" stroke-width="3.5"/>`;
  }
  return `<svg width="${size}" height="${size}" viewBox="0 0 100 100">${b}</svg>`;
}

function matrixHtml(cells) {
  return `<div class="matrix" dir="ltr">${Array.from({ length: 9 }, (_, i) => `<div class="mc">${i < 8 ? cellSvg(cells[i], 52) : '<span class="qm">?</span>'}</div>`).join('')}</div>`;
}

function chartSvg(ch) {
  const W = 460, H = 146, L = 40, R = 8, T = 12, B = 28;
  const all = ch.values.flat();
  const max = Math.ceil((Math.max(...all) + ch.step) / ch.step) * ch.step;
  const n = ch.labels.length, w = W - L - R, h = H - T - B;
  const y = (v) => T + h - (v / max) * h;
  const grp = w / n, bw = grp * 0.32;
  let s = '';
  for (let v = 0; v <= max; v += ch.step) {
    s += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="${v === 0 ? INK : LIGHT}" stroke-width="${v === 0 ? 1.4 : 0.8}"/>`;
    // כשיש הרבה קווי רשת — מספר על כל קו שני, כדי שהמספרים לא יידחסו
    if ((v / ch.step) % (max / ch.step > 7 ? 2 : 1) === 0) s += `<text x="${L - 6}" y="${y(v) + 4}" font-size="11" text-anchor="end" fill="${MID}">${v}</text>`;
  }
  // סדר עברי: התקופה הראשונה מימין
  ch.labels.forEach((lb, i) => {
    const gx = W - R - grp * (i + 0.5);
    const [a, b] = [ch.values[0][i], ch.values[1][i]];
    s += `<rect x="${gx}" y="${y(a)}" width="${bw}" height="${y(0) - y(a)}" fill="${OLIVE}"/>`;
    s += `<rect x="${gx - bw}" y="${y(b)}" width="${bw}" height="${y(0) - y(b)}" fill="url(#hatch)" stroke="${INK}" stroke-width="1"/>`;
    s += `<text x="${gx}" y="${H - 8}" font-size="12" text-anchor="middle" direction="rtl" fill="${INK}">${lb}</text>`;
  });
  const defs = `<defs><pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#fff"/><line x1="0" y1="0" x2="0" y2="6" stroke="${INK}" stroke-width="2"/></pattern></defs>`;
  const legend = `<div class="legend"><span><i class="sw a"></i>${ch.series[0]}</span><span><i class="sw b"></i>${ch.series[1]}</span></div>`;
  return `<div class="chart"><div class="chead"><span class="ctitle">${ch.title}</span>${legend}</div><svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${defs}${s}</svg></div>`;
}

function gearPath(cx, cy, R, teeth) {
  const r1 = R - 6, pts = [];
  for (let i = 0; i < teeth; i++) {
    const a0 = (i / teeth) * 2 * Math.PI, da = (2 * Math.PI) / teeth;
    [[a0, r1], [a0 + da * 0.15, R], [a0 + da * 0.5, R], [a0 + da * 0.65, r1]].forEach(([a, r]) => pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`));
  }
  return `<polygon points="${pts.join(' ')}" fill="#f1f2ec" stroke="${INK}" stroke-width="1.6"/>`;
}

function techSvg(d) {
  if (d.type === 'gears') {
    const radii = d.teeth.map((t) => 14 + t * 0.95);
    const maxW = 600;
    const total = radii.reduce((s, r) => s + 2 * r, 0) - (radii.length - 1) * 5;
    const sc = Math.min(1, (maxW - 20) / total);
    const H = Math.max(...radii) * 2 * sc + 30;
    let x = maxW - 10, s = '';
    radii.forEach((r0, i) => {
      const r = r0 * sc, cx = x - r, cy = H / 2;
      x = cx - r + 5 * sc;
      s += gearPath(cx, cy, r, d.teeth[i]);
      s += `<circle cx="${cx}" cy="${cy}" r="${Math.max(3, r * 0.12)}" fill="${INK}"/>`;
      s += `<text x="${cx}" y="${cy - Math.max(8, r * 0.3)}" font-size="${Math.max(12, Math.min(18, r * 0.45))}" font-weight="700" text-anchor="middle" direction="rtl" fill="${INK}">${d.labels[i]}</text>`;
      if (i === 0 && d.first) {
        // חץ מעגלי מתחת למרכז: עם כיוון השעון (sweep=1) או נגדו
        const rr = r * 0.62, sw = d.first === 'cw';
        const pt = (deg) => [cx + rr * Math.cos((deg * Math.PI) / 180), cy + rr * Math.sin((deg * Math.PI) / 180)];
        const [p1, p2] = sw ? [pt(30), pt(150)] : [pt(150), pt(30)];
        s += `<path d="M${p1[0].toFixed(1)},${p1[1].toFixed(1)} A${rr},${rr} 0 0 ${sw ? 1 : 0}${p2[0].toFixed(1)},${p2[1].toFixed(1)}" fill="none" stroke="${OLIVE}" stroke-width="3" marker-end="url(#arr)"/>`;
      }
    });
    const defs = `<defs><marker id="arr" markerWidth="8" markerHeight="8" refX="5" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="${OLIVE}"/></marker></defs>`;
    return `<svg width="${maxW}" height="${H}" viewBox="0 0 ${maxW} ${H}">${defs}${s}</svg>`;
  }
  if (d.type === 'lever2') {
    const W = 560, H = 150, mid = W / 2, beamY = 88;
    const maxD = Math.max(d.left, ...d.right.map((x) => x[1]));
    const unit = (W / 2 - 40) / maxD;
    let s = `<line x1="20" x2="${W - 20}" y1="${beamY}" y2="${beamY}" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>`;
    s += `<polygon points="${mid},${beamY + 3} ${mid - 18},${beamY + 34} ${mid + 18},${beamY + 34}" fill="${MID}"/>`;
    for (let k = -maxD; k <= maxD; k++) s += `<line x1="${mid + k * unit}" x2="${mid + k * unit}" y1="${beamY - 3}" y2="${beamY + 3}" stroke="#fff" stroke-width="1.5"/>`;
    d.right.forEach(([w, dist]) => {
      const x = mid + dist * unit;
      s += `<rect x="${x - 22}" y="${beamY - 44}" width="44" height="40" rx="4" fill="${OLIVE}"/><text x="${x}" y="${beamY - 19}" font-size="13" font-weight="700" fill="#fff" text-anchor="middle" direction="rtl">${w} ק״ג</text>`;
      s += `<text x="${x}" y="${beamY + 52}" font-size="12" fill="${MID}" text-anchor="middle" direction="rtl">${dist} מ׳</text>`;
    });
    const xq = mid - d.left * unit;
    s += `<rect x="${xq - 22}" y="${beamY - 44}" width="44" height="40" rx="4" fill="none" stroke="${INK}" stroke-width="2" stroke-dasharray="5 4"/><text x="${xq}" y="${beamY - 17}" font-size="20" font-weight="900" fill="${INK}" text-anchor="middle" direction="rtl">?</text>`;
    s += `<text x="${xq}" y="${beamY + 52}" font-size="12" fill="${MID}" text-anchor="middle" direction="rtl">${d.left} מ׳</text>`;
    s += `<text x="${mid}" y="${beamY + 52}" font-size="11" fill="${MID}" text-anchor="middle" direction="rtl">משען</text>`;
    return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${s}</svg>`;
  }
  if (d.type === 'pulley') {
    const W = 260, H = 230, cx = 120, top = 14, upY = 52, loY = 150, n = d.n;
    const rU = 14 + n * 4, rL = rU - 4;
    let s = `<line x1="${cx - 80}" x2="${cx + 80}" y1="${top}" y2="${top}" stroke="${INK}" stroke-width="5"/>`;
    for (let k = -80; k <= 80; k += 12) s += `<line x1="${cx + k}" y1="${top}" x2="${cx + k - 8}" y2="${top - 8}" stroke="${INK}" stroke-width="1.4"/>`;
    s += `<line x1="${cx}" x2="${cx}" y1="${top}" y2="${upY - rU}" stroke="${INK}" stroke-width="3"/>`;
    s += `<rect x="${cx - rU}" y="${upY - rU}" width="${2 * rU}" height="${2 * rU}" rx="${rU}" fill="#f1f2ec" stroke="${INK}" stroke-width="2"/>`;
    s += `<rect x="${cx - rL}" y="${loY - rL}" width="${2 * rL}" height="${2 * rL}" rx="${rL}" fill="#f1f2ec" stroke="${INK}" stroke-width="2"/>`;
    const xs = Array.from({ length: n }, (_, i) => cx - rL + 6 + (i * (2 * rL - 12)) / Math.max(1, n - 1));
    xs.forEach((x) => { s += `<line x1="${x}" x2="${x}" y1="${upY}" y2="${loY}" stroke="${OLIVE}" stroke-width="2.4"/>`; });
    s += `<line x1="${cx + rU}" x2="${cx + rU}" y1="${upY}" y2="${loY + 34}" stroke="${OLIVE}" stroke-width="2.4"/>`;
    s += `<polygon points="${cx + rU},${loY + 46} ${cx + rU - 6},${loY + 34} ${cx + rU + 6},${loY + 34}" fill="${OLIVE}"/>`;
    s += `<text x="${cx + rU + 12}" y="${loY + 44}" font-size="15" font-weight="900" fill="${INK}">F</text>`;
    s += `<line x1="${cx}" x2="${cx}" y1="${loY + rL}" y2="${loY + rL + 10}" stroke="${INK}" stroke-width="3"/>`;
    s += `<rect x="${cx - 34}" y="${loY + rL + 10}" width="68" height="34" rx="4" fill="${OLIVE}"/><text x="${cx}" y="${loY + rL + 32}" font-size="13" font-weight="700" fill="#fff" text-anchor="middle" direction="rtl">${d.w} ק״ג</text>`;
    s += `<text x="${cx - rU - 34}" y="${(upY + loY) / 2 + 4}" font-size="12" fill="${MID}" text-anchor="middle" direction="rtl">${n} חבלים</text>`;
    return `<svg width="${W}" height="${H + 10}" viewBox="0 0 ${W} ${H + 10}">${s}</svg>`;
  }
  return '';
}

// ============================== HTML ==============================
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const ltr = (s) => `<bdi dir="ltr">${esc(s)}</bdi>`;
const isNumeric = (s) => /^[-−]?\d/.test(String(s));
const optText = (o) => (isNumeric(o) ? ltr(o) : iso(o));
// ביטויים מספריים בתוך טקסט עברי ("6+8+10 = 24", "70, 76") — מבודדים כ־LTR, כמו באפליקציה
const EXPR = /\u200e?[-+\u2212]?[\d(][\d\s.,+\-\u2212\u00d7\u00f7=:/()kx%\u200e\u00b2\u00b3\u2026]*[\d)%\u00b2\u00b3]/g;
const HAS_OP = /\d\s*[,+\-\u2212\u00d7\u00f7=:/]\s*[\d(\u200ekx+\-\u2212]|[)k]\s*[+\-\u2212\u00d7=:]/;
function iso(t) { return esc(t).replace(EXPR, (m) => (HAS_OP.test(m) ? `<bdi dir="ltr">${m}</bdi>` : m)); }

const MINUTES = { vocab: 7, analogies: 8, series: 12, arithmetic: 25, figures: 20, logic: 30, technical: 15, charts: 25 };
const TIPS = {
  vocab: 'מילים נדירות וביטויים. אם לא בטוחים — פסלו קודם את מה שבוודאות לא נכון.',
  analogies: 'נסחו לעצמכם משפט שמקשר בין שתי המילים, ובדקו איזה זוג מתאים לאותו משפט בדיוק.',
  series: 'חלק מהסדרות דורשות לבדוק הפרשים של הפרשים, או שתי סדרות לסירוגין. לפעמים חסר מספר באמצע.',
  arithmetic: 'בלי מחשבון. כתבו את הנתונים בצד, ובדקו שהתשובה הגיונית לפני שמסמנים.',
  figures: 'חלק מהמטריצות בנויות משני חוקים בו־זמנית. בדקו כל רכיב בנפרד (כיוון, כמות, מילוי).',
  logic: 'שרטטו טבלה או שורה בצד. שאלת "בהכרח נכון" — רק מה שנובע בוודאות מהנתונים.',
  technical: 'גלגלי שיניים, מנופים, גלגלות ועקרונות פיזיקליים. שימו לב לגלגל האמצעי — הוא משנה רק את הכיוון.',
  charts: 'לכל תרשים שתי סדרות. קראו את המקרא והצירים לפני שמחשבים.',
};
const TWO_COL = new Set(['vocab', 'analogies', 'series']);

const LET = ['א', 'ב', 'ג', 'ד'];
let num = 0;
const key = [];
function qHtml(q, topic) {
  num++;
  key.push({ n: num, topic, a: LET[q.answer], explain: q.explain, correct: q.options[q.answer] });
  const head = `<div class="qh"><span class="qn">${num}</span><div class="qp">${iso(q.prompt).replace(/\n/g, '<br>')}</div></div>`;
  let body = '';
  if (q.kind === 'word') body = `<div class="word">${esc(q.word)}</div>`;
  if (q.kind === 'analogy') body = `<div class="word pair">${esc(q.pair)}</div>`;
  if (q.kind === 'series') body = `<div class="seq" dir="ltr">${[...q.seq, ...Array(q.blanks || 1).fill('?')].map((x) => (x === '?' ? '<span class="blank">&nbsp;</span>' : `<span>${x}</span>`)).join('<span class="sep">,</span>')}</div>`;
  if (q.kind === 'figures') body = matrixHtml(q.matrix);
  if (q.kind === 'chart') body = chartSvg(q.chart);
  if (q.kind === 'tech') body = `<div class="diag">${techSvg(q.diagram)}</div>`;
  let opts;
  if (q.kind === 'figures') {
    opts = `<div class="fopts">${q.options.map((o, i) => `<div class="fo"><div class="fbox">${cellSvg(o, 46)}</div><span class="on">${LET[i]}׳</span></div>`).join('')}</div>`;
  } else {
    const len = Math.max(...q.options.map((o) => String(o).length));
    const two = TWO_COL.has(topic);
    const side = q.kind === 'chart' || (q.kind === 'tech' && q.diagram.type === 'pulley');
    const cls = two || side ? (len > 16 || side ? 'c1' : 'c2') : len > 30 ? 'c1' : len > 13 ? 'c2' : 'c4';
    opts = `<ol class="opts ${cls}">${q.options.map((o, i) => `<li><span class="on">${LET[i]}.</span> ${optText(o)}</li>`).join('')}</ol>`;
  }
  // ציור ותשובות זה לצד זה — חוסך חצי עמוד בכל שאלה עם ציור גבוה
  const sideBySide = q.kind === 'figures' || q.kind === 'chart' || (q.kind === 'tech' && q.diagram.type === 'pulley');
  return `<div class="q k-${q.kind}">${head}${sideBySide ? `<div class="side">${body}${opts}</div>` : body + opts}</div>`;
}

const fontB64 = (w) => fs.readFileSync(path.join(root, `node_modules/@expo-google-fonts/heebo/${w}/Heebo_${w}.ttf`)).toString('base64');
const logoB64 = fs.readFileSync(path.join(root, 'assets/icon.png')).toString('base64');

let sectionsHtml = '';
sections.forEach((s, si) => {
  const t = TOPIC[s.topic];
  const from = num + 1;
  const qs = s.qs.map((q) => qHtml(q, s.topic)).join('');
  sectionsHtml += `<section class="sec">
    <div class="shead"><header class="sh"><div class="sn">פרק ${si + 1}</div><div class="st">${t.name}</div><div class="sm">שאלות ${from}–${num} · זמן מומלץ: ${MINUTES[s.topic]} דקות</div></header>
    <p class="tip">${TIPS[s.topic]}</p></div>
    <div class="qs ${TWO_COL.has(s.topic) ? 'two' : ''}">${qs}</div>
  </section>`;
});
const totalMin = Object.values(MINUTES).reduce((a, b) => a + b, 0);

// דף סימון תשובות
const sheet = sections.map((s, si) => {
  const rows = key.filter((k) => k.topic === s.topic).map((k) => `<div class="br"><span class="bn">${k.n}</span>${LET.map((l) => `<span class="bub">${l}</span>`).join('')}</div>`).join('');
  return `<div class="bs"><div class="bt">${si + 1}. ${TOPIC[s.topic].name}</div>${rows}</div>`;
}).join('');

// מפתח מהיר + הסברים
const quick = sections.map((s) => `<div class="qk"><div class="bt">${TOPIC[s.topic].name}</div>${key.filter((k) => k.topic === s.topic).map((k) => `<span><b>${k.n}</b>&nbsp;${k.a}׳</span>`).join('')}</div>`).join('');
const expl = sections.map((s) => `<h3 class="eh">${TOPIC[s.topic].name}</h3>${key.filter((k) => k.topic === s.topic).map((k) => `<div class="ex"><span class="en">${k.n}</span><span class="ea">${k.a}׳</span><span class="et">${iso(k.explain)}</span></div>`).join('')}`).join('');

const html = `<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"><title>חוברת תרגול פנמ״צ</title>
<style>
@font-face{font-family:Heebo;font-weight:400;src:url(data:font/ttf;base64,${fontB64('400Regular')})}
@font-face{font-family:Heebo;font-weight:700;src:url(data:font/ttf;base64,${fontB64('700Bold')})}
@font-face{font-family:Heebo;font-weight:900;src:url(data:font/ttf;base64,${fontB64('900Black')})}
@page{size:A4;margin:14mm 13mm 16mm}
*{box-sizing:border-box}
body{font-family:Heebo,sans-serif;color:${INK};font-size:10.5pt;line-height:1.45;margin:0}
bdi{unicode-bidi:isolate}
svg{direction:ltr}
.cover{height:262mm;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;page-break-after:always}
.cover img{width:62mm;height:62mm;border-radius:12mm}
.cover h1{font-size:30pt;font-weight:900;margin:12mm 0 2mm;color:${OLIVE}}
.cover h2{font-size:14pt;font-weight:400;margin:0;color:${MID}}
.cover .facts{display:flex;gap:8mm;margin-top:14mm}
.cover .facts div{border:1.5px solid ${LIGHT};border-radius:4mm;padding:4mm 7mm}
.cover .facts b{display:block;font-size:20pt;font-weight:900;color:${OLIVE}}
.cover .name{margin-top:22mm;font-size:11pt;color:${MID}}
.cover .name span{display:inline-block;width:60mm;border-bottom:1px solid ${INK};margin-inline-start:3mm}
.intro{page-break-after:always}
.intro h2{font-size:18pt;font-weight:900;color:${OLIVE};margin:0 0 4mm}
.intro li{margin-bottom:2mm}
table.plan{border-collapse:collapse;width:100%;margin-top:5mm}
table.plan td,table.plan th{border-bottom:1px solid ${LIGHT};padding:2mm 3mm;text-align:right}
table.plan th{font-weight:700;color:${MID};font-size:9.5pt}
.sec{margin-top:9mm}
.sec:first-of-type{page-break-before:always;margin-top:0}
.shead{break-inside:avoid;break-after:avoid;page-break-after:avoid}
.sh{display:flex;align-items:baseline;gap:4mm;border-bottom:2.5px solid ${OLIVE};padding-bottom:2mm}
.sn{background:${OLIVE};color:#fff;font-weight:700;padding:0.6mm 3mm;border-radius:2mm;font-size:10pt}
.st{font-size:18pt;font-weight:900}
.sm{margin-inline-start:auto;color:${MID};font-size:9.5pt}
.tip{color:${MID};font-size:9.5pt;margin:2mm 0 4mm}
.qs.two{columns:2;column-gap:9mm;column-rule:1px solid #e5e7de}
.q{break-inside:avoid;page-break-inside:avoid;margin-bottom:4mm}
.qs:not(.two) .q{border-bottom:1px dashed ${LIGHT};padding-bottom:3mm}
.qh{display:flex;gap:2.5mm}
.qn{flex:none;min-width:7mm;height:7mm;border-radius:50%;background:${INK};color:#fff;font-weight:700;font-size:9.5pt;display:flex;align-items:center;justify-content:center;margin-top:0.3mm}
.qp{font-weight:700}
.word{font-size:15pt;font-weight:900;margin:1.5mm 9.5mm 1mm}
.word.pair{font-size:13pt}
.seq{display:flex;gap:1mm;justify-content:center;flex-wrap:nowrap;white-space:nowrap;font-size:12pt;font-weight:700;margin:2mm 9.5mm 1.5mm 0;font-variant-numeric:tabular-nums}
.seq .sep{color:${MID}}
.seq .blank{display:inline-block;min-width:9mm;border-bottom:2px solid ${INK}}
.opts{list-style:none;padding:0;margin:1.5mm 9.5mm 0 0;display:grid;gap:1mm 5mm}
.opts.c1{grid-template-columns:1fr}.opts.c2{grid-template-columns:1fr 1fr}.opts.c4{grid-template-columns:repeat(4,1fr)}
.on{font-weight:700;color:${MID}}
.matrix{display:grid;grid-template-columns:repeat(3,16.5mm);grid-auto-rows:16.5mm;border:1.5px solid ${INK};width:max-content;margin:0}
.mc{display:flex;align-items:center;justify-content:center;border-inline-start:1px solid ${LIGHT};border-top:1px solid ${LIGHT}}
.mc:nth-child(3n+1){border-inline-start:0}.mc:nth-child(-n+3){border-top:0}
.qm{font-size:24pt;font-weight:900;color:${MID}}
.fopts{display:grid;grid-template-columns:repeat(2,auto);gap:1.5mm 6mm}
.fo{display:flex;flex-direction:column;align-items:center;gap:1mm}
.fbox{border:1.2px solid ${INK};width:15mm;height:15mm;display:flex;align-items:center;justify-content:center}
.chart{margin:0;width:max-content;text-align:center}
.side{display:flex;align-items:center;justify-content:center;gap:12mm;margin:1.5mm 9.5mm 0 0}
.side .opts{margin:0;min-width:38mm}
.side .diag{margin:0}
.ctitle{font-weight:700;font-size:10pt}
.legend{display:flex;gap:4mm;font-size:9pt}
.chead{display:flex;gap:6mm;justify-content:center;align-items:baseline;margin-bottom:0.5mm}
.sw{display:inline-block;width:3.5mm;height:3.5mm;margin-inline-end:1.5mm;vertical-align:-0.5mm;border:1px solid ${INK}}
.sw.a{background:${OLIVE}}
.sw.b{background:repeating-linear-gradient(45deg,#fff 0 1.2px,${INK} 1.2px 2.2px)}
.diag{display:flex;justify-content:center;margin:2mm 0}
.k-tech .diag svg{max-width:100%}
.answers{page-break-before:always}
.answers h2,.keyp h2{font-size:18pt;font-weight:900;color:${OLIVE};margin:0 0 1mm}
.answers p,.keyp p{color:${MID};margin:0 0 4mm;font-size:9.5pt}
.bgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:4mm 6mm}
.bs{break-inside:avoid}
.bt{font-weight:700;font-size:9.5pt;border-bottom:1.5px solid ${OLIVE};margin-bottom:1.5mm;padding-bottom:0.5mm}
.br{display:flex;align-items:center;gap:1.6mm;margin-bottom:1.1mm}
.bn{width:7mm;font-weight:700;font-size:9pt;text-align:left}
.bub{width:5mm;height:5mm;border:1px solid ${INK};border-radius:50%;font-size:7pt;display:flex;align-items:center;justify-content:center;color:${MID}}
.keyp{page-break-before:always}
.cut{border-top:1.5px dashed ${INK};text-align:center;font-size:9pt;color:${MID};margin:0 0 6mm;padding-top:1mm}
.qgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:3mm 6mm;margin-bottom:6mm}
.qk span{display:inline-block;width:49%;font-size:9.5pt}
.eh{font-size:12.5pt;font-weight:900;color:${OLIVE};margin:5mm 0 2mm;border-bottom:1.5px solid ${OLIVE};break-after:avoid}
.ex{display:flex;gap:2mm;font-size:9.5pt;margin-bottom:1.6mm;break-inside:avoid}
.en{font-weight:700;min-width:7mm}
.ea{font-weight:700;color:${OLIVE};min-width:7mm}
.et{flex:1}
</style></head><body>
<div class="cover">
  <img src="data:image/png;base64,${logoB64}">
  <h1>חוברת תרגול — רמה קשה</h1>
  <h2>הכנה למבחן הפסיכוטכני · פנמ״צ</h2>
  <div class="facts"><div><b>120</b>שאלות</div><div><b>8</b>פרקים</div><div><b>${Math.floor(totalMin / 60)}:${String(totalMin % 60).padStart(2, '0')}</b>שעות (מומלץ)</div></div>
  <div class="name">שם:<span></span></div>
</div>
<div class="intro">
  <h2>איך לעבוד עם החוברת</h2>
  <ul>
    <li>החוברת ברמה <b>קשה</b> מהמבחן הרגיל. אם הצלחתם כאן ב־70% — אתם במקום טוב.</li>
    <li>במבחן האמיתי (במחשב, ב־Zoom) מותרים רק <b>שני דפי טיוטה ריקים</b>. תתרגלו גם כאן עם שני דפים בלבד — לכתוב קטן ומסודר.</li>
    <li>אפשר לפתור פרק אחד בכל פעם. לכל פרק יש <b>זמן מומלץ</b> — שימו טיימר ונסו לעמוד בו, כמו במבחן.</li>
    <li>סמנו את התשובות ב<b>דף הסימון</b> (אחרי השאלות) ולא בחוברת — כך אפשר לפתור שוב בעוד כמה שבועות.</li>
    <li>שאלה שנתקעתם בה יותר מדי — דלגו וחזרו אליה בסוף הפרק. במבחן האמיתי אין ניקוד שלילי, אז תמיד מסמנים תשובה.</li>
    <li>בסוף החוברת יש <b>מפתח תשובות עם הסברים</b>. אפשר לתלוש אותו לפני שמתחילים (קו המספריים בראש העמוד).</li>
    <li>כל שאלה שטעיתם בה — קראו את ההסבר, וכתבו לעצמכם במשפט אחד מה הייתה הטעות.</li>
  </ul>
  <table class="plan"><tr><th>פרק</th><th>נושא</th><th>שאלות</th><th>זמן מומלץ</th></tr>
  ${sections.map((s, i) => `<tr><td>${i + 1}</td><td>${TOPIC[s.topic].name}</td><td>${ltr(`${i * 15 + 1}–${i * 15 + 15}`)}</td><td>${MINUTES[s.topic]} דקות</td></tr>`).join('')}
  <tr><td></td><td><b>סך הכול</b></td><td><b>120</b></td><td><b>${totalMin} דקות</b></td></tr></table>
</div>
${sectionsHtml}
<div class="answers"><h2>דף סימון תשובות</h2><p>סמנו עיגול אחד בכל שורה. אחרי הבדיקה — סמנו ✗ ליד כל שאלה שטעיתם בה.</p><div class="bgrid">${sheet}</div></div>
<div class="keyp"><div class="cut">✂ — מכאן מתחיל מפתח התשובות — ✂</div><h2>מפתח תשובות</h2><p>האות ליד מספר השאלה = התשובה הנכונה. הסברים מלאים בעמודים הבאים.</p><div class="qgrid">${quick}</div>
<h2>הסברים</h2>${expl}</div>
</body></html>`;

fs.writeFileSync(path.join(outDir, 'booklet.json'), JSON.stringify(sections, null, 1));
const htmlPath = path.join(outDir, 'booklet.html');
fs.writeFileSync(htmlPath, html);

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = await import('playwright')); }
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(pathToFileURL(htmlPath).href);
await page.evaluate(() => document.fonts.ready);
const pdfPath = path.join(outDir, 'חוברת תרגול פנמ״צ - רמה קשה.pdf');
await page.pdf({
  path: pdfPath, format: 'A4', printBackground: true, preferCSSPageSize: true,
  displayHeaderFooter: true, headerTemplate: '<span></span>',
  footerTemplate: '<div style="width:100%;text-align:center;font-size:8px;color:#6b7256;font-family:sans-serif"><span class="pageNumber"></span></div>',
});
await browser.close();
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`✓ ${key.length} שאלות · ${pdfPath}`);
