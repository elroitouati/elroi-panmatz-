// מחולל מספרים אקראיים עם זרע (mulberry32) — כדי ששאלה תשוחזר בדיוק
// (מחברת טעויות, חזרה על סימולציה) ושהבדיקות יהיו דטרמיניסטיות.
export function makeRng(seed) {
  let a = (seed >>> 0) || 1;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const r = {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    chance: (p) => next() < p,
    shuffle: (arr) => {
      const a2 = arr.slice();
      for (let i = a2.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [a2[i], a2[j]] = [a2[j], a2[i]];
      }
      return a2;
    },
    sample: (arr, n) => r.shuffle(arr).slice(0, n),
  };
  return r;
}

export function seedFrom(...parts) {
  let h = 2166136261;
  const s = parts.join('|');
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

// מערבב תשובה נכונה עם מסיחים ומחזיר { options, answer }
export function withDistractors(rng, correct, distractors, key = (x) => JSON.stringify(x)) {
  const seen = new Set([key(correct)]);
  const uniq = [];
  for (const d of distractors) {
    const k = key(d);
    if (!seen.has(k)) { seen.add(k); uniq.push(d); }
    if (uniq.length === 3) break;
  }
  const options = rng.shuffle([correct, ...uniq]);
  return { options, answer: options.findIndex((o) => key(o) === key(correct)) };
}
