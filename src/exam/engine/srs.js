// חזרה מרווחת למילים — שיטת לייטנר עם 6 קופסאות.
// "ידעתי" מקדם קופסה ומרחיק את החזרה הבאה; "לא ידעתי" מחזיר לקופסה 1 (מחר).
// המרווחים מבוססים על מחקרי ריווח (Cepeda 2008): כשהמבחן בעוד חודשים,
// מרווח אופטימלי של כ־10–20% מהזמן שנשאר.
import { addDays, dayDiff } from './time';

export const BOX_DAYS = [0, 1, 2, 4, 8, 16, 32];
export const MASTERED_BOX = 5;
export const NEW_PER_DAY = 10;

export function review(card, knew, today) {
  const c = card || { box: 0, seen: 0, lapses: 0 };
  const box = knew ? Math.min((c.box || 0) + 1, 6) : 1;
  return {
    box,
    seen: (c.seen || 0) + 1,
    lapses: (c.lapses || 0) + (knew ? 0 : 1),
    last: today,
    due: addDays(today, BOX_DAYS[box]),
  };
}

export function isDue(card, today) {
  return !!card && card.due <= today;
}

// חבילת היום: קודם מילים שהגיע זמנן (הכי מאחרות קודם), ואז מילים חדשות.
export function todaysDeck(words, cards, today, { newLimit = NEW_PER_DAY, newIntroducedToday = 0, max = 30 } = {}) {
  const due = words
    .filter((w) => isDue(cards[w.id], today))
    .sort((a, b) => (cards[a.id].due < cards[b.id].due ? -1 : 1) || (cards[a.id].box - cards[b.id].box));
  const fresh = words.filter((w) => !cards[w.id]).slice(0, Math.max(0, newLimit - newIntroducedToday));
  return [...due.slice(0, max), ...fresh].slice(0, max);
}

export function wordStats(words, cards, today) {
  let mastered = 0, learning = 0, fresh = 0, due = 0;
  for (const w of words) {
    const c = cards[w.id];
    if (!c) { fresh++; continue; }
    if (c.box >= MASTERED_BOX) mastered++; else learning++;
    if (isDue(c, today)) due++;
  }
  return { mastered, learning, fresh, due, total: words.length };
}

export { dayDiff };
