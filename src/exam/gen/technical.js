// הבנה טכנית: גלגלי שיניים, מנופים וגלגלות — במחולל עם תרשים; עקרונות — מהמאגר.
import { makeRng, withDistractors } from './rng';
import { TECH_CONCEPTS } from '../data/technical';

const SUBS = ['gears', 'levers', 'pulleys', 'concepts', 'concepts'];

function gears(r) {
  const kind = r.int(0, 1);
  if (kind === 0) {
    const n = r.int(3, 5);
    const first = r.pick(['cw', 'ccw']);
    const teeth = Array.from({ length: n }, () => r.pick([10, 12, 16, 20]));
    const same = (n - 1) % 2 === 0;
    const ans = same ? first : first === 'cw' ? 'ccw' : 'cw';
    const name = { cw: 'עם כיוון השעון', ccw: 'נגד כיוון השעון' };
    return {
      diagram: { type: 'gears', teeth, first, ask: n - 1 },
      prompt: `${n} גלגלי שיניים משולבים בשורה. הגלגל הימני מסתובב ${name[first]}. לאיזה כיוון יסתובב הגלגל השמאלי?`,
      correct: name[ans], wrong: [name[ans === 'cw' ? 'ccw' : 'cw'], 'לא יסתובב', 'תלוי במספר השיניים'],
      explain: 'כל שני גלגלים משולבים מסתובבים בכיוונים הפוכים. לכן הכיוון מתחלף בכל גלגל: גלגל במקום אי־זוגי — כמו הראשון.',
    };
  }
  const a = r.pick([12, 15, 20, 24, 30, 36, 40]), b = r.pick([6, 8, 10, 12, 18, 20, 60]);
  const k = r.pick([2, 3, 4, 5, 6, 10]);
  const ans = (a * k) / b;
  if (!Number.isInteger(ans) || a === b) return gears(r);
  return {
    diagram: { type: 'gears', teeth: [a, b], first: 'cw', ask: 1, labels: true },
    prompt: `לגלגל א׳ יש ${a} שיניים ולגלגל ב׳ יש ${b} שיניים. גלגל א׳ השלים ${k} סיבובים. כמה סיבובים השלים גלגל ב׳?`,
    correct: String(ans), wrong: [String((b * k) / a), String(k), String(ans + k)].filter((x) => Number.isFinite(Number(x))),
    explain: `בכל סיבוב עוברות אותן שיניים בשני הגלגלים: ${a}×${k} = ${a * k} שיניים. ב׳ מסובב ${a * k}/${b} = ${ans} סיבובים. גלגל קטן — מסתובב יותר.`,
  };
}

function levers(r) {
  const w = r.pick([10, 20, 30, 40, 60]), d1 = r.int(1, 4), d2 = r.int(1, 6);
  const ans = (w * d1) / d2;
  if (!Number.isInteger(ans) || d1 === d2) return levers(r);
  return {
    diagram: { type: 'lever', w, d1, d2 },
    prompt: `על מוט מאוזן מונח משקל של ${w} ק״ג במרחק ${d1} מ׳ מנקודת המשען. איזה משקל צריך לשים במרחק ${d2} מ׳ בצד השני כדי שהמוט יהיה מאוזן?`,
    correct: `${ans} ק״ג`, wrong: [`${(w * d2) / d1} ק״ג`, `${w} ק״ג`, `${ans + 10} ק״ג`],
    explain: `איזון: משקל × מרחק שווה בשני הצדדים. ${w}×${d1} = ${w * d1}, לכן ${w * d1}/${d2} = ${ans} ק״ג.`,
  };
}

function pulleys(r) {
  const n = r.pick([1, 2, 3, 4]);
  const w = r.pick([60, 120, 240]);
  const ans = w / n;
  return {
    diagram: { type: 'pulley', n, w },
    prompt: `במערכת הגלגלות שבתרשים, המשא שוקל ${w} ק״ג ו־${n} ${n === 1 ? 'חבל מחזיק' : 'חבלים מחזיקים'} אותו. איזה כוח צריך כדי להרים אותו (בלי חיכוך)?`,
    correct: `${ans} ק״ג`, wrong: [`${w} ק״ג`, `${w * 2} ק״ג`, `${w / (n + 1)} ק״ג`].filter((x, i, a) => a.indexOf(x) === i),
    explain: `הכוח מתחלק בין החבלים שמחזיקים את המשא: ${w}/${n} = ${ans}. בתמורה — מושכים חבל ארוך פי ${n}.`,
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
  return { topic: 'technical', sub: s, seed, kind: q.diagram ? 'tech' : 'text', diagram: q.diagram, itemId: q.itemId, prompt: q.prompt, options, answer, explain: q.explain };
}
