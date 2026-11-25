// מחוללי שאלות ברמה קשה לחוברת התרגול להדפסה.
// כל מחולל מקבל rng ומחזיר { prompt, options, answer, explain, ...visual }.
// שאלות ההיגיון נבדקות בחיפוש מלא (פתרון יחיד), ושאלות החשבון בנויות כך שהתשובה שלמה.

export function makeHard({ makeRng, withDistractors, WORDS, ANALOGIES, TECH_CONCEPTS }) {
  const uniqNum = (r, correct, near, fmt = String) => {
    const fallback = [1, -1, 2, -2, 3, 5, 10, -10, 4, -3].map((k) => correct + k);
    const ds = [...near, ...fallback].filter((x) => Number.isFinite(x) && x !== correct);
    const { options, answer } = withDistractors(r, correct, ds, String);
    return { options: options.map(fmt), answer };
  };

  // ============================== סדרות ==============================
  // full = הסדרה המלאה, hide = המקום החסר (לא תמיד האחרון)
  const SERIES = [
    (r) => { // הפרשים שמוכפלים
      const a = r.int(2, 9), d = r.int(1, 3), m = r.pick([2, 3]);
      const s = [a]; let dd = d;
      for (let i = 0; i < 6; i++) { s.push(s[i] + dd); dd *= m; }
      return { full: s, explain: `ההפרשים מוכפלים פי ${m} בכל צעד: ${s.slice(1).map((x, i) => x - s[i]).join(', ')}.` };
    },
    (r) => { // הכפלה ואז חיסור לסירוגין
      const a = r.int(3, 7), m = r.pick([2, 3]), k = r.int(1, 5);
      const s = [a];
      for (let i = 0; i < 6; i++) s.push(i % 2 === 0 ? s[i] * m : s[i] - k);
      return { full: s, explain: `שתי פעולות מתחלפות: ×${m} ואז −${k}.` };
    },
    (r) => { // ×2+c
      const a = r.int(1, 6), m = r.pick([2, 3]), c = r.pick([1, 2, 3, -1]);
      const s = [a];
      for (let i = 0; i < 5; i++) s.push(s[i] * m + c);
      if (s.some((x) => x <= 0)) return SERIES[2](r);
      return { full: s, explain: `כל מספר = הקודם ×${m} ${c > 0 ? '+' : '−'} ${Math.abs(c)}.` };
    },
    (r) => { // ההפרשים הם מספרים ראשוניים
      const P = [2, 3, 5, 7, 11, 13, 17, 19];
      const st = r.int(0, 1), a = r.int(1, 20);
      const s = [a];
      for (let i = 0; i < 6; i++) s.push(s[i] + P[st + i]);
      return { full: s, explain: `ההפרשים הם המספרים הראשוניים: ${P.slice(st, st + 6).join(', ')}.` };
    },
    (r) => { // הפרש מתחלף בסימן וגדל בערכו המוחלט
      const a = r.int(10, 30), d = r.int(2, 4);
      const s = [a];
      for (let i = 0; i < 6; i++) s.push(s[i] + (i % 2 === 0 ? 1 : -1) * (d + i));
      return { full: s, explain: `ההפרשים: ${s.slice(1).map((x, i) => (x - s[i] > 0 ? '+' : '−') + Math.abs(x - s[i])).join(', ')} — הסימן מתחלף והגודל עולה ב־1.` };
    },
    (r) => { // כופלים במספר שגדל
      const a = r.int(1, 4), st = r.int(1, 2);
      const s = [a];
      for (let i = 0; i < 5; i++) s.push(s[i] * (st + i));
      return { full: s, explain: `כופלים כל פעם במספר גדול יותר: ×${st}, ×${st + 1}, ×${st + 2}…` };
    },
    (r) => { // סכום שלושת הקודמים
      const s = [r.int(1, 3), r.int(1, 4), r.int(2, 5)];
      while (s.length < 8) s.push(s[s.length - 1] + s[s.length - 2] + s[s.length - 3]);
      return { full: s, explain: 'כל מספר הוא סכום שלושת המספרים שלפניו.' };
    },
    (r) => { // שתי סדרות לסירוגין: הכפלה וחיסור
      const a = r.int(1, 3), b = r.int(40, 60), m = r.pick([2, 3]), k = r.int(3, 7);
      const s = [];
      for (let i = 0; i < 4; i++) { s.push(a * m ** i); s.push(b - k * i); }
      return { full: s, explain: `שתי סדרות משולבות: במקומות האי־זוגיים ×${m} (${[0, 1, 2, 3].map((i) => a * m ** i).join(', ')}), ובזוגיים −${k}.` };
    },
    (r) => { // n² + n או n² − n
      const st = r.int(2, 5), sign = r.pick([1, -1]);
      const s = Array.from({ length: 7 }, (_, i) => (st + i) ** 2 + sign * (st + i));
      return { full: s, explain: `n² ${sign > 0 ? '+' : '−'} n עבור n = ${st}, ${st + 1}, ${st + 2}… (או: ההפרשים גדלים ב־2).` };
    },
    (r) => { // חזקות שלישיות מינוס/ועוד קבוע
      const st = r.int(1, 3), c = r.pick([1, 2, -1]);
      const s = Array.from({ length: 6 }, (_, i) => (st + i) ** 3 + c);
      return { full: s, explain: `חזקה שלישית ${c > 0 ? 'ועוד' : 'פחות'} ${Math.abs(c)}: ${st}³${c > 0 ? '+' : '−'}${Math.abs(c)}, ${st + 1}³${c > 0 ? '+' : '−'}${Math.abs(c)}…` };
    },
    (r) => { // הפרשים של הפרשים קבועים (סדרה ריבועית)
      const a = r.int(1, 10), d = r.int(1, 4), dd = r.int(2, 4);
      const s = [a];
      for (let i = 0; i < 6; i++) s.push(s[i] + d + dd * i);
      return { full: s, explain: `ההפרשים (${s.slice(1).map((x, i) => x - s[i]).join(', ')}) גדלים ב־${dd} בכל צעד.` };
    },
    (r) => { // הקודם בריבוע פחות קבוע — קצרה
      const a = r.pick([2, 3]), c = a === 2 ? 1 : r.pick([3, 5, 6]);
      const s = [a];
      for (let i = 0; i < 3; i++) s.push(s[i] * s[i] - c);
      if (new Set(s).size < s.length || s.some((x) => x <= 0)) return SERIES[11](r);
      return { full: s, explain: `כל מספר = הקודם בריבוע פחות ${c}.` };
    },
    (r) => { // חילוק
      const m = r.pick([2, 3]), n = 6, last = r.int(1, 5);
      const s = Array.from({ length: n }, (_, i) => last * m ** (n - 1 - i));
      return { full: s, explain: `כל מספר הוא הקודם חלקי ${m}.` };
    },
    (r) => { // מספר ופעמיים: +k, ×2
      const a = r.int(2, 6), k = r.int(2, 6);
      const s = [a];
      for (let i = 0; i < 6; i++) s.push(i % 2 === 0 ? s[i] + k : s[i] * 2);
      return { full: s, explain: `שתי פעולות מתחלפות: +${k} ואז ×2.` };
    },
    (r) => { // סדרה שבה כל מספר = סכום הקודם ומקומו
      const a = r.int(1, 9);
      const s = [a];
      for (let i = 1; i < 7; i++) s.push(s[i - 1] * 2 - i);
      if (s.some((x) => x <= 0) || new Set(s).size < s.length) return SERIES[14](r);
      return { full: s, explain: 'כל מספר = הקודם ×2, פחות מספר המקום של הצעד (1, 2, 3…).' };
    },
  ];

  function series(r, idx) {
    const b = SERIES[idx](r);
    const full = b.full;
    const hide = full.length >= 7 && r.chance(0.4) ? r.int(2, full.length - 2) : full.length - 1;
    const correct = full[hide];
    const shown = full.map((x, i) => (i === hide ? '?' : x));
    const prev = full[hide - 1], next = full[hide + 1];
    const near = [
      correct + (prev - (full[hide - 2] ?? prev)),
      2 * prev - (full[hide - 2] ?? prev),
      next !== undefined ? next - (prev - (full[hide - 2] ?? 0)) : correct + 2,
      correct + 1, correct - 1, correct + 2,
    ].filter((x) => !full.includes(x) || x === correct);
    const { options, answer } = uniqNum(r, correct, near.filter((x) => !shown.includes(x)));
    return { kind: 'series', prompt: hide === full.length - 1 ? 'איזה מספר ממשיך את הסדרה?' : 'איזה מספר חסר בסדרה?', seq: shown, options, answer, explain: b.explain };
  }

  // ============================== חשבון ==============================
  const N = ['דני', 'יואב', 'אורי', 'איתי', 'עידו', 'רון', 'גיל'];
  const ARITH = [
    (r) => { // עלייה ואז ירידה — שינוי כולל
      const [up, down] = r.pick([[25, 20], [20, 25], [50, 20], [20, 20], [10, 10], [50, 50], [25, 40], [60, 25]]);
      const tot = Math.round(((1 + up / 100) * (1 - down / 100) - 1) * 1000) / 10;
      if (!Number.isInteger(tot)) return ARITH[0](r);
      const ex = `נניח מחיר 100. אחרי עלייה של ${up}%: ${100 + up}. ירידה של ${down}% מ־${100 + up}: ${(100 + up) * (1 - down / 100)}. השינוי הכולל: ${tot}%.`;
      return { text: `מחיר מוצר עלה ב־${up}% ואחר כך ירד ב־${down}%. בכמה אחוזים השתנה המחיר בסך הכול? (שלילי = ירידה)`, ans: tot, d: [up - down, 0, -tot, tot - 5, tot + 5].filter((x) => x !== tot), ex, fmt: (x) => `${x}%` };
    },
    (r) => { // ברז ממלא וברז מרוקן
      const [a, b, ans] = r.pick([[3, 6, 6], [4, 12, 6], [6, 10, 15], [2, 3, 6], [4, 6, 12], [5, 20, 20 / 3], [3, 4, 12], [6, 9, 18]]);
      if (!Number.isInteger(ans)) return ARITH[1](r);
      return { text: `ברז ממלא בריכה ב־${a} שעות, ופתח ניקוז מרוקן את הבריכה המלאה ב־${b} שעות. אם פותחים את שניהם כשהבריכה ריקה, בכמה שעות היא תתמלא?`, ans, d: [b - a, (a * b) / (a + b), a + b, b], ex: `בשעה: 1/${a} − 1/${b} = 1/${ans} מהבריכה מתמלאת. לכן ${ans} שעות.` };
    },
    (r) => { // הספק: א׳ לבד ושניהם יחד — כמה ב׳ לבד
      const [x, y, ans] = r.pick([[6, 4, 12], [10, 6, 15], [12, 8, 24], [15, 10, 30], [20, 12, 30], [3, 2, 6], [12, 4, 6]]);
      return { text: `פועל א׳ צובע בית ב־${x} ימים. שני הפועלים יחד צובעים אותו ב־${y} ימים. בכמה ימים יצבע פועל ב׳ לבדו?`, ans, d: [x - y, x + y, (x * y) / (x + y), 2 * y], ex: `ביום: יחד 1/${y}, א׳ לבד 1/${x}. ב׳ לבד: 1/${y} − 1/${x} = 1/${ans}. לכן ${ans} ימים.` };
    },
    (r) => { // השגה
      const v1 = r.pick([40, 50, 60]), dv = r.pick([10, 20, 30]), t = r.pick([1, 2, 3]);
      const v2 = v1 + dv, ans = (v1 * t) / dv;
      if (!Number.isInteger(ans)) return ARITH[3](r);
      const n = r.pick(N);
      return { text: `מכונית יצאה מעיר במהירות ${v1} קמ״ש. ${t === 1 ? 'שעה' : `${t} שעות`} אחריה יצא ${n} מאותה עיר, באותה דרך, במהירות ${v2} קמ״ש. כמה שעות אחרי היציאה שלו ישיג ${n} את המכונית?`, ans, d: [ans + t, (v1 * t) / v2, t, ans * 2].map((x) => Math.round(x * 10) / 10), ex: `בזמן שהמכונית נסעה לבד היא התרחקה ${v1}×${t} = ${v1 * t} ק״מ. ${n} סוגר ${dv} ק״מ בשעה: ${v1 * t}/${dv} = ${ans} שעות.` };
    },
    (r) => { // ממוצע אחרי הוצאת מספר
      const n = r.pick([5, 6, 8, 10]), a = r.int(12, 30), b = a + r.pick([-2, -1, 1, 2]);
      const ans = n * a - (n - 1) * b;
      if (ans <= 0) return ARITH[4](r);
      return { text: `הממוצע של ${n} מספרים הוא ${a}. הוציאו מספר אחד, והממוצע של הנותרים הוא ${b}. איזה מספר הוציאו?`, ans, d: [a - b, a, n * a - n * b, ans + b - a], ex: `סכום כל המספרים: ${n}×${a} = ${n * a}. סכום הנותרים: ${n - 1}×${b} = ${(n - 1) * b}. ההפרש: ${ans}.` };
    },
    (r) => { // גילים
      const [k, j, m] = r.pick([[4, 3, 5], [3, 2, 10], [5, 3, 4], [4, 2, 6], [3, 2, 8], [5, 4, 3], [6, 4, 5]]);
      const S = (m * (j - 1)) / (k - j);
      if (!Number.isInteger(S)) return ARITH[5](r);
      const F = k * S;
      return { text: `אבא מבוגר פי ${k} מבנו. בעוד ${m} שנים הוא יהיה מבוגר מבנו פי ${j}. בן כמה האבא היום?`, ans: F, d: [S, F + m, k * m, F - m], ex: `אם הבן בן x, האבא ${k}x. בעוד ${m} שנים: ${k}x+${m} = ${j}(x+${m}), ולכן x = ${S}. האבא: ${F}.` };
    },
    (r) => { // יחס שמשתנה
      const a = r.int(2, 5), b = r.int(a + 1, 8), k = r.int(3, 6), x = r.pick([2, 3, 4, 6]) * r.int(1, 2);
      const g = gcd(a * k, b * k + x);
      const c = (a * k) / g, d = (b * k + x) / g;
      if (c === a && d === b) return ARITH[6](r);
      const ans = (a + b) * k;
      return { text: `בכיתה היחס בין בנים לבנות היה ${a}:${b}. הצטרפו ${x} בנות, ועכשיו היחס ${c}:${d}. כמה תלמידים היו בכיתה לפני שהבנות הצטרפו?`, ans, d: [ans + x, (c + d) * k, a * k + b * k + 2 * x, (a + b) * (k + 1)].filter((v, i, arr) => arr.indexOf(v) === i), ex: `בנים: ${a}k, בנות: ${b}k. אחרי ההצטרפות: ${a}k : (${b}k+${x}) = ${c}:${d}. מכאן k = ${k}, ובכיתה היו ${a + b}×${k} = ${ans}.` };
    },
    (r) => { // מיהול
      const [m, p, q, ans] = r.pick([[200, 10, 8, 50], [300, 12, 9, 100], [400, 15, 10, 200], [500, 20, 16, 125], [240, 25, 20, 60], [600, 10, 6, 400]]);
      return { text: `בכלי יש ${m} גרם תמיסה שבה ${p}% מלח. כמה גרם מים צריך להוסיף כדי שריכוז המלח יהיה ${q}%?`, ans, d: [m * (p - q) / 100, m * (p - q) / q / 2, (m * p) / q, ans * 2], ex: `כמות המלח: ${p}% מ־${m} = ${(m * p) / 100} גרם, והיא לא משתנה. כדי שזה יהיה ${q}%, המשקל הכולל צריך להיות ${(m * p) / q}. מוסיפים ${ans} גרם מים.` };
    },
    (r) => { // סירה בזרם
      const [v, c, d] = r.pick([[10, 2, 24], [12, 4, 32], [15, 3, 36], [8, 2, 30], [14, 2, 48], [9, 3, 24]]);
      const ans = d / (v + c) + d / (v - c);
      if (!Number.isInteger(ans)) return ARITH[8](r);
      return { text: `מהירות סירה במים עומדים היא ${v} קמ״ש, ומהירות הזרם בנהר ${c} קמ״ש. הסירה שטה ${d} ק״מ עם הזרם, וחזרה ${d} ק״מ נגד הזרם. כמה שעות נמשכה כל השיטה?`, ans, d: [(2 * d) / v, d / (v + c) * 2, d / (v - c) * 2, ans + 1].map((x) => Math.round(x * 10) / 10), ex: `עם הזרם: ${v}+${c} = ${v + c} קמ״ש, ${d}/${v + c} = ${d / (v + c)} שעות. נגד הזרם: ${v}−${c} = ${v - c} קמ״ש, ${d}/${v - c} = ${d / (v - c)} שעות. סך הכול: ${ans}.` };
    },
    (r) => { // שברים מהיתרה — כמה היה בהתחלה
      const [f1, f2] = r.pick([[[1, 3], [1, 4]], [[1, 4], [2, 3]], [[2, 5], [1, 3]], [[1, 2], [1, 3]], [[3, 8], [2, 5]]]);
      const left = (1 - f1[0] / f1[1]) * (1 - f2[0] / f2[1]);
      const k = r.pick([2, 3, 4, 5, 6]);
      const T = Math.round(f1[1] * f2[1] * k * 10);
      const L = Math.round(T * left);
      if (Math.abs(T * left - L) > 1e-9) return ARITH[9](r);
      const n = r.pick(N);
      return { text: `${n} הוציא ${f1[0]}/${f1[1]} מהכסף שלו על ספרים, ואחר כך ${f2[0]}/${f2[1]} מהיתרה על אוכל. נשארו לו ${L} ש״ח. כמה כסף היה לו בהתחלה?`, ans: T, d: [Math.round(L / (1 - f1[0] / f1[1] - f2[0] / f2[1])), L * 2, T - L, Math.round(T * 1.2)].filter((x) => x > 0 && Number.isFinite(x)), ex: (() => { const nu = (f1[1] - f1[0]) * (f2[1] - f2[0]), de = f1[1] * f2[1], g = gcd(nu, de); const fr = `${nu / g}/${de / g}`; return `אחרי הספרים נשאר ${f1[1] - f1[0]}/${f1[1]} מהכסף, ואחרי האוכל ${f2[1] - f2[0]}/${f2[1]} מזה — כלומר ${fr} מהסכום. ${L} ÷ ${fr} = ${T}.`; })() };
    },
    (r) => { // מספרים זוגיים עוקבים
      const k = r.pick([4, 5, 6]), first = 2 * r.int(5, 30);
      const nums = Array.from({ length: k }, (_, i) => first + 2 * i);
      const S = nums.reduce((a, b) => a + b, 0);
      const ans = nums[k - 1];
      return { text: `סכומם של ${k} מספרים זוגיים עוקבים הוא ${S}. מהו הגדול מביניהם?`, ans, d: [nums[k - 2], Math.round(S / k), ans + 2, nums[0]], ex: `הממוצע ${S}/${k} = ${S / k} ${k % 2 ? 'הוא המספר האמצעי' : 'נמצא בין שני האמצעיים'}. המספרים: ${nums.join(', ')}.` };
    },
    (r) => { // מסלול מעגלי
      const L = r.pick([400, 600, 800, 1200]), v1 = r.pick([150, 200, 250]), v2 = r.pick([50, 100, 150]);
      const same = r.chance(0.5);
      const ans = same ? L / (v1 - v2) : L / (v1 + v2);
      if (v1 === v2 || !Number.isInteger(ans)) return ARITH[11](r);
      const alt = same ? L / (v1 + v2) : L / (v1 - v2);
      return { text: `שני רצים יוצאים יחד מאותה נקודה על מסלול מעגלי באורך ${L} מטר, ${same ? 'באותו כיוון' : 'בכיוונים הפוכים'}. מהירות אחד ${v1} מטר לדקה ושל השני ${v2} מטר לדקה. אחרי כמה דקות ייפגשו לראשונה?`, ans, d: [alt, L / v1, L / v2, ans * 2].map((x) => Math.round(x * 10) / 10), ex: same ? `באותו כיוון, המהיר צריך "להקיף" את האיטי — לסגור ${L} מטר בהפרש מהירויות ${v1 - v2}: ${L}/${v1 - v2} = ${ans}.` : `בכיוונים הפוכים המהירויות מתחברות: ${L}/${v1 + v2} = ${ans}.` };
    },
    (r) => { // רכבת חוצה רציף
      const v = r.pick([10, 15, 20, 25]), Lt = r.pick([100, 150, 200]), Lp = r.pick([200, 250, 300, 350]);
      const ans = (Lt + Lp) / v;
      if (!Number.isInteger(ans)) return ARITH[12](r);
      return { text: `רכבת באורך ${Lt} מטר נוסעת במהירות ${v} מטר לשנייה. כמה שניות עוברות מהרגע שהקטר נכנס לרציף שאורכו ${Lp} מטר ועד שהקרון האחרון יוצא ממנו?`, ans, d: [Lp / v, Lt / v, (Lp - Lt) / v, ans + 5].filter((x) => x > 0).map((x) => Math.round(x * 10) / 10), ex: `הרכבת צריכה לעבור את אורך הרציף ועוד את האורך שלה: ${Lp}+${Lt} = ${Lt + Lp} מטר. ${Lt + Lp}/${v} = ${ans} שניות.` };
    },
    (r) => { // ממוצע משוקלל
      const n1 = r.pick([10, 20, 30]), n2 = r.pick([10, 20, 30, 40]), a1 = r.int(14, 18) * 5, a2 = r.int(12, 18) * 5;
      const ans = (n1 * a1 + n2 * a2) / (n1 + n2);
      if (!Number.isInteger(ans) || n1 === n2 || a1 === a2) return ARITH[13](r);
      return { text: `בכיתה א׳ ${n1} תלמידים, והממוצע שלהם במבחן ${a1}. בכיתה ב׳ ${n2} תלמידים, והממוצע שלהם ${a2}. מה הממוצע של כל התלמידים יחד?`, ans, d: [(a1 + a2) / 2, ans + 1, ans - 2, Math.max(a1, a2) - 1].map((x) => Math.round(x * 10) / 10), ex: `סכום הציונים: ${n1}×${a1} + ${n2}×${a2} = ${n1 * a1 + n2 * a2}. חלקי ${n1 + n2} תלמידים = ${ans}. זה לא הממוצע הפשוט (${(a1 + a2) / 2}) כי בכיתות יש מספר שונה של תלמידים.` };
    },
    (r) => { // הנחה כפולה מול הנחה אחת
      const p = r.pick([20, 30, 40, 50]), q = r.pick([10, 20, 25, 50]);
      const price = r.pick([200, 400, 800, 1000]);
      const ans = price * (1 - p / 100) * (1 - q / 100);
      if (!Number.isInteger(ans)) return ARITH[14](r);
      return { text: `מחיר מעיל ${price} ש״ח. בסוף העונה ניתנה הנחה של ${p}%, ובקופה עוד ${q}% הנחה על המחיר המוזל. כמה שולמו בסוף?`, ans, d: [price * (1 - (p + q) / 100), price * (1 - p / 100), price * (p + q) / 100, ans + 20], ex: `אחרי ${p}%: ${price * (1 - p / 100)}. עוד ${q}% מהמחיר המוזל (לא מהמקורי): ${ans}. זה יותר מהנחה של ${p + q}% (${price * (1 - (p + q) / 100)}).` };
    },
  ];

  function arithmetic(r, idx) {
    const q = ARITH[idx](r);
    const { options, answer } = uniqNum(r, q.ans, q.d.filter((x) => x > 0 || q.fmt), q.fmt);
    return { kind: 'text', prompt: q.text, options, answer, explain: q.ex };
  }

  // ============================== צורות ==============================
  const K = (c) => JSON.stringify(c);
  const sortU = (a) => [...new Set(a)].sort((x, y) => x - y);
  const FIG = {
    // חיבור קווים — 3 קווים בכל תא
    union(r) {
      const cells = [];
      for (let row = 0; row < 3; row++) {
        const a = sortU(r.sample([0, 1, 2, 3, 4, 5, 6, 7], 3)), b = sortU(r.sample([0, 1, 2, 3, 4, 5, 6, 7], 3));
        cells.push({ t: 'spokes', s: a }, { t: 'spokes', s: b }, { t: 'spokes', s: sortU([...a, ...b]) });
      }
      const [a, b, c] = [cells[6].s, cells[7].s, cells[8].s];
      const xor = sortU([...a, ...b].filter((x) => !(a.includes(x) && b.includes(x))));
      const wrong = [xor, c.slice(1), sortU([...c, ...[0, 1, 2, 3, 4, 5, 6, 7].filter((x) => !c.includes(x)).slice(0, 1)]), sortU(c.map((x) => (x + 1) % 8)), a.filter((x) => b.includes(x))]
        .filter((s) => s.length).map((s) => ({ t: 'spokes', s }));
      return { cells, correct: cells[8], wrong, explain: 'התא השלישי בכל שורה מחבר את כל הקווים של שני התאים הראשונים (קו שמופיע בשניהם מצויר פעם אחת).' };
    },
    // ביטול על רשת 3×3
    grid(r) {
      const cells = [];
      for (let row = 0; row < 3; row++) {
        const a = sortU(r.sample([0, 1, 2, 3, 4, 5, 6, 7, 8], r.int(3, 4)));
        const b = sortU(r.sample([0, 1, 2, 3, 4, 5, 6, 7, 8], r.int(3, 4)));
        const c = sortU([...a, ...b].filter((x) => !(a.includes(x) && b.includes(x))));
        if (!c.length) return FIG.grid(r);
        cells.push({ t: 'grid', s: a }, { t: 'grid', s: b }, { t: 'grid', s: c });
      }
      const [a, b, c] = [cells[6].s, cells[7].s, cells[8].s];
      const uni = sortU([...a, ...b]);
      const inter = a.filter((x) => b.includes(x));
      const flip = (s, k) => sortU(s.includes(k) ? s.filter((x) => x !== k) : [...s, k]);
      const wrong = [uni, inter.length ? inter : flip(c, 4), flip(c, c[0] === 0 ? 1 : 0), flip(c, 8), sortU(c.map((x) => 8 - x))]
        .map((s) => ({ t: 'grid', s }));
      return { cells, correct: cells[8], wrong, explain: 'משבצת שמושחרת בשני התאים הראשונים — נמחקת. משבצת שמושחרת רק באחד מהם — נשארת (ביטול).' };
    },
    // שני מחוגים שמסתובבים בקצב שונה
    hands(r) {
      const s1 = r.pick([1, 2, 3]), s2 = r.pick([-1, -2, 2]) ;
      if (s1 === s2) return FIG.hands(r);
      const cells = [];
      for (let row = 0; row < 3; row++) {
        const a0 = r.int(0, 7), b0 = r.int(0, 7);
        for (let col = 0; col < 3; col++) cells.push({ t: 'hands', a: (((a0 + s1 * col) % 8) + 8) % 8, b: (((b0 + s2 * col) % 8) + 8) % 8 });
      }
      const c = cells[8];
      const m = (x) => ((x % 8) + 8) % 8;
      const wrong = [{ t: 'hands', a: c.b, b: c.a }, { t: 'hands', a: m(c.a + 1), b: c.b }, { t: 'hands', a: c.a, b: m(c.b + s2) }, { t: 'hands', a: m(c.a - s1), b: c.b }, { t: 'hands', a: m(c.a + 4), b: m(c.b + 4) }]
        .filter((x) => x.a !== x.b || true);
      const dir = (s) => `${Math.abs(s) * 45}° ${s > 0 ? 'עם כיוון השעון' : 'נגד כיוון השעון'}`;
      return { cells, correct: c, wrong, explain: `המחוג הארוך (עם הנקודה) מסתובב ${dir(s1)} בכל תא, והמחוג הקצר ${dir(s2)}.` };
    },
    // ריבוע לטיני של צורה × כמות × מילוי
    latin(r) {
      const shapes = r.shuffle(['circle', 'square', 'tri']);
      const counts = r.shuffle([1, 2, 3]);
      const fills = r.shuffle(['none', 'full', 'half']);
      const cells = [];
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          cells.push({ t: 'multi', k: shapes[(row + col) % 3], n: counts[(row * 2 + col) % 3], f: fills[(row + 2 * col) % 3] });
        }
      }
      const c = cells[8];
      const other = (arr, v) => arr.find((x) => x !== v);
      const wrong = [{ ...c, n: other(counts, c.n) }, { ...c, f: other(fills, c.f) }, { ...c, k: other(shapes, c.k) }, { ...c, k: other(shapes, c.k), n: other(counts, c.n) }, cells[7], cells[5]];
      return { cells, correct: c, wrong, explain: 'שלושה חוקים יחד: בכל שורה ובכל עמודה כל צורה מופיעה פעם אחת, כל כמות (1, 2, 3) פעם אחת, וכל סוג מילוי פעם אחת.' };
    },
    // שני סמנים שנעים על שפת ריבוע
    move(r) {
      const s1 = r.pick([1, 2, 3]), s2 = r.pick([-1, -2, -3, 2]);
      if (s1 === s2) return FIG.move(r);
      const m = (x) => ((x % 8) + 8) % 8;
      const cells = [];
      for (let row = 0; row < 3; row++) {
        const a0 = r.int(0, 7);
        let b0 = r.int(0, 7);
        for (let col = 0; col < 3; col++) {
          const a = m(a0 + s1 * col), b = m(b0 + s2 * col);
          if (a === b) return FIG.move(r);
          cells.push({ t: 'move', a, b });
        }
      }
      const c = cells[8];
      const wrong = [{ t: 'move', a: c.b, b: c.a }, { t: 'move', a: m(c.a + 1), b: c.b }, { t: 'move', a: c.a, b: m(c.b - s2) }, { t: 'move', a: m(c.a + s1), b: m(c.b + s2) }, { t: 'move', a: m(c.a - 1), b: m(c.b + 1) }]
        .filter((x) => x.a !== x.b);
      const dir = (s) => `${Math.abs(s)} ${Math.abs(s) === 1 ? 'משבצת' : 'משבצות'} ${s > 0 ? 'עם כיוון השעון' : 'נגד כיוון השעון'}`;
      return { cells, correct: c, wrong, explain: `העיגול השחור זז ${dir(s1)} בכל תא, והעיגול הריק זז ${dir(s2)}.` };
    },
  };

  function figures(r, rule) {
    const q = FIG[rule](r);
    const { options, answer } = withDistractors(r, q.correct, q.wrong, K);
    if (options.length < 4) return figures(r, rule);
    return { kind: 'figures', prompt: 'איזה תא משלים את המטריצה?', matrix: q.cells.slice(0, 8), options, answer, explain: q.explain };
  }

  // ============================== היגיון ==============================
  const PEOPLE = ['אבי', 'בתיה', 'גיל', 'דנה', 'הדר', 'ורד', 'זיו'];
  const FEM = new Set(['בתיה', 'דנה', 'הדר', 'ורד']);
  const stands = (n) => (FEM.has(n) ? 'עומדת' : 'עומד');
  const perms = (arr) => (arr.length <= 1 ? [arr] : arr.flatMap((x, i) => perms([...arr.slice(0, i), ...arr.slice(i + 1)]).map((p) => [x, ...p])));

  function order(r) {
    const n = 6;
    const names = r.sample(PEOPLE, n);
    const sol = r.shuffle(names);
    const pos = (arr, x) => arr.indexOf(x);
    const makers = [
      () => { const [a, b] = r.sample(names, 2); return pos(sol, a) < pos(sol, b) ? { t: `${a} ${stands(a)} לפני ${b} (לא בהכרח מיד).`, f: (p) => pos(p, a) < pos(p, b) } : null; },
      () => { const [a, b] = r.sample(names, 2); const d = pos(sol, b) - pos(sol, a); return d >= 2 ? { t: `בין ${a} ל${b} ${d - 1 === 1 ? 'עומד אדם אחד' : `עומדים ${d - 1} אנשים`}, ו${a} לפני ${b}.`, f: (p) => pos(p, b) - pos(p, a) === d } : null; },
      () => { const [a, b] = r.sample(names, 2); return Math.abs(pos(sol, a) - pos(sol, b)) > 1 ? { t: `${a} ו${b} לא עומדים זה ליד זה.`, f: (p) => Math.abs(pos(p, a) - pos(p, b)) > 1 } : null; },
      () => { const a = r.pick(names); const i = pos(sol, a); return i > 0 && i < n - 1 ? { t: `${a} לא בקצוות השורה.`, f: (p) => pos(p, a) > 0 && pos(p, a) < n - 1 } : null; },
      () => { const a = r.pick(names); const i = pos(sol, a); return { t: `${a} ${stands(a)} במקום ${i % 2 === 0 ? 'אי־זוגי' : 'זוגי'}.`, f: (p) => pos(p, a) % 2 === i % 2 }; },
      () => { const i = r.int(0, n - 2); const [a, b] = [sol[i], sol[i + 1]]; return { t: `${a} ${stands(a)} מיד לפני ${b}.`, f: (p) => pos(p, b) - pos(p, a) === 1 }; },
    ];
    let cand = perms(names);
    const clues = [];
    let guard = 0;
    while (cand.length > 1 && guard++ < 300) {
      const c = r.pick(makers)();
      if (!c || clues.some((x) => x.t === c.t)) continue;
      const next = cand.filter(c.f);
      // רמז שמקטין את מרחב האפשרויות, אבל לא בבת אחת (כדי שיהיה צורך לשלב רמזים)
      if (next.length < cand.length && next.length >= 1 && (clues.length > 3 || next.length > 2)) { clues.push(c); cand = next; }
    }
    if (cand.length !== 1 || clues.length < 5 || clues.length > 7) return order(r);
    const askIdx = r.int(1, n - 2);
    const ord = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי'][askIdx];
    const correct = sol[askIdx];
    const wrong = r.shuffle(names.filter((x) => x !== correct));
    return {
      prompt: `${n} חברים עומדים בשורה (מקום 1 הוא הראשון מימין).\n${clues.map((c) => '• ' + c.t).join('\n')}\nמי עומד במקום ה${ord}?`,
      correct, wrong, explain: `הסידור היחיד שמתאים לכל הרמזים (מימין לשמאל): ${sol.join(', ')}.`,
    };
  }

  function match(r) {
    const names = r.sample(PEOPLE, 4);
    const SPORT = ['ריצה', 'שחייה', 'כדורסל', 'טניס'];
    const COLOR = ['אדום', 'כחול', 'ירוק', 'צהוב'];
    const sp = r.shuffle(SPORT), co = r.shuffle(COLOR); // sp[i], co[i] של names[i]
    const P = perms([0, 1, 2, 3]);
    let cand = [];
    for (const a of P) for (const b of P) cand.push([a, b]); // a[i]=אינדקס ספורט של names[i], b[i]=צבע
    const S = (c, i) => SPORT[c[0][i]], C = (c, i) => COLOR[c[1][i]];
    const solIdx = [names.map((_, i) => SPORT.indexOf(sp[i])), names.map((_, i) => COLOR.indexOf(co[i]))];
    const makers = [
      () => { const i = r.int(0, 3); const v = r.pick(SPORT.filter((x) => x !== sp[i])); return { t: `הספורט של ${names[i]} אינו ${v}.`, f: (c) => S(c, i) !== v }; },
      () => { const i = r.int(0, 3); const v = r.pick(COLOR.filter((x) => x !== co[i])); return { t: `הצבע של ${names[i]} אינו ${v}.`, f: (c) => C(c, i) !== v }; },
      () => { const i = r.int(0, 3); return { t: `מי שהספורט שלו ${sp[i]} — הצבע שלו ${co[i]}.`, f: (c) => { const k = c[0].indexOf(SPORT.indexOf(sp[i])); return COLOR[c[1][k]] === co[i]; } }; },
      () => { const i = r.int(0, 3); const v = r.pick(COLOR.filter((x) => x !== co[i])); return { t: `מי שהספורט שלו ${sp[i]} — הצבע שלו אינו ${v}.`, f: (c) => { const k = c[0].indexOf(SPORT.indexOf(sp[i])); return COLOR[c[1][k]] !== v; } }; },
      () => { if (clues.some((x) => x.direct)) return null; const i = r.int(0, 3); return { t: `הצבע של ${names[i]} הוא ${co[i]}.`, f: (c) => C(c, i) === co[i], direct: true }; },
      () => { const i = r.int(0, 3); const v = r.pick(SPORT.filter((x) => x !== sp[i])); return { t: `מי שהצבע שלו ${co[i]} — הספורט שלו אינו ${v}.`, f: (c) => { const k = c[1].indexOf(COLOR.indexOf(co[i])); return SPORT[c[0][k]] !== v; } }; },
      () => { const [i, j] = r.sample([0, 1, 2, 3], 2); const v = r.pick(COLOR.filter((x) => x !== co[i] && x !== co[j])); return { t: `הצבע של ${names[i]} ושל ${names[j]} אינו ${v}.`, f: (c) => C(c, i) !== v && C(c, j) !== v }; },
    ];
    const clues = [];
    let guard = 0;
    while (cand.length > 1 && guard++ < 400) {
      const c = r.pick(makers)();
      if (!c || clues.some((x) => x.t === c.t)) continue;
      const next = cand.filter(c.f);
      if (next.length < cand.length && next.length >= 1) { clues.push(c); cand = next; }
    }
    if (cand.length !== 1 || clues.length > 10) return match(r);
    // שואלים: מה הספורט של מי שהצבע שלו X — ולא משהו שנאמר ישירות ברמז
    const k = r.int(0, 3);
    const color = co[k], ans = sp[k];
    if (clues.some((c) => c.t.includes(`${ans} — הצבע שלו ${color}`))) return match(r);
    void solIdx;
    return {
      prompt: `לכל אחד מהחברים — ${names.slice(0, 3).join(', ')} ו${names[3]} — יש ספורט אהוב שונה (${SPORT.join(', ')}) וצבע אהוב שונה (${COLOR.join(', ')}).\n${clues.map((c) => '• ' + c.t).join('\n')}\nמה הספורט של מי שהצבע האהוב שלו ${color}?`,
      correct: ans, wrong: r.shuffle(SPORT.filter((x) => x !== ans)),
      explain: names.map((nm, i) => `${nm}: ${sp[i]}, ${co[i]}`).join(' · ') + '. רק השיבוץ הזה מתאים לכל הרמזים.',
    };
  }

  const MUST = [
    { p: ['אף מורה אינו צעיר מגיל 25.', 'חלק מהמאמנים הם מורים.'], c: 'חלק מהמאמנים אינם צעירים מגיל 25', o: ['כל המאמנים בני 25 ומעלה', 'חלק מהמורים אינם מאמנים', 'אף מאמן אינו צעיר מגיל 25'], ex: 'המאמנים שהם מורים — אינם צעירים מ־25. על שאר המאמנים אין מידע, ולגבי המורים אין מידע אם כולם מאמנים.' },
    { p: ['אם רוני מגיע — גם שקד מגיע.', 'אם שקד מגיע — תום לא מגיע.', 'תום הגיע.'], c: 'רוני לא הגיע', o: ['שקד הגיע', 'רוני הגיע', 'אי אפשר לדעת אם רוני הגיע'], ex: 'תום הגיע, לכן שקד לא הגיע (אחרת תום לא היה מגיע). שקד לא הגיע, לכן רוני לא הגיע (אחרת שקד היה מגיע).' },
    { p: ['כל מי שעבר את הגיבוש — עבר את המבחן.', 'חלק ממי שעבר את המבחן לא התקבל.'], c: 'אי אפשר לדעת אם יש מי שעבר את הגיבוש ולא התקבל', o: ['חלק ממי שעבר את הגיבוש לא התקבל', 'כל מי שעבר את הגיבוש התקבל', 'כל מי שעבר את המבחן עבר את הגיבוש'], ex: 'מי שלא התקבלו יכולים להיות כולם מאלה שעברו את המבחן אבל לא את הגיבוש — או לא. אין מספיק מידע.' },
    { p: ['אף שחקן בקבוצה לא איחר לאימון.', 'כל מי שלא איחר לאימון קיבל פרס.', 'יואב לא קיבל פרס.'], c: 'יואב אינו שחקן בקבוצה', o: ['יואב לא איחר לאימון', 'יואב שחקן שאיחר לאימון', 'אי אפשר לדעת אם יואב שחקן'], ex: 'יואב לא קיבל פרס, ולכן הוא איחר (מי שלא איחר קיבל פרס). אף שחקן לא איחר — לכן יואב אינו שחקן.' },
    { p: ['שירה גבוהה מתמר ונמוכה מנועה.', 'מיכל נמוכה מתמר.'], c: 'נועה גבוהה ממיכל', o: ['שירה הנמוכה מכולן', 'תמר גבוהה מנועה', 'מיכל גבוהה משירה'], ex: 'הסדר מהגבוהה: נועה, שירה, תמר, מיכל. לכן נועה גבוהה ממיכל.' },
    { p: ['בכל יום גשום נועה לוקחת מטרייה.', 'ביום רביעי נועה לא לקחה מטרייה.', 'ביום חמישי נועה לקחה מטרייה.'], c: 'ביום רביעי לא ירד גשם', o: ['ביום חמישי ירד גשם', 'ביום חמישי לא ירד גשם', 'נועה לוקחת מטרייה רק בימים גשומים'], ex: 'אילו ירד גשם ביום רביעי — נועה הייתה לוקחת מטרייה. על יום חמישי אי אפשר לדעת: היא יכולה לקחת מטרייה גם בלי גשם.' },
    { p: ['כל הספרים במדף העליון כתובים בעברית.', 'כל הספרים בעברית קצרים מ־200 עמודים.', 'בספר "מסע" יש 250 עמודים.'], c: '"מסע" אינו כתוב בעברית', o: ['"מסע" נמצא במדף התחתון', 'חלק מהספרים בעברית ארוכים מ־200 עמודים', 'כל הספרים הקצרים כתובים בעברית'], ex: '"מסע" ארוך מ־200 עמודים, ולכן אינו בעברית (וגם לא במדף העליון). אבל לא נאמר שיש רק שני מדפים.' },
    { p: ['רק מי שיש לו רישיון מתאים רשאי לנהוג במשאית.', 'לאלון יש רישיון מתאים.'], c: 'אי אפשר לדעת אם אלון נוהג במשאית', o: ['אלון נוהג במשאית', 'אלון אינו רשאי לנהוג במשאית', 'כל מי שנוהג ברכב פרטי רשאי לנהוג במשאית'], ex: '"רק מי שיש לו רישיון" אומר שבלי רישיון אסור — אבל לא שכל מי שיש לו רישיון נוהג בפועל.' },
  ];

  function must(r, i) {
    const m = MUST[i];
    return { prompt: `${m.p.join('\n')}\nאיזו טענה בהכרח נכונה?`, correct: m.c, wrong: r.shuffle(m.o), explain: m.ex };
  }

  function logic(r, kind, i) {
    const q = kind === 'order' ? order(r) : kind === 'match' ? match(r) : must(r, i);
    const { options, answer } = withDistractors(r, q.correct, q.wrong, String);
    return { kind: 'text', prompt: q.prompt, options, answer, explain: q.explain };
  }

  // ============================== טכנית ==============================
  function gearsIdler(r) {
    const a = r.pick([12, 16, 18, 24, 30, 36, 40, 48]), b = r.pick([10, 14, 20, 25]), c = r.pick([8, 9, 12, 15, 20, 60]);
    const k = r.pick([2, 3, 4, 5, 6, 10]);
    const ans = (a * k) / c;
    if (!Number.isInteger(ans) || a === c || ans === k) return gearsIdler(r);
    return {
      diagram: { type: 'gears', teeth: [a, b, c], labels: ['א׳', 'ב׳', 'ג׳'] },
      prompt: `שלושה גלגלי שיניים משולבים בשורה: לגלגל א׳ יש ${a} שיניים, לגלגל ב׳ (באמצע) ${b} שיניים, ולגלגל ג׳ ${c} שיניים. גלגל א׳ השלים ${k} סיבובים. כמה סיבובים השלים גלגל ג׳?`,
      correct: String(ans), wrong: [String(Math.round((a * k) / b * 10) / 10), String(Math.round((c * k) / a * 10) / 10), String(k), String(Math.round((b * k) / c * 10) / 10)],
      explain: `הגלגל האמצעי לא משנה את היחס — רק את הכיוון. בכל גלגל עוברות ${a}×${k} = ${a * k} שיניים, ולכן ג׳ מסתובב ${a * k}/${c} = ${ans} פעמים.`,
    };
  }
  function gearsDir(r) {
    const n = r.int(5, 7);
    const teeth = Array.from({ length: n }, () => r.pick([10, 14, 18, 22]));
    const first = r.pick(['cw', 'ccw']);
    const askI = r.int(2, n - 1);
    const name = { cw: 'עם כיוון השעון', ccw: 'נגד כיוון השעון' };
    const ans = askI % 2 === 0 ? first : first === 'cw' ? 'ccw' : 'cw';
    const heb = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ז׳'];
    return {
      diagram: { type: 'gears', teeth, labels: heb.slice(0, n), first },
      prompt: `${n} גלגלי שיניים משולבים בשורה, מ־א׳ (מימין) עד ${heb[n - 1]}. גלגל א׳ מסתובב ${name[first]}. לאיזה כיוון מסתובב גלגל ${heb[askI]}?`,
      correct: name[ans], wrong: [name[ans === 'cw' ? 'ccw' : 'cw'], 'הוא לא מסתובב', 'תלוי במספר השיניים'],
      explain: `כל שני גלגלים משולבים מסתובבים בכיוונים הפוכים, והכיוון מתחלף בכל גלגל. גלגל ${heb[askI]} הוא במקום ה־${askI + 1}: ${askI % 2 === 0 ? 'אי־זוגי, כמו א׳' : 'זוגי, הפוך מ־א׳'}.`,
    };
  }
  function gearsRpm(r) {
    const a = r.pick([20, 30, 40, 60]), b = r.pick([12, 15, 24, 80]), rpm = r.pick([30, 45, 60, 90, 120]);
    const ans = (a * rpm) / b;
    if (!Number.isInteger(ans) || a === b) return gearsRpm(r);
    return {
      diagram: { type: 'gears', teeth: [a, b], labels: ['א׳', 'ב׳'] },
      prompt: `גלגל א׳ (${a} שיניים) מסתובב ${rpm} סיבובים בדקה, ומשולב בגלגל ב׳ (${b} שיניים). כמה סיבובים בדקה מסתובב גלגל ב׳?`,
      correct: String(ans), wrong: [String((b * rpm) / a), String(rpm), String(ans * 2)],
      explain: `מספר השיניים שעוברות בדקה זהה: ${a}×${rpm} = ${a * rpm}. גלגל ב׳: ${a * rpm}/${b} = ${ans} סיבובים בדקה.`,
    };
  }
  function lever2(r) {
    const w1 = r.pick([10, 20, 30, 40]), d1 = r.int(1, 2), w2 = r.pick([10, 20, 30]), d2 = r.int(3, 4), d3 = r.pick([2, 3, 4, 5]);
    const m = w1 * d1 + w2 * d2, ans = m / d3;
    if (!Number.isInteger(ans)) return lever2(r);
    return {
      diagram: { type: 'lever2', right: [[w1, d1], [w2, d2]], left: d3 },
      prompt: `על מוט, בצד ימין של נקודת המשען, מונחים ${w1} ק״ג במרחק ${d1} מ׳ ו־${w2} ק״ג במרחק ${d2} מ׳. איזה משקל צריך לשים בצד שמאל, במרחק ${d3} מ׳, כדי שהמוט יהיה מאוזן?`,
      correct: `${ans} ק״ג`, wrong: [`${w1 + w2} ק״ג`, `${Math.round(((w1 + w2) * Math.max(d1, d2)) / d3 * 10) / 10} ק״ג`, `${ans + 10} ק״ג`, `${Math.round(((w1 + w2) / d3) * 10) / 10} ק״ג`],
      explain: `סכום המומנטים בצד ימין: ${w1}×${d1} + ${w2}×${d2} = ${m}. בצד שמאל: x×${d3} = ${m}, ולכן x = ${ans} ק״ג.`,
    };
  }
  function pulleyForce(r) {
    const n = r.pick([2, 3, 4, 6]), w = r.pick([120, 180, 240, 360]);
    const ans = w / n;
    if (!Number.isInteger(ans)) return pulleyForce(r);
    return {
      diagram: { type: 'pulley', n, w },
      prompt: `במערכת גלגלות ${n} חבלים מחזיקים משא של ${w} ק״ג. מה הכוח הדרוש כדי להרים את המשא (בלי חיכוך, הגלגלות חסרות משקל)?`,
      correct: `${ans} ק״ג`, wrong: [`${w} ק״ג`, `${w / 2} ק״ג`, `${Math.round(w / (n + 1))} ק״ג`, `${w * n} ק״ג`],
      explain: `המשקל מתחלק שווה בין ${n} החבלים: ${w}/${n} = ${ans} ק״ג.`,
    };
  }
  function pulleyRope(r) {
    const n = r.pick([2, 3, 4]), h = r.pick([2, 3, 5]), w = r.pick([120, 240]);
    return {
      diagram: { type: 'pulley', n, w },
      prompt: `במערכת גלגלות שבה ${n} חבלים מחזיקים את המשא, רוצים להרים את המשא לגובה ${h} מטרים. כמה מטרים של חבל צריך למשוך?`,
      correct: `${n * h} מ׳`, wrong: [`${h} מ׳`, `${Math.round((h / n) * 10) / 10} מ׳`, `${(n + 1) * h} מ׳`, `${2 * h} מ׳`],
      explain: `כל אחד מ־${n} החבלים צריך להתקצר ב־${h} מ׳, ולכן מושכים ${n}×${h} = ${n * h} מ׳. מה שחוסכים בכוח משלמים במרחק.`,
    };
  }

  function technical(r, kind, ref) {
    let q;
    if (kind === 'idler') q = gearsIdler(r);
    else if (kind === 'dir') q = gearsDir(r);
    else if (kind === 'rpm') q = gearsRpm(r);
    else if (kind === 'lever2') q = lever2(r);
    else if (kind === 'force') q = pulleyForce(r);
    else if (kind === 'rope') q = pulleyRope(r);
    else { const c = TECH_CONCEPTS.find((x) => x.id === ref); q = { prompt: c.q, correct: c.correct, wrong: c.wrong, explain: c.explain }; }
    const { options, answer } = withDistractors(r, q.correct, q.wrong, String);
    return { kind: q.diagram ? 'tech' : 'text', diagram: q.diagram, prompt: q.prompt, options, answer, explain: q.explain };
  }

  // ============================== תרשימים ==============================
  const CH = [
    { title: 'מכירות של שתי חנויות (ביחידות)', labels: ['ינו׳', 'פבר׳', 'מרץ', 'אפר׳', 'מאי'], series: ['חנות א׳', 'חנות ב׳'] },
    { title: 'מספר מתגייסים לשתי יחידות', labels: ['2021', '2022', '2023', '2024', '2025'], series: ['יחידה א׳', 'יחידה ב׳'] },
    { title: 'כמות גשם בשתי ערים (מ״מ)', labels: ['אוק׳', 'נוב׳', 'דצמ׳', 'ינו׳', 'פבר׳', 'מרץ'], series: ['חיפה', 'באר שבע'] },
    { title: 'ייצור בשני מפעלים (בטונות)', labels: ['רבעון 1', 'רבעון 2', 'רבעון 3', 'רבעון 4'], series: ['מפעל א׳', 'מפעל ב׳'] },
    { title: 'מבקרים בשני מוזיאונים (באלפים)', labels: ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳'], series: ['מוזיאון א׳', 'מוזיאון ב׳'] },
  ];
  function chart(r, t) {
    const set = r.pick(CH);
    const step = r.pick([10, 20]);
    const A = set.labels.map(() => step * r.int(2, 9));
    const B = set.labels.map(() => step * r.int(2, 9));
    const L = set.labels, n = L.length;
    const ch = { type: 'bars2', title: set.title, labels: L, series: set.series, values: [A, B], step };
    const sA = A.reduce((a, b) => a + b, 0), sB = B.reduce((a, b) => a + b, 0);
    let text, ans, d, ex, fmt = String, opts;
    if (t === 0) { // אחוז שינוי בסדרה
      const i = r.int(0, n - 2), j = r.int(i + 1, n - 1);
      const p = r.pick([25, 50, 75, -25, -50, 150, 20, -20, -40, 60]);
      const base = A[i];
      const target = base * (1 + p / 100);
      if (!Number.isInteger(target / step) || target <= 0 || target > step * 12) return chart(r, t);
      A[j] = target;
      ans = p; fmt = (x) => `${x}%`;
      text = `בכמה אחוזים השתנה הערך של ${set.series[0]} מ־${L[i]} ל־${L[j]}? (שלילי = ירידה)`;
      const wrongBase = Math.round(((target - base) / target) * 100);
      d = [wrongBase, -p, target - base, p + 10].filter((x) => x !== p);
      ex = `${set.series[0]}: ${L[i]} = ${base}, ${L[j]} = ${target}. השינוי ${target - base} מחולק בערך ההתחלתי ${base}: ${p}%.`;
    } else if (t === 1) { // באיזו תקופה הפער הגדול ביותר
      const gaps = A.map((v, i) => Math.abs(v - B[i]));
      const mx = Math.max(...gaps);
      if (gaps.filter((g) => g === mx).length !== 1) return chart(r, t);
      const k = gaps.indexOf(mx);
      text = `באיזו תקופה ההפרש בין ${set.series[0]} ל${set.series[1]} הוא הגדול ביותר?`;
      const maxA = A.indexOf(Math.max(...A)), maxB = B.indexOf(Math.max(...B));
      opts = { correct: L[k], wrong: r.shuffle([...new Set([L[maxA], L[maxB], ...L])].filter((x) => x !== L[k])) };
      ex = `ההפרשים: ${L.map((l, i) => `${l} ${gaps[i]}`).join(', ')}. הגדול: ${L[k]} (${mx}).`;
    } else if (t === 2) { // הפרש סכומים
      ans = Math.abs(sA - sB);
      if (ans === 0) return chart(r, t);
      text = `בכמה גדול הסכום הכולל של ${sA > sB ? set.series[0] : set.series[1]} מהסכום הכולל של ${sA > sB ? set.series[1] : set.series[0]}?`;
      d = [ans + step, ans - step, Math.abs(Math.max(...A) - Math.max(...B)), ans + 2 * step].filter((x) => x > 0);
      ex = `${set.series[0]}: ${A.join('+')} = ${sA}. ${set.series[1]}: ${B.join('+')} = ${sB}. הפרש: ${ans}.`;
    } else if (t === 3) { // ממוצע של שתי הסדרות יחד
      const tot2 = sA + sB;
      if (tot2 % (2 * n) !== 0) return chart(r, t);
      ans = tot2 / (2 * n);
      text = `מה הממוצע של כל ${2 * n} העמודות בתרשים?`;
      d = [ans + step / 2, ans - step / 2, Math.round(tot2 / n), ans + step].filter((x) => x > 0);
      ex = `סכום כל העמודות: ${tot2}. חלקי ${2 * n} עמודות = ${ans}.`;
    } else { // איזה אחוז מהסכום
      const k = r.int(0, n - 1);
      const sum = A.reduce((a, b) => a + b, 0);
      const pct = (A[k] / sum) * 100;
      if (!Number.isInteger(pct)) {
        // מתאימים ערך אחד כך שהאחוז יהיה שלם
        for (let tries = 0; tries < 40; tries++) {
          const j = r.int(0, n - 1); if (j === k) continue;
          A[j] = step * r.int(2, 9);
          const s2 = A.reduce((a, b) => a + b, 0);
          if (Number.isInteger((A[k] / s2) * 100)) break;
        }
      }
      const s3 = A.reduce((a, b) => a + b, 0);
      ans = (A[k] / s3) * 100;
      if (!Number.isInteger(ans)) return chart(r, t);
      fmt = (x) => `${x}%`;
      text = `איזה אחוז מהסכום הכולל של ${set.series[0]} מהווה ${L[k]}?`;
      d = [Math.round((A[k] / (s3 + B.reduce((a, b) => a + b, 0))) * 100), Math.round(100 / n), ans + 5, ans * 2].filter((x) => x !== ans && x > 0);
      ex = `${set.series[0]} בסך הכול: ${s3}. ${L[k]}: ${A[k]}. ${A[k]}/${s3} = ${ans}%.`;
    }
    ch.values = [A, B];
    if (opts) {
      const { options, answer } = withDistractors(r, opts.correct, opts.wrong, String);
      return { kind: 'chart', chart: ch, prompt: text, options, answer, explain: ex };
    }
    const { options, answer } = uniqNum(r, ans, d, fmt);
    return { kind: 'chart', chart: ch, prompt: text, options, answer, explain: ex };
  }

  // ============================== מילים ואנלוגיות ==============================
  function vocab(r, word, reverse) {
    const pool = WORDS.filter((x) => x.tier === word.tier && x.id !== word.id && x.m !== word.m);
    const others = r.shuffle(pool);
    if (reverse) {
      const { options, answer } = withDistractors(r, word.w, others.map((x) => x.w), String);
      return { kind: 'text', prompt: `איזו מילה פירושה "${word.m}"?`, options, answer, explain: `${word.w} — ${word.m}. ${word.s}` };
    }
    const { options, answer } = withDistractors(r, word.m, others.map((x) => x.m), String);
    return { kind: 'word', prompt: 'מה פירוש המילה או הביטוי?', word: word.w, options, answer, explain: `${word.w} — ${word.m}. ${word.s}` };
  }
  function analogy(r, a) {
    const fmt = (p) => p.split(':').join(' : ');
    const { options, answer } = withDistractors(r, a.correct, a.wrong, String);
    return { kind: 'analogy', prompt: 'איזה זוג מילים מקביל לזוג הנתון?', pair: fmt(a.pair), options: options.map(fmt), answer, explain: `הקשר: ${a.relation}. ${fmt(a.pair)} — כמו ${fmt(a.correct)}.` };
  }

  // ============================== הרכבת החוברת ==============================
  return function buildBooklet(seed) {
    const r = makeRng(seed);
    const sections = [];

    const words = [...r.sample(WORDS.filter((w) => w.tier === 'B'), 10), ...r.sample(WORDS.filter((w) => w.tier === 'P'), 5)];
    sections.push({ topic: 'vocab', qs: r.shuffle(words).map((w, i) => vocab(r, w, i % 3 === 2)) });

    // אנלוגיות: 2 מכל סוג (ו־1 מאחד) — בלי חזרה
    const bySub = {};
    ANALOGIES.forEach((a) => { (bySub[a.sub] = bySub[a.sub] || []).push(a); });
    const an = [];
    Object.values(bySub).forEach((list) => an.push(...r.sample(list, 2)));
    sections.push({ topic: 'analogies', qs: r.shuffle(an).slice(0, 15).map((a) => analogy(r, a)) });

    sections.push({ topic: 'series', qs: SERIES.map((_, i) => series(r, i)) });
    sections.push({ topic: 'arithmetic', qs: ARITH.map((_, i) => arithmetic(r, i)) });

    const rules = ['union', 'grid', 'hands', 'latin', 'move'];
    const figs = [];
    for (let k = 0; k < 3; k++) rules.forEach((rule) => figs.push(rule));
    sections.push({ topic: 'figures', qs: figs.map((rule, i) => figures(r, rule)).sort(() => 0) });

    const lg = [];
    for (let i = 0; i < 4; i++) lg.push(logic(r, 'order'));
    for (let i = 0; i < 4; i++) lg.push(logic(r, 'match'));
    for (let i = 0; i < 7; i++) lg.push(logic(r, 'must', i));
    sections.push({ topic: 'logic', qs: [lg[0], lg[8], lg[4], lg[9], lg[1], lg[10], lg[5], lg[11], lg[2], lg[12], lg[6], lg[13], lg[3], lg[14], lg[7]] });

    const concepts = r.sample(TECH_CONCEPTS, 6).map((c) => ['concept', c.id]);
    const tk = [['idler'], ['dir'], ['lever2'], ['force'], ['rpm'], ['idler'], ['lever2'], ['rope'], ['dir'], ['lever2']];
    const techs = [];
    tk.forEach((x, i) => { techs.push(x); if (i % 2 === 1 && concepts.length) techs.push(concepts.shift()); });
    techs.push(...concepts);
    sections.push({ topic: 'technical', qs: techs.slice(0, 15).map(([k, ref]) => technical(r, k, ref)) });

    sections.push({ topic: 'charts', qs: Array.from({ length: 15 }, (_, i) => chart(r, i % 5)) });
    return sections;
  };
}

function gcd(a, b) { return b ? gcd(b, a % b) : Math.abs(a); }
