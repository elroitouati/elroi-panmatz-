// שאלות היגיון שנוצרות ונבדקות בכוח: מגרילים פתרון, כותבים רמזים, ומוודאים
// בחיפוש מלא שיש בדיוק פתרון אחד — כך שאין שאלה עם שתי תשובות.
import { makeRng, withDistractors } from './rng';

const PEOPLE = ['אבי', 'בתיה', 'גיל', 'דנה', 'הדר', 'ורד', 'זיו'];
const SUBS = ['order', 'match', 'must'];

function perms(arr) {
  if (arr.length <= 1) return [arr];
  const out = [];
  arr.forEach((x, i) => perms([...arr.slice(0, i), ...arr.slice(i + 1)]).forEach((p) => out.push([x, ...p])));
  return out;
}

// ---- סידור בשורה ----
function orderQ(r) {
  const n = r.pick([4, 5, 5]);
  const names = PEOPLE.slice(0, n);
  const sol = r.shuffle(names);
  const pos = (arr, x) => arr.indexOf(x);
  const clueMakers = [
    () => { const [a, b] = r.sample(names, 2); return pos(sol, a) < pos(sol, b) ? { t: `${a} עומד לפני ${b}.`, f: (p) => pos(p, a) < pos(p, b) } : { t: `${b} עומד לפני ${a}.`, f: (p) => pos(p, b) < pos(p, a) }; },
    () => { const i = r.int(0, n - 2); const a = sol[i], b = sol[i + 1]; return { t: `${a} עומד מיד לפני ${b}.`, f: (p) => pos(p, b) - pos(p, a) === 1 }; },
    () => { const a = r.pick(names); const i = pos(sol, a); return i === 0 ? { t: `${a} ראשון בשורה.`, f: (p) => pos(p, a) === 0 } : i === n - 1 ? { t: `${a} אחרון בשורה.`, f: (p) => pos(p, a) === n - 1 } : { t: `${a} לא ראשון ולא אחרון.`, f: (p) => pos(p, a) > 0 && pos(p, a) < n - 1 }; },
    () => { const [a, b] = r.sample(names, 2); return Math.abs(pos(sol, a) - pos(sol, b)) > 1 ? { t: `${a} ו${b} לא עומדים זה ליד זה.`, f: (p) => Math.abs(pos(p, a) - pos(p, b)) > 1 } : { t: `${a} ו${b} עומדים זה ליד זה.`, f: (p) => Math.abs(pos(p, a) - pos(p, b)) === 1 }; },
  ];
  const all = perms(names);
  const clues = [];
  let cand = all;
  let guard = 0;
  while (cand.length > 1 && guard++ < 40) {
    const c = r.pick(clueMakers)();
    const next = cand.filter(c.f);
    if (next.length < cand.length && next.length >= 1 && !clues.some((x) => x.t === c.t)) { clues.push(c); cand = next; }
  }
  if (cand.length !== 1) return orderQ(r);
  const askIdx = r.int(0, n - 1);
  const ordinal = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי'][askIdx];
  const correct = sol[askIdx];
  return {
    prompt: `${n} חברים עומדים בשורה (המקום הראשון מימין).\n${clues.map((c) => '• ' + c.t).join('\n')}\nמי עומד במקום ה${ordinal}?`,
    correct, wrong: names.filter((x) => x !== correct),
    explain: `הסידור היחיד שמתאים לכל הרמזים: ${sol.join(' ← ')}.`,
  };
}

// ---- טבלת התאמה (3×3) ----
function matchQ(r) {
  const names = r.sample(PEOPLE, 3);
  const cats = r.pick([
    { label: 'חיה', vals: ['כלב', 'חתול', 'תוכי'] },
    { label: 'ספורט', vals: ['ריצה', 'שחייה', 'כדורסל'] },
    { label: 'צבע', vals: ['אדום', 'כחול', 'ירוק'] },
  ]);
  const sol = r.shuffle(cats.vals); // sol[i] שייך ל-names[i]
  const all = perms(cats.vals);
  const makers = [
    () => { const i = r.int(0, 2); const v = r.pick(cats.vals.filter((x) => x !== sol[i])); return { t: `ל${names[i]} אין ${v}.`, f: (p) => p[i] !== v }; },
    () => { const i = r.int(0, 2); return { t: `ל${names[i]} יש ${sol[i]}.`, f: (p) => p[i] === sol[i] }; },
    () => { const [i, j] = r.sample([0, 1, 2], 2); const v = r.pick(cats.vals.filter((x) => x !== sol[i] && x !== sol[j])); return { t: `ה${cats.label} של ${names[i]} ושל ${names[j]} הוא לא ${v}.`, f: (p) => p[i] !== v && p[j] !== v }; },
  ];
  const clues = [];
  let cand = all;
  let guard = 0;
  while (cand.length > 1 && guard++ < 40) {
    const c = r.pick(makers)();
    if (clues.length === 0 && c.t.includes(' יש ') ) continue; // לא נותנים תשובה ישירה כרמז ראשון
    const next = cand.filter(c.f);
    if (next.length < cand.length && next.length >= 1 && !clues.some((x) => x.t === c.t)) { clues.push(c); cand = next; }
  }
  if (cand.length !== 1) return matchQ(r);
  const ask = r.int(0, 2);
  // אסור שהתשובה תופיע כרמז ישיר
  if (clues.some((c) => c.t === `ל${names[ask]} יש ${sol[ask]}.`)) return matchQ(r);
  return {
    prompt: `ל${names.join(', ')} יש לכל אחד ${cats.label} אחר: ${cats.vals.join(', ')}.\n${clues.map((c) => '• ' + c.t).join('\n')}\nמה ה${cats.label} של ${names[ask]}?`,
    correct: sol[ask], wrong: [...cats.vals.filter((v) => v !== sol[ask]), 'אי אפשר לדעת'],
    explain: names.map((nm, i) => `${nm} — ${sol[i]}`).join(', ') + '. רק השיבוץ הזה מתאים לכל הרמזים.',
  };
}

// ---- מה בהכרח נכון (קבוצות) ----
const MUST = [
  { p: ['כל הטייסים הם קצינים.', 'חלק מהקצינים הם רופאים.'], c: 'אי אפשר לדעת אם יש טייס שהוא רופא', opts: ['חלק מהטייסים הם רופאים', 'אין טייס שהוא רופא', 'כל הרופאים הם קצינים'], ex: 'הרופאים יכולים להיות בחלק של הקצינים שאינו טייסים — לכן אף אחת מהטענות על טייסים ורופאים לא בהכרח נכונה.' },
  { p: ['כל הכלבים נובחים.', 'רקס לא נובח.'], c: 'רקס אינו כלב', opts: ['רקס הוא כלב שקט', 'חלק מהכלבים לא נובחים', 'כל מי שנובח הוא כלב'], ex: 'אם רקס היה כלב — הוא היה נובח. הוא לא נובח, ולכן הוא לא כלב.' },
  { p: ['אף דג אינו יונק.', 'כל הלווייתנים הם יונקים.'], c: 'אף לווייתן אינו דג', opts: ['חלק מהלווייתנים הם דגים', 'כל היונקים הם לווייתנים', 'חלק מהדגים הם לווייתנים'], ex: 'לווייתן הוא יונק, ויונק אינו דג — לכן לווייתן אינו דג.' },
  { p: ['כל מי שמתאמן כל יום — מצליח בריצה.', 'נועה מצליחה בריצה.'], c: 'אי אפשר לדעת אם נועה מתאמנת כל יום', opts: ['נועה מתאמנת כל יום', 'נועה לא מתאמנת כל יום', 'כל מי שמצליח בריצה מתאמן כל יום'], ex: '"כל מי שמתאמן מצליח" לא אומר ש"כל מי שמצליח מתאמן". זו טעות ההיפוך.' },
  { p: ['כל התפוחים בארגז אדומים.', 'יש בארגז פרי ירוק.'], c: 'בארגז יש פרי שאינו תפוח', opts: ['בארגז אין תפוחים', 'חלק מהתפוחים ירוקים', 'כל הפירות בארגז ירוקים'], ex: 'הפרי הירוק לא יכול להיות תפוח (כל התפוחים אדומים), ולכן הוא פרי אחר.' },
  { p: ['אם יורד גשם — המגרש רטוב.', 'המגרש יבש.'], c: 'לא ירד גשם', opts: ['ירד גשם', 'המגרש היה רטוב קודם', 'אי אפשר לדעת אם ירד גשם'], ex: 'אם היה גשם, המגרש היה רטוב. הוא יבש — לכן לא היה גשם (שלילת התוצאה).' },
  { p: ['אם יורד גשם — המגרש רטוב.', 'המגרש רטוב.'], c: 'אי אפשר לדעת אם ירד גשם', opts: ['ירד גשם', 'לא ירד גשם', 'המגרש תמיד רטוב'], ex: 'המגרש יכול להיות רטוב גם מסיבה אחרת (השקיה). אישור התוצאה לא מוכיח את הסיבה.' },
  { p: ['חלק מהחיילים הם ספורטאים.', 'כל הספורטאים ישנים 8 שעות.'], c: 'חלק מהחיילים ישנים 8 שעות', opts: ['כל החיילים ישנים 8 שעות', 'כל מי שישן 8 שעות הוא ספורטאי', 'אף חייל לא ישן 8 שעות'], ex: 'החיילים שהם ספורטאים — ישנים 8 שעות. לכן לפחות חלק מהחיילים ישנים 8 שעות.' },
  { p: ['דני גבוה מיוסי.', 'יוסי גבוה מרון.'], c: 'דני גבוה מרון', opts: ['רון גבוה מדני', 'יוסי הכי גבוה', 'אי אפשר לדעת מי הכי נמוך'], ex: 'דני > יוסי > רון, ולכן דני > רון.' },
  { p: ['כל מי שבחוג השחמט — בחוג המתמטיקה.', 'אף אחד מחוג המתמטיקה אינו בחוג הכדורגל.'], c: 'אף אחד מחוג השחמט אינו בחוג הכדורגל', opts: ['חלק מחוג השחמט בכדורגל', 'כל חוג המתמטיקה בשחמט', 'מי שלא בכדורגל — בשחמט'], ex: 'שחמט ⊂ מתמטיקה, ומתמטיקה לא נוגעת בכדורגל — לכן גם שחמט לא נוגע בכדורגל.' },
  { p: ['רק מי שעבר את המבחן יכול להירשם.', 'מיכל נרשמה.'], c: 'מיכל עברה את המבחן', opts: ['מיכל לא עברה את המבחן', 'כל מי שעבר נרשם', 'אי אפשר לדעת אם מיכל עברה'], ex: '"רק מי שעבר יכול להירשם" — כלומר כל הנרשמים עברו. מיכל נרשמה, אז עברה.' },
  { p: ['כל המכוניות האדומות מהירות.', 'חלק מהמכוניות המהירות יקרות.'], c: 'אי אפשר לדעת אם יש מכונית אדומה יקרה', opts: ['חלק מהמכוניות האדומות יקרות', 'כל המכוניות היקרות אדומות', 'אין מכונית אדומה יקרה'], ex: 'המכוניות היקרות יכולות להיות במהירות שאינן אדומות — אין מידע שמחבר אדום ליקר.' },
  { p: ['בכל יום שבו אלון רץ — הוא אוכל ארוחת בוקר.', 'ביום שלישי אלון לא אכל ארוחת בוקר.'], c: 'ביום שלישי אלון לא רץ', opts: ['ביום שלישי אלון רץ', 'אלון רץ רק בימי שלישי', 'אי אפשר לדעת'], ex: 'אם היה רץ — היה אוכל ארוחת בוקר. לא אכל, ולכן לא רץ.' },
  { p: ['אף ציפור במכלאה אינה עפה.', 'התוכי נמצא במכלאה.'], c: 'התוכי אינו עף', opts: ['התוכי עף', 'כל התוכים לא עפים', 'אין ציפורים במכלאה'], ex: 'התוכי הוא ציפור במכלאה, ואף ציפור במכלאה לא עפה.' },
];

function mustQ(r) {
  const m = r.pick(MUST);
  return { prompt: `${m.p.join('\n')}\nאיזו טענה בהכרח נכונה?`, correct: m.c, wrong: m.opts, explain: m.ex, fixed: MUST.indexOf(m) };
}

export function logicQuestion(seed, sub) {
  const r = makeRng(seed);
  const s = sub && SUBS.includes(sub) ? sub : r.pick(SUBS);
  const q = s === 'order' ? orderQ(r) : s === 'match' ? matchQ(r) : mustQ(r);
  const { options, answer } = withDistractors(r, q.correct, r.shuffle(q.wrong), String);
  return { topic: 'logic', sub: s, seed, kind: 'text', prompt: q.prompt, options, answer, explain: q.explain };
}

export const MUST_COUNT = MUST.length;
