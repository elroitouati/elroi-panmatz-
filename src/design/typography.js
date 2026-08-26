// ============================================================================
//  טיפוגרפיה — פריסטים מוכנים
//  כל טקסט באפליקציה משתמש באחד מהם. אין fontSize/fontWeight ישירות במסך.
//
//  בעברית אין רישיות ואין נטוי, ולכן ההיררכיה נשענת על שלושה מנופים בלבד:
//  גודל, משקל, צבע. הקפיצות חייבות להיות גדולות — 24 מעל 17 זו מדרגה,
//  18 מעל 16 זה רעש.
//
//  שים לב: כשמוגדר fontFamily ייעודי למשקל, לא מגדירים גם fontWeight —
//  אחרת אנדרואיד מסנתז הדגשה מעל פונט שכבר מודגש והתוצאה מרוחה.
// ============================================================================

import { colors, type } from './tokens';
import { dir } from './rtl';

const base = {
  letterSpacing: type.letterSpacing,  // 0 — tracking שלילי אסור בעברית
  textAlign: dir.start,
  includeFontPadding: false,          // אנדרואיד: מבטל ריפוד עליון שרירותי
};

export const text = {
  // תווית — משקל 600 בגודל קטן. זו החלופה העברית ל-UPPERCASE של לטינית.
  label: {
    ...base,
    fontFamily: type.family.medium,
    fontSize: type.size.label,
    lineHeight: type.lineHeight.label,
    color: colors.text3,
  },

  // תווית מודגשת — כשהתווית צריכה להיקרא, לא רק להתקיים.
  labelStrong: {
    ...base,
    fontFamily: type.family.medium,
    fontSize: type.size.label,
    lineHeight: type.lineHeight.label,
    color: colors.text2,
  },

  // גוף — 17px, גובה שורה 1.55. לעולם לא ב-text3.
  body: {
    ...base,
    fontFamily: type.family.regular,
    fontSize: type.size.body,
    lineHeight: type.lineHeight.body,
    color: colors.text1,
  },

  bodyDim: {
    ...base,
    fontFamily: type.family.regular,
    fontSize: type.size.body,
    lineHeight: type.lineHeight.body,
    color: colors.text2,
  },

  bodyStrong: {
    ...base,
    fontFamily: type.family.medium,
    fontSize: type.size.body,
    lineHeight: type.lineHeight.body,
    color: colors.text1,
  },

  // כותרת מסך או מקטע.
  title: {
    ...base,
    fontFamily: type.family.bold,
    fontSize: type.size.title,
    lineHeight: type.lineHeight.title,
    color: colors.text1,
  },

  // מספרים — תמיד tabular, אחרת הספרות קופצות כשהערך מתעדכן.
  statSm: {
    ...base,
    ...type.tabular,
    fontFamily: type.family.bold,
    fontSize: type.size.statSm,
    lineHeight: type.lineHeight.statSm,
    color: colors.text1,
    textAlign: 'center',
  },

  stat: {
    ...base,
    ...type.tabular,
    fontFamily: type.family.bold,
    fontSize: type.size.stat,
    lineHeight: type.lineHeight.stat,
    color: colors.accent,
    textAlign: 'center',
  },

  button: {
    ...base,
    fontFamily: type.family.medium,
    fontSize: type.size.body,
    lineHeight: type.lineHeight.button,
    textAlign: 'center',
  },
};

// גודל ושקיפות היחידה שנלווית למספר (חז׳, דק׳, %) — 45% מהמספר, 60% שקיפות.
export function unitStyle(numberSize) {
  return {
    fontFamily: type.family.medium,
    fontSize: Math.round(numberSize * type.statUnitRatio),
    opacity: type.statUnitOpacity,
    letterSpacing: 0,
  };
}
