// נתוני ברירת מחדל — שלבי המסלול ויעדי הכושר ההתחלתיים
// נקודת פתיחה אמיתית: 0-2 עליות מתח ברצף, ריצת 2 ק"מ מתחת ל-10 דקות.
// דגש חזק על מתח (החולשה), עדינות בריצה (כבר חוזק).

// חמשת שלבי הקבלה לפנמ"צ, לפי הסדר הכרונולוגי
export const DEFAULT_STAGES = [
  {
    id: 'registration',
    name: 'הרשמה',
    icon: 'create-outline',
    defaultLabel: 'נובמבר 2026',
    note: 'ההרשמה נפתחת בנובמבר',
    date: null, // ISO day key כשנודע התאריך האמיתי
  },
  {
    id: 'psychotechnical',
    name: 'מבחן פסיכוטכני',
    icon: 'bulb-outline',
    defaultLabel: 'דצמבר 2026',
    note: 'מבחן קוגניטיבי',
    date: null,
  },
  {
    id: 'fieldday',
    name: 'יום שדה',
    icon: 'flag-outline',
    defaultLabel: 'ינואר 2027',
    note: 'מבחני כושר ומשימות קבוצתיות',
    date: null,
  },
  {
    id: 'medical',
    name: 'בדיקות רפואיות',
    icon: 'medkit-outline',
    defaultLabel: 'פברואר 2027',
    note: 'התאמה רפואית',
    date: null,
  },
  {
    id: 'summercourse',
    name: 'קורס הכנה בקיץ',
    icon: 'sunny-outline',
    defaultLabel: 'קיץ 2027',
    note: 'שלב אחרון לפני הקבלה',
    date: null,
  },
];

// ברירת מחדל: אימון א'–ה', מנוחה ו'–ש'  (0=ראשון ... 6=שבת)
export const DEFAULT_TRAINING_DAYS = [0, 1, 2, 3, 4];

export const DEFAULT_GOALS = [
  {
    id: 'pullups',
    name: 'מתח',
    category: 'strength',
    tracking: 'measured', // מספרים מדויקים + גרף
    unit: 'חזרות',
    enabled: true,
    emphasis: true, // החולשה — מודגש
    start: 2,
    current: 2,
    final: 30,
    step: 1, // עלייה עדינה של חזרה אחת בכל "קל לי"
    lowerIsBetter: false,
    maintenance: false,
    trainingDays: [...DEFAULT_TRAINING_DAYS],
    history: [],
  },
  {
    id: 'run2k',
    name: 'ריצת 2 ק"מ',
    category: 'run',
    tracking: 'measured',
    unit: 'זמן', // נמדד בשניות, מוצג כדקות:שניות
    enabled: true,
    emphasis: false, // חוזק — התקדמות עדינה
    start: 580, // ~9:40 דק'
    current: 580,
    final: 480, // יעד 8:00 דק'
    step: 10, // שיפור של 10 שניות בכל "קל לי"
    lowerIsBetter: true,
    maintenance: false,
    trainingDays: [0, 2, 4], // ריצה שלוש פעמים בשבוע
    history: [],
  },
  {
    id: 'pushups',
    name: 'שכיבות סמיכה',
    category: 'calisthenics',
    tracking: 'measured',
    unit: 'חזרות',
    enabled: true,
    emphasis: false,
    start: 10,
    current: 10,
    final: 50,
    step: 2,
    lowerIsBetter: false,
    maintenance: false,
    trainingDays: [...DEFAULT_TRAINING_DAYS],
    history: [],
  },
  {
    id: 'core',
    name: 'כפיפות בטן',
    category: 'calisthenics',
    tracking: 'check', // וי פשוט בלי מספרים
    unit: '',
    enabled: true,
    emphasis: false,
    start: 0,
    current: 0,
    final: 0,
    step: 0,
    lowerIsBetter: false,
    maintenance: false,
    trainingDays: [...DEFAULT_TRAINING_DAYS],
    history: [],
  },
  {
    id: 'aerobic',
    name: 'אירובי כללי',
    category: 'aerobic',
    tracking: 'check',
    unit: '',
    enabled: false, // כבוי כברירת מחדל — המשתמש מפעיל לפי רצון
    emphasis: false,
    start: 0,
    current: 0,
    final: 0,
    step: 0,
    lowerIsBetter: false,
    maintenance: false,
    trainingDays: [1, 3],
    history: [],
  },
];

// קישורי תרגול פסיכוטכני חיצוניים (אתרים ברמה קוגניטיבית גבוהה)
export const DEFAULT_PSYCH_LINKS = [
  {
    id: 'high-q',
    title: 'תרגול חשיבה כמותית ומילולית',
    subtitle: 'High-Q — סימולציות ותרגולים',
    url: 'https://www.high-q.co.il',
  },
  {
    id: 'kidum',
    title: 'סימולציות ומבחני תרגול',
    subtitle: 'קידום — מאגר תרגולים',
    url: 'https://www.kidum.com',
  },
  {
    id: 'series',
    title: 'סדרות והשלמת רצפים',
    subtitle: 'תרגול לוגי — סדרות מספרים וצורות',
    url: 'https://www.iq-tests.co.il',
  },
  {
    id: 'shapes',
    title: 'מבחני צורות וזריזות',
    subtitle: 'חשיבה מרחבית ותפיסה חזותית',
    url: 'https://www.brainmetrix.com',
  },
  {
    id: 'logic',
    title: 'לוגיקה וחשיבה אנליטית',
    subtitle: 'חידות וחשיבה מסדר גבוה',
    url: 'https://www.mensa.org/iq-challenge',
  },
];

export const DEFAULT_PSYCH_WEEKLY_TARGET = 5;
