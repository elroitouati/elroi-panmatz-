import { makeRng, withDistractors } from './rng';
import { ANALOGIES } from '../data/analogies';

export function analogiesQuestion(seed, sub, fixedId) {
  const r = makeRng(seed);
  let pool = sub ? ANALOGIES.filter((a) => a.sub === sub) : ANALOGIES;
  if (!pool.length) pool = ANALOGIES;
  const a = fixedId ? ANALOGIES.find((x) => x.id === fixedId) || r.pick(pool) : r.pick(pool);
  const { options, answer } = withDistractors(r, a.correct, a.wrong, String);
  const fmt = (p) => p.split(':').join(' : ');
  return {
    topic: 'analogies', sub: a.sub, seed, kind: 'analogy', itemId: a.id,
    prompt: 'איזה זוג מילים מקביל לזוג הנתון?', pair: fmt(a.pair),
    options: options.map(fmt), answer,
    explain: `הקשר: ${a.relation}. ${fmt(a.pair)} — כמו ${fmt(a.correct)}.`,
  };
}
