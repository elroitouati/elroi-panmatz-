// שאלות היגיון — רמה קשה. כל שאלה נבדקת בחיפוש מלא על כל האפשרויות, כך שיש
// בדיוק פתרון אחד — או, כשהתשובה היא "אין פתרון", בדיוק אפס פתרונות.
//  • order — 6 אנשים בשורה, 5–7 רמזים. לפעמים שואלים "מה איננו נכון", ולפעמים
//            הרמזים סותרים זה את זה והתשובה היא "אין פתרון" (כמו בדוגמאות של תיל).
//  • match — 4 אנשים, לכל אחד ספורט וצבע. רמזים שמחברים בין התכונות.
//  • must  — "מה בהכרח נכון" / "מה איננו נכון" מתוך קטע קצר.
import { makeRng, withDistractors } from './rng';
import { MUST as MUST_V1 } from './v1/logic';

const PEOPLE = ['אבי', 'בתיה', 'גיל', 'דנה', 'הדר', 'ורד', 'זיו'];
const FEM = new Set(['בתיה', 'דנה', 'הדר', 'ורד']);
const stands = (n) => (FEM.has(n) ? 'עומדת' : 'עומד');
const SUBS = ['order', 'match', 'must'];
const NO_SOL = 'אין פתרון';
const ORD = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי'];
const ORD_F = ['ראשונה', 'שנייה', 'שלישית', 'רביעית', 'חמישית', 'שישית'];
const ordOf = (n, i) => (FEM.has(n) ? ORD_F[i] : ORD[i]);

function perms(arr) {
  if (arr.length <= 1) return [arr];
  const out = [];
  arr.forEach((x, i) => perms([...arr.slice(0, i), ...arr.slice(i + 1)]).forEach((p) => out.push([x, ...p])));
  return out;
}

// ---- סידור בשורה ----
function clueMakers(r, names, ref) {
  const n = names.length;
  const pos = (arr, x) => arr.indexOf(x);
  return [
    () => { const [a, b] = r.sample(names, 2); return pos(ref, a) < pos(ref, b) ? { t: `${a} ${stands(a)} לפני ${b} (לא בהכרח מיד).`, f: (p) => pos(p, a) < pos(p, b) } : null; },
    () => { const [a, b] = r.sample(names, 2); const d = pos(ref, b) - pos(ref, a); return d >= 2 ? { t: `בין ${a} ל${b} ${d - 1 === 1 ? 'עומד אדם אחד' : `עומדים ${d - 1} אנשים`}, ו${a} לפני ${b}.`, f: (p) => pos(p, b) - pos(p, a) === d } : null; },
    () => { const [a, b] = r.sample(names, 2); return Math.abs(pos(ref, a) - pos(ref, b)) > 1 ? { t: `${a} ו${b} לא עומדים זה ליד זה.`, f: (p) => Math.abs(pos(p, a) - pos(p, b)) > 1 } : null; },
    () => { const a = r.pick(names); const i = pos(ref, a); return i > 0 && i < n - 1 ? { t: `${a} לא בקצוות השורה.`, f: (p) => pos(p, a) > 0 && pos(p, a) < n - 1 } : null; },
    () => { const a = r.pick(names); const i = pos(ref, a); return { t: `${a} ${stands(a)} במקום ${i % 2 === 0 ? 'אי־זוגי' : 'זוגי'}.`, f: (p) => pos(p, a) % 2 === i % 2 }; },
    () => { const i = r.int(0, n - 2); const [a, b] = [ref[i], ref[i + 1]]; return { t: `${a} ${stands(a)} מיד לפני ${b}.`, f: (p) => pos(p, b) - pos(p, a) === 1 }; },
  ];
}

function orderQ(r, depth = 0) {
  const n = 6;
  const names = r.sample(PEOPLE, n);
  const sol = r.shuffle(names);
  const makers = clueMakers(r, names, sol);
  let cand = perms(names);
  const clues = [];
  let guard = 0;
  while (cand.length > 1 && guard++ < 300) {
    const c = r.pick(makers)();
    if (!c || clues.some((x) => x.t === c.t)) continue;
    const next = cand.filter(c.f);
    if (next.length < cand.length && next.length >= 1 && (clues.length > 3 || next.length > 2)) { clues.push(c); cand = next; }
  }
  if ((cand.length !== 1 || clues.length < 5 || clues.length > 7) && depth < 30) return orderQ(r, depth + 1);
  const head = `${n} חברים עומדים בשורה (מקום 1 הוא הראשון מימין).`;
  const order = `הסידור (מימין לשמאל): ${sol.join(', ')}.`;
  const kind = r.pick(['ask', 'ask', 'ask', 'ask', 'not', 'not', 'not', 'none']);

  if (kind === 'none') {
    // מוסיפים רמז שנכון לסידור אחר — ובודקים שבאמת לא נשאר אף סידור
    const alt = r.shuffle(names);
    const altMakers = clueMakers(r, names, alt);
    for (let k = 0; k < 60; k++) {
      const c = r.pick(altMakers)();
      if (!c || clues.some((x) => x.t === c.t)) continue;
      if (perms(names).filter((p) => clues.every((x) => x.f(p)) && c.f(p)).length === 0) {
        const all = [...clues];
        all.splice(r.int(1, all.length), 0, c);
        const askIdx = r.int(1, n - 2);
        return {
          prompt: `${head}\n${all.map((x) => '• ' + x.t).join('\n')}\nמי עומד במקום ה${ORD[askIdx]}?`,
          correct: NO_SOL, wrong: [sol[askIdx], ...r.shuffle(names.filter((x) => x !== sol[askIdx])).slice(0, 2)],
          explain: `הרמזים סותרים: בלי הרמז "${c.t.replace(/\.$/, '')}" יש סידור אחד בלבד (${sol.join(', ')}), והוא לא מקיים את הרמז הזה. לכן אין פתרון.`,
        };
      }
    }
  }
  if (kind === 'not') {
    // שלוש טענות נכונות ואחת שגויה — שואלים מה איננו נכון
    const idx = r.sample([0, 1, 2, 3, 4, 5], 4);
    const trues = idx.slice(0, 3).map((i) => `${sol[i]} ${stands(sol[i])} במקום ה${ORD[i]}`);
    const j = idx[3];
    const wrongPos = r.pick([0, 1, 2, 3, 4, 5].filter((x) => x !== j));
    const falseS = `${sol[j]} ${stands(sol[j])} במקום ה${ORD[wrongPos]}`;
    return {
      prompt: `${head}\n${clues.map((c) => '• ' + c.t).join('\n')}\nאיזו טענה איננה נכונה?`,
      correct: falseS, wrong: trues,
      explain: `${order} ${sol[j]} במקום ה${ORD[j]}, לא ה${ORD[wrongPos]}.`,
    };
  }
  const askIdx = r.int(1, n - 2);
  const correct = sol[askIdx];
  const others = r.shuffle(names.filter((x) => x !== correct));
  return {
    prompt: `${head}\n${clues.map((c) => '• ' + c.t).join('\n')}\nמי עומד במקום ה${ORD[askIdx]}?`,
    correct, wrong: [others[0], others[1], r.chance(0.5) ? NO_SOL : others[2]],
    explain: `${order} במקום ה${ORD[askIdx]}: ${correct} (${ordOf(correct, askIdx)} מימין).`,
  };
}

// ---- טבלת התאמה: 4 אנשים × ספורט × צבע ----
function matchQ(r, depth = 0) {
  const names = r.sample(PEOPLE, 4);
  const SPORT = ['ריצה', 'שחייה', 'כדורסל', 'טניס'];
  const COLOR = ['אדום', 'כחול', 'ירוק', 'צהוב'];
  const sp = r.shuffle(SPORT), co = r.shuffle(COLOR);
  const P = perms([0, 1, 2, 3]);
  let cand = [];
  for (const a of P) for (const b of P) cand.push([a, b]);
  const S = (c, i) => SPORT[c[0][i]], C = (c, i) => COLOR[c[1][i]];
  const colorOfSport = (c, sport) => COLOR[c[1][c[0].indexOf(SPORT.indexOf(sport))]];
  const sportOfColor = (c, color) => SPORT[c[0][c[1].indexOf(COLOR.indexOf(color))]];
  const clues = [];
  const makers = [
    () => { const i = r.int(0, 3); const v = r.pick(SPORT.filter((x) => x !== sp[i])); return { t: `הספורט של ${names[i]} אינו ${v}.`, f: (c) => S(c, i) !== v }; },
    () => { const i = r.int(0, 3); const v = r.pick(COLOR.filter((x) => x !== co[i])); return { t: `הצבע של ${names[i]} אינו ${v}.`, f: (c) => C(c, i) !== v }; },
    () => { const i = r.int(0, 3); return { t: `מי שהספורט שלו ${sp[i]} — הצבע שלו ${co[i]}.`, f: (c) => colorOfSport(c, sp[i]) === co[i] }; },
    () => { const i = r.int(0, 3); const v = r.pick(COLOR.filter((x) => x !== co[i])); return { t: `מי שהספורט שלו ${sp[i]} — הצבע שלו אינו ${v}.`, f: (c) => colorOfSport(c, sp[i]) !== v }; },
    () => { const i = r.int(0, 3); const v = r.pick(SPORT.filter((x) => x !== sp[i])); return { t: `מי שהצבע שלו ${co[i]} — הספורט שלו אינו ${v}.`, f: (c) => sportOfColor(c, co[i]) !== v }; },
    () => { if (clues.some((x) => x.direct)) return null; const i = r.int(0, 3); return { t: `הצבע של ${names[i]} הוא ${co[i]}.`, f: (c) => C(c, i) === co[i], direct: true }; },
    () => { const [i, j] = r.sample([0, 1, 2, 3], 2); const v = r.pick(COLOR.filter((x) => x !== co[i] && x !== co[j])); return { t: `הצבע של ${names[i]} ושל ${names[j]} אינו ${v}.`, f: (c) => C(c, i) !== v && C(c, j) !== v }; },
  ];
  let guard = 0;
  while (cand.length > 1 && guard++ < 400) {
    const c = r.pick(makers)();
    if (!c || clues.some((x) => x.t === c.t)) continue;
    const next = cand.filter(c.f);
    if (next.length < cand.length && next.length >= 1) { clues.push(c); cand = next; }
  }
  const k = r.int(0, 3);
  const color = co[k], ans = sp[k];
  if ((cand.length !== 1 || clues.length > 10 || clues.some((c) => c.t.includes(`${ans} — הצבע שלו ${color}`))) && depth < 30) return matchQ(r, depth + 1);
  return {
    prompt: `לכל אחד מהחברים — ${names.slice(0, 3).join(', ')} ו${names[3]} — יש ספורט אהוב שונה (${SPORT.join(', ')}) וצבע אהוב שונה (${COLOR.join(', ')}).\n${clues.map((c) => '• ' + c.t).join('\n')}\nמה הספורט של מי שהצבע האהוב שלו ${color}?`,
    correct: ans, wrong: r.shuffle(SPORT.filter((x) => x !== ans)),
    explain: names.map((nm, i) => `${nm}: ${sp[i]}, ${co[i]}`).join(' · ') + '. רק השיבוץ הזה מתאים לכל הרמזים.',
  };
}

// ---- מה בהכרח נכון / מה איננו נכון ----
const MUST_V2 = [
  { p: ['אף מורה אינו צעיר מגיל 25.', 'חלק מהמאמנים הם מורים.'], c: 'חלק מהמאמנים אינם צעירים מגיל 25', o: ['כל המאמנים בני 25 ומעלה', 'חלק מהמורים אינם מאמנים', 'אף מאמן אינו צעיר מגיל 25'], ex: 'המאמנים שהם מורים אינם צעירים מ־25. על שאר המאמנים אין מידע.' },
  { p: ['אם רוני מגיע — גם שקד מגיע.', 'אם שקד מגיע — תום לא מגיע.', 'תום הגיע.'], c: 'רוני לא הגיע', o: ['שקד הגיע', 'רוני הגיע', 'אי אפשר לדעת אם רוני הגיע'], ex: 'תום הגיע, לכן שקד לא הגיע. שקד לא הגיע, לכן גם רוני לא הגיע.' },
  { p: ['כל מי שעבר את הגיבוש — עבר את המבחן.', 'חלק ממי שעבר את המבחן לא התקבל.'], c: 'אי אפשר לדעת אם יש מי שעבר את הגיבוש ולא התקבל', o: ['חלק ממי שעבר את הגיבוש לא התקבל', 'כל מי שעבר את הגיבוש התקבל', 'כל מי שעבר את המבחן עבר את הגיבוש'], ex: 'מי שלא התקבלו יכולים כולם להיות מאלה שעברו את המבחן אבל לא את הגיבוש — או לא. אין מספיק מידע.' },
  { p: ['אף שחקן בקבוצה לא איחר לאימון.', 'כל מי שלא איחר לאימון קיבל פרס.', 'יואב לא קיבל פרס.'], c: 'יואב אינו שחקן בקבוצה', o: ['יואב לא איחר לאימון', 'יואב שחקן שאיחר לאימון', 'אי אפשר לדעת אם יואב שחקן'], ex: 'יואב לא קיבל פרס, ולכן איחר. אף שחקן לא איחר — לכן יואב אינו שחקן.' },
  { p: ['שירה גבוהה מתמר ונמוכה מנועה.', 'מיכל נמוכה מתמר.'], c: 'נועה גבוהה ממיכל', o: ['שירה הנמוכה מכולן', 'תמר גבוהה מנועה', 'מיכל גבוהה משירה'], ex: 'מהגבוהה: נועה, שירה, תמר, מיכל.' },
  { p: ['בכל יום גשום נועה לוקחת מטרייה.', 'ביום רביעי נועה לא לקחה מטרייה.', 'ביום חמישי נועה לקחה מטרייה.'], c: 'ביום רביעי לא ירד גשם', o: ['ביום חמישי ירד גשם', 'ביום חמישי לא ירד גשם', 'נועה לוקחת מטרייה רק בימים גשומים'], ex: 'אילו ירד גשם ביום רביעי — נועה הייתה לוקחת מטרייה. על יום חמישי אי אפשר לדעת.' },
  { p: ['כל הספרים במדף העליון כתובים בעברית.', 'כל הספרים בעברית קצרים מ־200 עמודים.', 'בספר "מסע" יש 250 עמודים.'], c: '"מסע" אינו כתוב בעברית', o: ['"מסע" נמצא במדף התחתון', 'חלק מהספרים בעברית ארוכים מ־200 עמודים', 'כל הספרים הקצרים כתובים בעברית'], ex: '"מסע" ארוך מ־200 עמודים, ולכן אינו בעברית (וגם לא במדף העליון). לא נאמר שיש רק שני מדפים.' },
  { p: ['רק מי שיש לו רישיון מתאים רשאי לנהוג במשאית.', 'לאלון יש רישיון מתאים.'], c: 'אי אפשר לדעת אם אלון נוהג במשאית', o: ['אלון נוהג במשאית', 'אלון אינו רשאי לנהוג במשאית', 'כל מי שנוהג ברכב פרטי רשאי לנהוג במשאית'], ex: '"רק מי שיש לו רישיון" אומר שבלי רישיון אסור — לא שכל מי שיש לו רישיון נוהג בפועל.' },
  // "מה איננו נכון" — בסגנון תיל: שלוש טענות שנובעות מהקטע ואחת שסותרת אותו
  { not: true, p: ['יעל קוראת רק ביוגרפיות.', 'אפרת קוראת רק ספרים באנגלית.', 'שרה לא קוראת ספרים באנגלית.', 'יעל ואפרת קראו את אותו ספר, ושרה לא קראה אותו.'], c: 'הספר היה בעברית', o: ['הספר היה ביוגרפיה', 'הספר היה באנגלית', 'שרה לא קוראת כל ספר שאפרת קוראת'], ex: 'יעל קוראת רק ביוגרפיות ואפרת רק באנגלית — לכן זו ביוגרפיה באנגלית. "בעברית" סותר את זה.' },
];

const MUST_ALL = [
  ...MUST_V2,
  ...MUST_V1.map((m) => ({ p: m.p, c: m.c, o: m.opts, ex: m.ex })),
];

function mustQ(r) {
  const m = r.pick(MUST_ALL);
  return { prompt: `${m.p.join('\n')}\n${m.not ? 'איזו טענה איננה נכונה?' : 'איזו טענה בהכרח נכונה?'}`, correct: m.c, wrong: r.shuffle(m.o), explain: m.ex };
}

export function logicQuestion(seed, sub) {
  const r = makeRng(seed);
  const picked = r.pick(SUBS);
  const s = sub && SUBS.includes(sub) ? sub : picked;
  const q = s === 'order' ? orderQ(r) : s === 'match' ? matchQ(r) : mustQ(r);
  const { options, answer } = withDistractors(r, q.correct, q.wrong, String);
  return { topic: 'logic', sub: s, seed, kind: 'text', v: 2, prompt: q.prompt, options, answer, explain: q.explain };
}

export const MUST_COUNT = MUST_ALL.length;
