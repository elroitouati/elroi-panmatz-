// שאלות אוצר מילים מתוך המאגר. מסיחים = פירושים של מילים אחרות מאותה שכבה,
// כדי שהרמה תהיה דומה. לפעמים הפוך: נתון פירוש, בוחרים מילה.
import { makeRng, withDistractors } from './rng';
import { WORDS } from '../data/words';

const SUB_TIER = { tierA: 'A', tierB: 'B', phrases: 'P' };

// hard = גרסה 2: יותר מילים נדירות וביטויים, פחות מילים נפוצות
export function vocabQuestion(seed, sub, wordId, hard = false) {
  const r = makeRng(seed);
  // צורכים את ה-RNG תמיד באותו סדר — כדי ששחזור עם wordId ייתן שאלה זהה
  const pickedSub = r.pick(hard ? ['tierA', 'tierB', 'tierB', 'tierB', 'phrases', 'phrases'] : ['tierA', 'tierA', 'tierB', 'tierB', 'phrases']);
  const fixed = wordId ? WORDS.find((x) => x.id === wordId) : null;
  let s = fixed ? Object.keys(SUB_TIER).find((k) => SUB_TIER[k] === fixed.tier) : sub && SUB_TIER[sub] ? sub : pickedSub;
  const pool = WORDS.filter((x) => x.tier === SUB_TIER[s]);
  const random = r.pick(pool);
  const word = fixed || random;
  const others = r.shuffle(pool.filter((x) => x.id !== word.id && x.m !== word.m));
  const reverse = r.chance(0.3);
  if (reverse) {
    const { options, answer } = withDistractors(r, word.w, others.map((x) => x.w), String);
    return { topic: 'vocab', sub: s, seed, kind: 'text', wordId: word.id, prompt: `איזו מילה פירושה "${word.m}"?`, options, answer, explain: `${word.w} — ${word.m}. ${word.s}` };
  }
  const { options, answer } = withDistractors(r, word.m, others.map((x) => x.m), String);
  return { topic: 'vocab', sub: s, seed, kind: 'word', wordId: word.id, prompt: 'מה פירוש המילה?', word: word.w, options, answer, explain: `${word.w} — ${word.m}. ${word.s}` };
}
