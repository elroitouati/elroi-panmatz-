// ============================================================================
//  כיוון ובידוד דו-כיווני
//  האפליקציה נעולה RTL (I18nManager.forceRTL ב-App.js). הקובץ הזה הוא
//  נקודת ההחלטה היחידה לגבי כיוון — אין ערכי 'right'/'left' מפוזרים במסכים.
// ============================================================================

import { I18nManager, Platform } from 'react-native';

// יישור טקסט לוגי. RN לא תומך ב-textAlign: 'start', ולכן ממפים כאן פעם אחת.
// כשה-RTL פעיל, אנדרואיד מחליף left↔right (doLeftAndRightSwapInRTL):
// 'left' מתרנדר בצד ימין. בהרצה הראשונה, לפני שה-RTL נכנס לתוקף, אין החלפה.
const swap = I18nManager.isRTL && I18nManager.doLeftAndRightSwapInRTL !== false;
// בדפדפן (גרסת המחשב) הכיוון נקבע ב-dir="rtl" על השורש — RNW לא מכיר את
// I18nManager, אבל מסדר שורות ו-start/end לפי ה-dir. לכן שם תמיד RTL.
export const IS_RTL = Platform.OS === 'web' ? true : I18nManager.isRTL;

export const dir = {
  start: swap ? 'left' : 'right',   // תחילת השורה בעברית — תמיד ימין על המסך
  end: swap ? 'right' : 'left',     // סופה — תמיד שמאל על המסך
};

// ---------------------------------------------------------------------------
//  בידוד דו-כיווני
// ---------------------------------------------------------------------------
//  בלי בידוד, מספר או מחרוזת לטינית בתוך משפט עברי גוררים איתם את הפיסוק:
//  "יעד היום: 5 חז׳." עלול להתרנדר עם הנקודה בצד הלא נכון, ומספר טלפון
//  או שעה עלולים להתהפך. LRI (U+2066) פותח קטע LTR, PDI (U+2069) סוגר.

const LRI = '⁦';  // LEFT-TO-RIGHT ISOLATE
const FSI = '⁨';  // FIRST STRONG ISOLATE
const PDI = '⁩';  // POP DIRECTIONAL ISOLATE

// מספרים, שעות, תאריכים, אחוזים — תמיד LTR.
export function ltr(value) {
  if (value === null || value === undefined) return '';
  return LRI + String(value) + PDI;
}

// ביטויים מספריים בתוך טקסט עברי — רשימות ("‎+8, ‎+6", "70, 76") ותרגילים ("5×12 = 60",
// "4k : (8k+8) = 5:12", "1/3 + 1/6") — מבודדים כ־LTR, אחרת בכיוון מימין לשמאל הסדר שלהם
// מתהפך על המסך. ביטוי מתחיל בספרה (או סוגר/סימן) ונגמר בספרה, ולא כולל אותיות עבריות.
const EXPR = /\u200e?[-+\u2212]?[\d(][\d\s.,+\-\u2212\u00d7\u00f7=:/()kx%\u200e\u00b2\u00b3\u2026]*[\d)%\u00b2\u00b3]/g;
const HAS_OP = /\d\s*[,+\-\u2212\u00d7\u00f7=:/]\s*[\d(\u200ekx+\-\u2212]|[)k]\s*[+\-\u2212\u00d7=:]/;
export function isoNums(text) {
  if (!text) return text;
  return String(text).replace(EXPR, (m) => (HAS_OP.test(m) ? LRI + m + PDI : m));
}

// טקסט שכיוונו נקבע לפי התו החזק הראשון (שם קובץ, כתובת, שם באנגלית).
export function isolate(value) {
  if (value === null || value === undefined) return '';
  return FSI + String(value) + PDI;
}
