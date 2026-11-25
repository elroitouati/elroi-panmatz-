// שמונת הנושאים של מבחן תיל, תתי־הנושאים שלהם, ומשקל משוער במבחן.
// משקל = חלק השאלות המשוער (לפי הסימולציה: 180 שאלות). משמש למדד המוכנות.

export const TOPICS = [
  { id: 'vocab', name: 'אוצר מילים', short: 'מילים', icon: 'text', weight: 25,
    subs: [['tierA', 'מילים נפוצות'], ['tierB', 'מילים נדירות'], ['phrases', 'ביטויים']] },
  { id: 'analogies', name: 'אנלוגיות', short: 'אנלוגיות', icon: 'swap-horizontal', weight: 25,
    subs: [['tool', 'כלי ובעל מקצוע'], ['part', 'חלק ושלם'], ['cause', 'סיבה ותוצאה'], ['degree', 'דרגה ועוצמה'],
      ['opposite', 'ניגוד'], ['category', 'סוג וקבוצה'], ['function', 'תפקיד'], ['material', 'חומר ומוצר']] },
  { id: 'series', name: 'סדרות מספרים', short: 'סדרות', icon: 'trending-up', weight: 25,
    subs: [['add', 'הפרשים במחזור'], ['mul', 'הכפלה וחיבור'], ['alt', 'שתי סדרות לסירוגין'], ['fib', 'סכום קודמים'],
      ['diff2', 'הפרשים של הפרשים'], ['powers', 'ריבועים וחזקות'], ['mixed', 'פעולות מתחלפות']] },
  { id: 'arithmetic', name: 'שאלות חשבון', short: 'חשבון', icon: 'calculator', weight: 22,
    subs: [['fractions', 'שברים'], ['percent', 'אחוזים'], ['ratio', 'יחס'], ['motion', 'תנועה'], ['work', 'הספק'], ['average', 'ממוצע']] },
  { id: 'figures', name: 'סדרות צורות', short: 'צורות', icon: 'shapes', weight: 25,
    subs: [['rotate', 'סיבוב כפול'], ['union', 'חיבור'], ['xor', 'ביטול'], ['count', 'תנועה על המסגרת'], ['shade', 'שלוש תכונות']] },
  { id: 'logic', name: 'שאלות היגיון', short: 'היגיון', icon: 'git-network', weight: 20,
    subs: [['order', 'סידור בשורה'], ['match', 'טבלת התאמה'], ['must', 'מה בהכרח נכון']] },
  { id: 'technical', name: 'הבנה טכנית', short: 'טכנית', icon: 'cog', weight: 22,
    subs: [['gears', 'גלגלי שיניים'], ['levers', 'מנופים'], ['pulleys', 'גלגלות'], ['concepts', 'עקרונות פיזיקליים']] },
  { id: 'charts', name: 'הסקה מתרשים', short: 'תרשימים', icon: 'bar-chart', weight: 16,
    subs: [['read', 'קריאת ערך'], ['compare', 'השוואה'], ['change', 'שינוי ואחוזים']] },
];

export const TOPIC = Object.fromEntries(TOPICS.map((t) => [t.id, t]));
export const TOTAL_WEIGHT = TOPICS.reduce((s, t) => s + t.weight, 0);

// זמן יעד לשאלה (שניות) — לפי חלוקת הזמן בסימולציה
export const TIME_BUDGET = { vocab: 24, analogies: 29, series: 43, arithmetic: 82, figures: 72, logic: 105, technical: 60, charts: 86 };

export function subName(topicId, subId) {
  const t = TOPIC[topicId];
  const s = t && t.subs.find((x) => x[0] === subId);
  return s ? s[1] : '';
}

// מבנה הסימולציה המלאה — 180 שאלות, 180 דקות (הערכה; יעודכן כשיהיו פרטים רשמיים)
export const SIM_SECTIONS = [
  { topic: 'vocab', count: 25, minutes: 10 },
  { topic: 'analogies', count: 25, minutes: 12 },
  { topic: 'series', count: 25, minutes: 18 },
  { topic: 'arithmetic', count: 22, minutes: 30 },
  { topic: 'figures', count: 25, minutes: 30 },
  { topic: 'logic', count: 20, minutes: 35 },
  { topic: 'technical', count: 22, minutes: 22 },
  { topic: 'charts', count: 16, minutes: 23 },
];
