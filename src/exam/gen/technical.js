// הבנה טכנית — רמה קשה. גלגלי שיניים (שרשרת עם גלגל אמצעי, כיוון, סיבובים לדקה),
// מנוף עם שני משקלים, גלגלות (כוח ואורך חבל), ועקרונות פיזיקליים מהמאגר.
import { makeRng, withDistractors } from './rng';
import { TECH_CONCEPTS } from '../data/technical';

const SUBS = ['gears', 'levers', 'pulleys', 'concepts', 'concepts'];
const HEB = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ז׳'];
const DIRN = { cw: 'עם כיוון השעון', ccw: 'נגד כיוון השעון' };
const r1 = (x) => String(Math.round(x * 10) / 10);

function gears(r) {
  const kind = r.pick(['idler', 'dir', 'rpm']);
  if (kind === 'idler') {
    const a = r.pick([12, 16, 18, 24, 30, 36, 40, 48]), b = r.pick([10, 14, 20, 25]), c = r.pick([8, 9, 12, 15, 20]);
    const k = r.pick([2, 3, 4, 5, 6, 10]);
    const ans = (a * k) / c;
    if (!Number.isInteger(ans) || a === c || ans === k) return gears(r);
    return {
      diagram: { type: 'gears', teeth: [a, b, c], labels: HEB.slice(0, 3) },
      prompt: `שלושה גלגלי שיניים משולבים בשורה: לגלגל א׳ ${a} שיניים, לגלגל ב׳ (באמצע) ${b} שיניים, ולגלגל ג׳ ${c} שיניים. גלגל א׳ השלים ${k} סיבובים. כמה סיבובים השלים גלגל ג׳?`,
      correct: String(ans), wrong: [r1((a * k) / b), r1((c * k) / a), String(k), r1((b * k) / c)],
      explain: `הגלגל האמצעי משנה רק את הכיוון, לא את היחס. בכל גלגל עוברות ${a}×${k} = ${a * k} שיניים, ולכן ג׳ מסתובב ${a * k}/${c} = ${ans} פעמים.`,
    };
  }
  if (kind === 'dir') {
    const n = r.int(5, 7);
    const teeth = Array.from({ length: n }, () => r.pick([10, 14, 18, 22]));
    const first = r.pick(['cw', 'ccw']);
    const ask = r.int(2, n - 1);
    const ans = ask % 2 === 0 ? first : first === 'cw' ? 'ccw' : 'cw';
    return {
      diagram: { type: 'gears', teeth, labels: HEB.slice(0, n), first },
      prompt: `${n} גלגלי שיניים משולבים בשורה, מ־א׳ (מימין) עד ${HEB[n - 1]}. גלגל א׳ מסתובב ${DIRN[first]}. לאיזה כיוון מסתובב גלגל ${HEB[ask]}?`,
      correct: DIRN[ans], wrong: [DIRN[ans === 'cw' ? 'ccw' : 'cw'], 'הוא לא מסתובב', 'תלוי במספר השיניים'],
      explain: `כל שני גלגלים משולבים מסתובבים בכיוונים הפוכים. גלגל ${HEB[ask]} הוא ה־${ask + 1} בשורה — ${ask % 2 === 0 ? 'מקום אי־זוגי, כמו א׳' : 'מקום זוגי, הפוך מ־א׳'}.`,
    };
  }
  const a = r.pick([20, 30, 40, 60]), b = r.pick([12, 15, 24, 80]), rpm = r.pick([30, 45, 60, 90, 120]);
  const ans = (a * rpm) / b;
  if (!Number.isInteger(ans) || a === b) return gears(r);
  return {
    diagram: { type: 'gears', teeth: [a, b], labels: HEB.slice(0, 2) },
    prompt: `גלגל א׳ (${a} שיניים) מסתובב ${rpm} סיבובים בדקה ומשולב בגלגל ב׳ (${b} שיניים). כמה סיבובים בדקה מסתובב גלגל ב׳?`,
    correct: String(ans), wrong: [r1((b * rpm) / a), String(rpm), String(ans * 2)],
    explain: `השיניים שעוברות בדקה זהות בשני הגלגלים: ${a}×${rpm} = ${a * rpm}. גלגל ב׳: ${a * rpm}/${b} = ${ans}.`,
  };
}

function levers(r) {
  const w1 = r.pick([10, 20, 30, 40]), d1 = r.int(1, 2), w2 = r.pick([10, 20, 30]), d2 = r.int(3, 4), d3 = r.pick([2, 3, 4, 5]);
  const m = w1 * d1 + w2 * d2, ans = m / d3;
  if (!Number.isInteger(ans)) return levers(r);
  return {
    diagram: { type: 'lever2', right: [[w1, d1], [w2, d2]], left: d3 },
    prompt: `על מוט, בצד ימין של נקודת המשען, מונחים ${w1} ק״ג במרחק ${d1} מ׳ ו־${w2} ק״ג במרחק ${d2} מ׳. איזה משקל צריך לשים בצד שמאל, במרחק ${d3} מ׳, כדי שהמוט יהיה מאוזן?`,
    correct: `${ans} ק״ג`, wrong: [`${w1 + w2} ק״ג`, `${r1(((w1 + w2) * Math.max(d1, d2)) / d3)} ק״ג`, `${ans + 10} ק״ג`, `${r1((w1 + w2) / d3)} ק״ג`],
    explain: `סכום המומנטים בימין: ${w1}×${d1} + ${w2}×${d2} = ${m}. בשמאל: x×${d3} = ${m}, ולכן x = ${ans} ק״ג.`,
  };
}

function pulleys(r) {
  const n = r.pick([2, 3, 4, 6]), w = r.pick([120, 180, 240, 360]);
  if (r.chance(0.5)) {
    const h = r.pick([2, 3, 5]);
    return {
      diagram: { type: 'pulley', n, w },
      prompt: `במערכת גלגלות ${n} חבלים מחזיקים את המשא. כדי להרים את המשא לגובה ${h} מטרים, כמה מטרים של חבל צריך למשוך?`,
      correct: `${n * h} מ׳`, wrong: [`${h} מ׳`, `${r1(h / n)} מ׳`, `${(n + 1) * h} מ׳`, `${2 * h} מ׳`],
      explain: `כל אחד מ־${n} החבלים מתקצר ב־${h} מ׳, ולכן מושכים ${n}×${h} = ${n * h} מ׳. מה שחוסכים בכוח — משלמים במרחק.`,
    };
  }
  const ans = w / n;
  return {
    diagram: { type: 'pulley', n, w },
    prompt: `במערכת גלגלות ${n} חבלים מחזיקים משא של ${w} ק״ג. מה הכוח הדרוש כדי להרים את המשא (בלי חיכוך, גלגלות חסרות משקל)?`,
    correct: `${ans} ק״ג`, wrong: [`${w} ק״ג`, `${w / 2} ק״ג`, `${Math.round(w / (n + 1))} ק״ג`, `${w * n} ק״ג`],
    explain: `המשקל מתחלק שווה בין ${n} החבלים: ${w}/${n} = ${ans} ק״ג.`,
  };
}

export function technicalQuestion(seed, sub, fixedId) {
  const r = makeRng(seed);
  const picked = r.pick(SUBS);
  let s = sub && ['gears', 'levers', 'pulleys', 'concepts'].includes(sub) ? sub : picked;
  if (fixedId) s = 'concepts';
  let q;
  if (s === 'gears') q = gears(r);
  else if (s === 'levers') q = levers(r);
  else if (s === 'pulleys') q = pulleys(r);
  else {
    const random = r.pick(TECH_CONCEPTS);
    const c = (fixedId && TECH_CONCEPTS.find((x) => x.id === fixedId)) || random;
    q = { prompt: c.q, correct: c.correct, wrong: c.wrong, explain: c.explain, itemId: c.id };
  }
  const { options, answer } = withDistractors(r, q.correct, [...q.wrong, 'אף תשובה'], String);
  return { topic: 'technical', sub: s, seed, kind: q.diagram ? 'tech' : 'text', v: 2, diagram: q.diagram, itemId: q.itemId, prompt: q.prompt, options, answer, explain: q.explain };
}
