// נקודת כניסה אחת: makeQuestion({ topic, sub, seed, ref, v }) → שאלה שלמה.
// אותו seed = אותה שאלה בדיוק (חזרה ממחברת הטעויות, סימולציה שנשמרה).
//
// גרסאות: v2 = המחוללים הקשים בפורמט של תיל (ברירת המחדל לכל שאלה חדשה).
// v1 = המחוללים הקודמים — רק כדי ששאלה ישנה (טעות שנשמרה, מבחן קודם) תיבנה
// מחדש בדיוק כמו שהייתה. שאלה ישנה מזוהה לפי המזהה שלה (בלי ‎":v2"‎ בסוף).
import { seriesQuestion } from './series';
import { arithmeticQuestion } from './arithmetic';
import { chartsQuestion } from './charts';
import { figuresQuestion } from './figures';
import { logicQuestion } from './logic';
import { logicQuestion as logic2 } from './v2/logic';
import { technicalQuestion } from './technical';
import { seriesQuestion as series1 } from './v1/series';
import { arithmeticQuestion as arithmetic1 } from './v1/arithmetic';
import { chartsQuestion as charts1 } from './v1/charts';
import { figuresQuestion as figures1 } from './v1/figures';
import { logicQuestion as logic1 } from './v1/logic';
import { technicalQuestion as technical1 } from './v1/technical';
import { vocabQuestion } from './vocab';
import { analogiesQuestion } from './analogies';

export const GEN_VERSION = 3;

const GEN = {
  3: null, // = גרסה 2, חוץ מהיגיון ברמת המבחן (למטה)
  2: {
    vocab: (s, sub, ref) => vocabQuestion(s, sub, ref, true),
    analogies: (s, sub, ref) => analogiesQuestion(s, sub, ref),
    series: (s, sub) => seriesQuestion(s, sub),
    arithmetic: (s, sub) => arithmeticQuestion(s, sub),
    figures: (s, sub) => figuresQuestion(s, sub),
    logic: (s, sub) => logic2(s, sub),
    technical: (s, sub, ref) => technicalQuestion(s, sub, ref),
    charts: (s, sub) => chartsQuestion(s, sub),
  },
  1: {
    vocab: (s, sub, ref) => vocabQuestion(s, sub, ref),
    analogies: (s, sub, ref) => analogiesQuestion(s, sub, ref),
    series: (s, sub) => series1(s, sub),
    arithmetic: (s, sub) => arithmetic1(s, sub),
    figures: (s, sub) => figures1(s, sub),
    logic: (s, sub) => logic1(s, sub),
    technical: (s, sub, ref) => technical1(s, sub, ref),
    charts: (s, sub) => charts1(s, sub),
  },
};
// גרסה 3: שאלות ההיגיון ירדו לרמת המבחן של תיל (4–5 פריטים, 2–4 רמזים). שאר הנושאים — כמו גרסה 2.
GEN[3] = { ...GEN[2], logic: (s, sub) => logicQuestion(s, sub) };

// גרסת השאלה: מפורשת (v), או לפי המזהה השמור (‎:vN‎ בסוף; בלי סיומת = גרסה 1), או החדשה
export function versionOf(it) {
  if (it.v) return it.v;
  if (it.qid) { const m = /:v(\d+)$/.exec(it.qid); return m ? Number(m[1]) : 1; }
  return GEN_VERSION;
}

// ref = מזהה פריט קבוע (מילה / אנלוגיה / שאלה טכנית) כשרוצים בדיוק אותו פריט
export function makeQuestion(it) {
  const { topic, sub, seed, ref } = it;
  const v = versionOf(it);
  const q = GEN[v][topic](seed >>> 0, sub, ref);
  q.ref = ref || q.wordId || q.itemId || null;
  q.v = v;
  // המזהה נבנה מהערכים שנבחרו בפועל — זהה בין יצירה ראשונה לשחזור
  q.id = `${topic}:${q.sub}:${seed >>> 0}:${q.ref || ''}${v >= 2 ? `:v${v}` : ''}`;
  return q;
}
