// מאגר המילים. כל מילה: { id, w, m (פירוש קצר), s (משפט), tier: 'A'|'B'|'P' }.
import A from './wordsA';
import B from './wordsB';
import P from './phrases';

function parse(raw, tier, prefix) {
  const seen = new Set();
  const out = [];
  raw.trim().split('\n').forEach((line) => {
    const [w, m, s] = line.split('|').map((x) => (x || '').trim());
    if (!w || !m || seen.has(w)) return;
    seen.add(w);
    out.push({ id: `${prefix}:${w}`, w, m, s, tier });
  });
  return out;
}

export const WORDS = [...parse(A, 'A', 'a'), ...parse(B, 'B', 'b'), ...parse(P, 'P', 'p')];
export const WORD = Object.fromEntries(WORDS.map((x) => [x.id, x]));
export const TIERS = [
  { id: 'A', name: 'מילים נפוצות', sub: 'tierA' },
  { id: 'B', name: 'מילים נדירות', sub: 'tierB' },
  { id: 'P', name: 'ביטויים ומילות קישור', sub: 'phrases' },
];
export const wordsOfTier = (t) => WORDS.filter((x) => x.tier === t);
