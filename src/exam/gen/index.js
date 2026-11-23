// נקודת כניסה אחת: makeQuestion({ topic, sub, seed }) → שאלה שלמה.
// אותו seed = אותה שאלה בדיוק (חזרה ממחברת הטעויות, סימולציה שנשמרה).
import { seriesQuestion } from './series';
import { arithmeticQuestion } from './arithmetic';
import { chartsQuestion } from './charts';
import { figuresQuestion } from './figures';
import { logicQuestion } from './logic';
import { vocabQuestion } from './vocab';
import { analogiesQuestion } from './analogies';
import { technicalQuestion } from './technical';

const GEN = {
  vocab: (s, sub, ref) => vocabQuestion(s, sub, ref),
  analogies: (s, sub, ref) => analogiesQuestion(s, sub, ref),
  series: (s, sub) => seriesQuestion(s, sub),
  arithmetic: (s, sub) => arithmeticQuestion(s, sub),
  figures: (s, sub) => figuresQuestion(s, sub),
  logic: (s, sub) => logicQuestion(s, sub),
  technical: (s, sub, ref) => technicalQuestion(s, sub, ref),
  charts: (s, sub) => chartsQuestion(s, sub),
};

// ref = מזהה פריט קבוע (מילה / אנלוגיה / שאלה טכנית) כשרוצים בדיוק אותו פריט
export function makeQuestion({ topic, sub, seed, ref }) {
  const q = GEN[topic](seed >>> 0, sub, ref);
  q.ref = ref || q.wordId || q.itemId || null;
  // המזהה נבנה מהערכים שנבחרו בפועל — זהה בין יצירה ראשונה לשחזור
  q.id = `${topic}:${q.sub}:${seed >>> 0}:${q.ref || ''}`;
  return q;
}
