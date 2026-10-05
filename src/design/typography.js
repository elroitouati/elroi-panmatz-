// פריסטים לטקסט. כל טקסט באפליקציה משתמש באחד מהם.
// משקל מגיע מקובץ הפונט עצמו — לא fontWeight — כדי שאנדרואיד לא יסנתז הדגשה.
import { colors, type } from './tokens';
import { dir } from './rtl';

const base = { letterSpacing: 0, textAlign: dir.start, includeFontPadding: false };
const t = ([fontSize, lineHeight], fontFamily, color = colors.ink) => ({
  ...base, fontSize, lineHeight, fontFamily, color,
});

export const text = {
  largeTitle: t(type.largeTitle, type.family.heavy),
  title: t(type.title, type.family.bold),
  headline: t(type.headline, type.family.medium),
  headlineStrong: t(type.headline, type.family.bold),
  body: t(type.body, type.family.regular),
  bodyDim: t(type.body, type.family.regular, colors.ink2),
  sub: t(type.sub, type.family.regular, colors.ink2),
  caption: t(type.caption, type.family.medium, colors.ink3),
  captionStrong: t(type.caption, type.family.bold, colors.gold),
  button: { ...t(type.headline, type.family.bold), textAlign: 'center' },
  stat: { ...t(type.stat, type.family.heavy), ...type.tabular },
  statSm: { ...t(type.statSm, type.family.heavy), ...type.tabular },
  value: { ...t(type.body, type.family.regular, colors.ink2), ...type.tabular },
};

export function unitStyle(size) {
  return { fontSize: Math.round(size * type.unitRatio), opacity: type.unitOpacity, fontFamily: type.family.bold };
}
