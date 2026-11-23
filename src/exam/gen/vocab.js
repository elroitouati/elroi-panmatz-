// שאלות אוצר מילים מתוך המאגר. מסיחים = פירושים של מילים אחרות מאותה שכבה,
// כדי שהרמה תהיה דומה. לפעמים הפוך: נתון פירוש, בוחרים מילה.
import { makeRng, withDistractors } from './rng';
import { WORDS } from '../data/words';

const SUB_TIER = { tierA: 'A', tierB: 'B', phrases: 'P' };

export function vocabQuestion(seed, sub, wordId) {
  const r = makeRng(seed);
  let pool;
  let s = sub;
  if (wordId) {
    const w = WORDS.find((x) => x.id === wordId);
    s = Object.keys(SUB_TIER).find((k) => SUB_TIER[k] === w?.tier) || 'tierA';
  }
  if (!s || !SUB_TIER[s]) s = r.pick(['tierA', 'tierA', 'tierB', 'tierB', 'phrases']);
  pool = WORDS.filter((x) => x.tier === SUB_TIER[s]);
  const word = wordId ? WORDS.find((x) => x.id === wordId) : r.pick(pool);
  const others = r.shuffle(pool.filter((x) => x.id !== word.id && x.m !== word.m));
  const reverse = r.chance(0.3);
  if (reverse) {
    const { options, answer } = withDistractors(r, word.w, others.map((x) => x.w), String);
    return { topic: 'vocab', sub: s, seed, kind: 'text', wordId: word.id, prompt: `איזו מילה פירושה: „${word.m}”?`, options, answer, explain: `${word.w} — ${word.m}. ${word.s}` };
  }
  const { options, answer } = withDistractors(r, word.m, others.map((x) => x.m), String);
  return { topic: 'vocab', sub: s, seed, kind: 'word', wordId: word.id, prompt: 'מה פירוש המילה?', word: word.w, options, answer, explain: `${word.w} — ${word.m}. ${word.s}` };
}
