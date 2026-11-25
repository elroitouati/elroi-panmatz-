// שאלות חשבון — רמה קשה: בעיות של כמה שלבים, בלי מחשבון. המספרים נבחרים כך
// שהתשובה שלמה, והמסיחים הם הטעויות הנפוצות (אחוז מהבסיס הלא נכון, ממוצע פשוט
// של מהירויות, היפוך יחס, שכחת שלב).
import { makeRng, withDistractors } from './rng';

const N = ['דני', 'יואב', 'אורי', 'איתי', 'עידו', 'רון', 'גיל', 'עמית'];
const SUBS = ['fractions', 'percent', 'ratio', 'motion', 'work', 'average'];
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
const frac = (n, d) => { const g = gcd(n, d); return `${n / g}/${d / g}`; };

const T = {
  fractions: [
    (r) => { // שבר מהיתרה — כמה היה בהתחלה
      const [f1, f2] = r.pick([[[1, 3], [1, 4]], [[1, 4], [2, 3]], [[2, 5], [1, 3]], [[1, 2], [1, 3]], [[3, 8], [2, 5]], [[1, 6], [3, 5]]]);
      const nu = (f1[1] - f1[0]) * (f2[1] - f2[0]), de = f1[1] * f2[1];
      const T0 = de * r.pick([2, 3, 4, 5]) * 10;
      const L = (T0 * nu) / de;
      const n = r.pick(N);
      return { text: `${n} הוציא ${f1[0]}/${f1[1]} מהכסף שלו על ספרים, ואחר כך ${f2[0]}/${f2[1]} מהיתרה על אוכל. נשארו לו ${L} ש״ח. כמה כסף היה לו בהתחלה?`, ans: T0,
        d: [Math.round(L / Math.max(0.05, 1 - f1[0] / f1[1] - f2[0] / f2[1])), L * 2, T0 - L, T0 + L / 2], ex: `אחרי הספרים נשאר ${f1[1] - f1[0]}/${f1[1]}, ואחרי האוכל ${f2[1] - f2[0]}/${f2[1]} מזה — כלומר ${frac(nu, de)} מהסכום. ${L} ÷ ${frac(nu, de)} = ${T0}.` };
    },
    (r) => { // חלוקת זמן (בסגנון תיל, עם שלב נוסף)
      const [a, b] = r.pick([[1, 3], [1, 4], [2, 5], [1, 5]]), k = r.pick([3, 4]);
      const nu = b - a, de = b * k;
      const acts = ['קריאה', 'ספורט', 'בישול', 'טיולים'].slice(0, k);
      return { text: `בחופשה החליט אורי לבלות ${a}/${b} מהזמן בשינה, ואת שאר הזמן לחלק שווה בין ${acts.join(', ')}. איזה חלק מכל החופשה הוא הקדיש ל${acts[0]}?`, ans: frac(nu, de),
        d: [frac(1, k), frac(nu, b), frac(1, de), frac(nu, de + 1)], ex: `אחרי השינה נשאר ${nu}/${b}. חלקי ${k} פעילויות: ${nu}/${b} ÷ ${k} = ${frac(nu, de)}.`, str: true };
    },
    (r) => { // העברת עובדים בין קווים (בסגנון תיל, עם שני שלבים)
      const tot = r.pick([600, 900, 1200]), [a, b] = r.pick([[1, 5], [1, 4], [1, 3]]), [c, d] = r.pick([[1, 3], [1, 4], [2, 5]]);
      const p = (tot * a) / b, k = tot - p, moved = (k * c) / d, ans = k - moved + (p * c) / d / 2;
      if (![p, k, moved, ans].every(Number.isInteger)) return T.fractions[0](r);
      return { text: `במפעל ${tot} עובדים: ${a}/${b} מהם בקו פלסטיק והשאר בקו קרטון. ${c}/${d} מעובדי הקרטון עברו לקו חדש, וחצי מ־${c}/${d} מעובדי הפלסטיק עברו לקו הקרטון. כמה עובדים יש עכשיו בקו הקרטון?`, ans,
        d: [k - moved, k, ans + (p * c) / d / 2, k - moved - (p * c) / d / 2], ex: `פלסטיק: ${p}, קרטון: ${k}. עברו מהקרטון ${moved} → נשארו ${k - moved}. מהפלסטיק עברו לקרטון חצי מ־${(p * c) / d} = ${(p * c) / d / 2}. סך הכול: ${ans}.` };
    },
  ],
  percent: [
    (r) => { // עלייה ואז ירידה — שינוי כולל
      const [up, down] = r.pick([[25, 20], [20, 25], [50, 20], [20, 20], [10, 10], [50, 50], [25, 40], [60, 25], [40, 25]]);
      const tot = Math.round(((1 + up / 100) * (1 - down / 100) - 1) * 1000) / 10;
      return { text: `מחיר מוצר עלה ב־${up}% ואחר כך ירד ב־${down}%. בכמה אחוזים השתנה המחיר בסך הכול? (שלילי = ירידה)`, ans: tot, pct: true,
        d: [up - down, 0, -tot, tot - 5, tot + 5], ex: `נניח מחיר 100. אחרי עלייה של ${up}%: ${100 + up}. ירידה של ${down}% מ־${100 + up} (לא מ־100): ${(100 + up) * (1 - down / 100)}. השינוי: ${tot}%.` };
    },
    (r) => { // הנחה כפולה
      const p = r.pick([20, 30, 40, 50]), q = r.pick([10, 20, 25, 50]), price = r.pick([200, 400, 800, 1000]);
      const ans = (price * (100 - p) * (100 - q)) / 10000;
      if (!Number.isInteger(ans)) return T.percent[0](r);
      return { text: `מחיר מעיל ${price} ש״ח. ניתנה הנחה של ${p}%, ובקופה עוד ${q}% הנחה על המחיר המוזל. כמה שולם בסוף?`, ans,
        d: [(price * (100 - p - q)) / 100, (price * (100 - p)) / 100, (price * (p + q)) / 100, ans + 20], ex: `אחרי ${p}%: ${(price * (100 - p)) / 100}. עוד ${q}% מהמחיר המוזל: ${ans}. זה יותר מהנחה של ${p + q}% (${(price * (100 - p - q)) / 100}).` };
    },
    (r) => { // מיהול
      const [m, p, q, ans] = r.pick([[200, 10, 8, 50], [300, 12, 9, 100], [400, 15, 10, 200], [500, 20, 16, 125], [240, 25, 20, 60], [600, 10, 6, 400]]);
      return { text: `בכלי ${m} גרם תמיסה שבה ${p}% מלח. כמה גרם מים צריך להוסיף כדי שריכוז המלח יהיה ${q}%?`, ans,
        d: [(m * (p - q)) / 100, (m * p) / q, ans * 2, ans / 2], ex: `מלח: ${(m * p) / 100} גרם, והוא לא משתנה. כדי שזה יהיה ${q}% — המשקל הכולל ${(m * p) / q}. מוסיפים ${ans} גרם מים.` };
    },
    (r) => { // אחוז מקבוצה — כמה סך הכול (בסגנון תיל, עם שלב נוסף)
      const pm = r.pick([40, 60, 75, 20, 30]), k = r.pick([2, 3, 4, 5, 6]);
      const total = 20 * k, women = (total * (100 - pm)) / 100, left = r.int(2, Math.max(2, Math.floor(women / 2)));
      if (!Number.isInteger(women)) return T.percent[0](r);
      const newPct = Math.round(((total * pm) / 100 / (total - left)) * 1000) / 10;
      if (!Number.isInteger(newPct)) return T.percent[1](r);
      return { text: `באוטובוס ${women} נשים, ו־${pm}% מהנוסעים הם גברים. בתחנה ירדו ${left} נשים. איזה אחוז מהנוסעים הם גברים עכשיו?`, ans: newPct, pct: true,
        d: [pm, pm + left, Math.round(((total * pm) / 100 / total) * 100) + 5, 100 - newPct], ex: `סך הנוסעים: ${women} הן ${100 - pm}%, לכן ${total} נוסעים ו־${(total * pm) / 100} גברים. אחרי שירדו ${left}: ${total - left} נוסעים. ${(total * pm) / 100}/${total - left} = ${newPct}%.` };
    },
  ],
  ratio: [
    (r) => { // יחס שמשתנה
      const a = r.int(2, 5), b = r.int(a + 1, 8), k = r.int(3, 6), x = r.pick([2, 3, 4, 6]) * r.int(1, 2);
      if (gcd(a, b) > 1) return T.ratio[1](r); // יחס מצומצם בלבד (לא 4:8)
      const g = gcd(a * k, b * k + x), c = (a * k) / g, d = (b * k + x) / g;
      if (c === a && d === b) return T.ratio[1](r);
      const ans = (a + b) * k;
      return { text: `בכיתה היחס בין בנים לבנות היה ${a}:${b}. הצטרפו ${x} בנות, ועכשיו היחס ${c}:${d}. כמה תלמידים היו בכיתה לפני שהבנות הצטרפו?`, ans,
        d: [ans + x, (c + d) * k, (a + b) * (k + 1), ans - x], ex: `בנים ${a}k ובנות ${b}k. אחרי שהצטרפו ${x} בנות: ${a}k : (${b}k+${x}) = ${c}:${d}, ומכאן k = ${k}. היו ${a + b}×${k} = ${ans} תלמידים.` };
    },
    (r) => { // גילים
      const [k, j, m] = r.pick([[4, 3, 5], [3, 2, 10], [5, 3, 4], [4, 2, 6], [3, 2, 8], [5, 4, 3], [6, 4, 5], [4, 3, 6]]);
      const S = (m * (j - 1)) / (k - j);
      if (!Number.isInteger(S)) return T.ratio[2](r);
      const F = k * S;
      return { text: `אבא מבוגר פי ${k} מבנו. בעוד ${m} שנים הוא יהיה מבוגר מבנו פי ${j}. בן כמה האבא היום?`, ans: F,
        d: [S, F + m, k * m, F - m], ex: `הבן x, האבא ${k}x. בעוד ${m} שנים: ${k}x+${m} = ${j}(x+${m}), ולכן x = ${S}. האבא: ${F}.` };
    },
    (r) => { // שמירת יחס בין שלושה סוגים (בסגנון תיל)
      const parts = r.sample([2, 3, 4, 5, 6, 7], 3), k1 = r.pick([2, 3, 4]), k2 = r.pick([5, 6, 8, 9]);
      const sum = parts.reduce((s, x) => s + x, 0);
      const before = parts.map((p) => p * k1), after = sum * k2;
      const ans = parts[0] * k2;
      return { text: `מכונה מייצרת בכל מחזור ${before[0]} סוכריות על מקל, ${before[1]} סוכריות מנטה ו־${before[2]} סוכריות גומי. אחרי שדרוג היא מייצרת ${after} סוכריות במחזור, והיחס בין הסוגים נשמר. כמה סוכריות על מקל היא מייצרת עכשיו?`, ans,
        d: [before[0] + (after - sum * k1) / 3, Math.round(after / 3), parts[1] * k2, ans + parts[0]], ex: `לפני: ${before.join('+')} = ${sum * k1}. היחס ${parts.join(':')}, ${sum} חלקים. אחרי: ${after}/${sum} = ${k2} לכל חלק. על מקל: ${parts[0]}×${k2} = ${ans}.` };
    },
  ],
  motion: [
    (r) => { // השגה
      const v1 = r.pick([40, 50, 60]), dv = r.pick([10, 20, 30]), t = r.pick([1, 2, 3]);
      const ans = (v1 * t) / dv;
      if (!Number.isInteger(ans)) return T.motion[1](r);
      const n = r.pick(N);
      return { text: `מכונית יצאה מעיר במהירות ${v1} קמ״ש. ${t === 1 ? 'שעה' : `${t} שעות`} אחריה יצא ${n} מאותה עיר, באותה דרך, במהירות ${v1 + dv} קמ״ש. כמה שעות אחרי שיצא ישיג ${n} את המכונית?`, ans,
        d: [ans + t, t, ans * 2, Math.max(1, ans - 1)], ex: `עד ש${n} יצא, המכונית התרחקה ${v1}×${t} = ${v1 * t} ק״מ. ${n} סוגר ${dv} ק״מ בשעה: ${v1 * t}/${dv} = ${ans}.` };
    },
    (r) => { // סירה בזרם
      const [v, c, d] = r.pick([[10, 2, 24], [12, 4, 32], [15, 3, 36], [8, 2, 30], [14, 2, 48], [9, 3, 24]]);
      const ans = d / (v + c) + d / (v - c);
      return { text: `מהירות סירה במים עומדים ${v} קמ״ש, ומהירות הזרם ${c} קמ״ש. הסירה שטה ${d} ק״מ עם הזרם, וחזרה ${d} ק״מ נגד הזרם. כמה שעות נמשכה כל השיטה?`, ans,
        d: [(2 * d) / v, (2 * d) / (v + c), (2 * d) / (v - c), ans + 1], ex: `עם הזרם: ${d}/${v + c} = ${d / (v + c)} שעות. נגד הזרם: ${d}/${v - c} = ${d / (v - c)} שעות. סך הכול ${ans}.` };
    },
    (r) => { // מסלול מעגלי
      const L = r.pick([400, 600, 800, 1200]), v1 = r.pick([150, 200, 250]), v2 = r.pick([50, 100]);
      const same = r.chance(0.5);
      const ans = same ? L / (v1 - v2) : L / (v1 + v2);
      if (!Number.isInteger(ans)) return T.motion[3](r);
      return { text: `שני רצים יוצאים יחד מאותה נקודה על מסלול מעגלי באורך ${L} מטר, ${same ? 'באותו כיוון' : 'בכיוונים הפוכים'}. מהירות אחד ${v1} מטר לדקה ושל השני ${v2} מטר לדקה. אחרי כמה דקות ייפגשו לראשונה?`, ans,
        d: [same ? L / (v1 + v2) : L / (v1 - v2), L / v1, L / v2, ans * 2], ex: same ? `באותו כיוון המהיר צריך להשלים הקפה שלמה יותר: ${L}/${v1 - v2} = ${ans}.` : `בכיוונים הפוכים המהירויות מתחברות: ${L}/${v1 + v2} = ${ans}.` };
    },
    (r) => { // רכבת חוצה רציף
      const v = r.pick([10, 20, 25]), Lt = r.pick([100, 150, 200]), Lp = r.pick([200, 250, 300, 400]);
      const ans = (Lt + Lp) / v;
      if (!Number.isInteger(ans)) return T.motion[0](r);
      return { text: `רכבת באורך ${Lt} מטר נוסעת ${v} מטר בשנייה. כמה שניות עוברות מהרגע שהקטר נכנס לרציף באורך ${Lp} מטר ועד שהקרון האחרון יוצא ממנו?`, ans,
        d: [Lp / v, Lt / v, ans + 5, ans * 2], ex: `צריך לעבור את הרציף ועוד את אורך הרכבת: ${Lp + Lt} מטר. ${Lp + Lt}/${v} = ${ans}.` };
    },
    (r) => { // שתי רכבות עם עצירה (בסגנון תיל)
      const v = r.pick([60, 90, 120]), stop = r.pick([10, 15, 20]), half = v / 2;
      const extra = r.pick([2, 4, 6]) * (v / 60);
      const D = 2 * half + 2 * extra;
      const ans = 30 + stop + (extra / v) * 60;
      if (!Number.isInteger(ans)) return T.motion[0](r);
      return { text: `המרחק בין שתי תחנות ${D} ק״מ. שתי רכבות יוצאות באותו רגע זו לקראת זו, כל אחת ${v} קמ״ש. כל רכבת עוצרת אחרי ${half} ק״מ ל־${stop} דקות. אחרי כמה דקות ייפגשו?`, ans,
        d: [(D / (2 * v)) * 60, ans - stop, ans + stop, Math.round((D / v) * 60)], ex: `עד העצירה כל רכבת נוסעת ${half} ק״מ = 30 דקות, ועוד ${stop} דקות עצירה. נשארו ${D - 2 * half} ק״מ, ${extra} לכל רכבת = ${(extra / v) * 60} דקות. סך הכול ${ans}.` };
    },
  ],
  work: [
    (r) => { // ממלא ומרוקן
      const [a, b, ans] = r.pick([[3, 6, 6], [4, 12, 6], [6, 10, 15], [2, 3, 6], [4, 6, 12], [3, 4, 12], [6, 9, 18]]);
      return { text: `ברז ממלא בריכה ב־${a} שעות, ופתח ניקוז מרוקן את הבריכה המלאה ב־${b} שעות. אם פותחים את שניהם כשהבריכה ריקה, בכמה שעות היא תתמלא?`, ans,
        d: [b - a, a + b, Math.round(((a * b) / (a + b)) * 10) / 10, b], ex: `בשעה: 1/${a} − 1/${b} = 1/${ans} מהבריכה. לכן ${ans} שעות.` };
    },
    (r) => { // לבד ויחד — כמה השני לבד
      const [x, y, ans] = r.pick([[6, 4, 12], [10, 6, 15], [12, 8, 24], [15, 10, 30], [20, 12, 30], [3, 2, 6], [12, 4, 6]]);
      return { text: `פועל א׳ צובע בית ב־${x} ימים. שני הפועלים יחד צובעים אותו ב־${y} ימים. בכמה ימים יצבע פועל ב׳ לבדו?`, ans,
        d: [x - y, x + y, 2 * y, Math.round(((x * y) / (x + y)) * 10) / 10], ex: `ביום: יחד 1/${y}, א׳ 1/${x}. ב׳: 1/${y} − 1/${x} = 1/${ans}.` };
    },
    (r) => { // מתחילים יחד ואחד עוזב
      const [a, b] = r.pick([[6, 12], [4, 12], [10, 15], [6, 3], [12, 6]]), t = r.pick([1, 2]);
      const doneTogether = t * (1 / a + 1 / b), rest = 1 - doneTogether;
      const ans = Math.round(rest * b * 100) / 100;
      if (rest <= 0 || !Number.isInteger(ans)) return T.work[1](r);
      return { text: `פועל א׳ מסיים עבודה ב־${a} ימים ופועל ב׳ ב־${b} ימים. הם עבדו יחד ${t === 1 ? 'יום אחד' : `${t} ימים`}, ואז א׳ עזב. כמה ימים נוספים יעבוד ב׳ לבד עד הסוף?`, ans,
        d: [b - t, Math.max(1, ans - 1), ans + 1, Math.round(((a * b) / (a + b)) * 10) / 10], ex: `ביום יחד: 1/${a}+1/${b}. אחרי ${t} ימים נעשה ${frac(Math.round(doneTogether * a * b), a * b)} מהעבודה. נשאר ${frac(Math.round(rest * a * b), a * b)}, ו־ב׳ עושה 1/${b} ביום: ${ans} ימים.` };
    },
  ],
  average: [
    (r) => { // ממוצע אחרי הוצאת מספר
      const n = r.pick([5, 6, 8, 10]), a = r.int(12, 30), b = a + r.pick([-2, -1, 1, 2]);
      const ans = n * a - (n - 1) * b;
      if (ans <= 0) return T.average[1](r);
      return { text: `הממוצע של ${n} מספרים הוא ${a}. הוציאו מספר אחד, והממוצע של הנותרים הוא ${b}. איזה מספר הוציאו?`, ans,
        d: [a, Math.abs(a - b), ans + (b - a), n * (a - b) + a], ex: `סכום הכול: ${n * a}. סכום הנותרים: ${(n - 1) * b}. ההפרש: ${ans}.` };
    },
    (r) => { // ממוצע משוקלל
      const n1 = r.pick([10, 20, 30]), n2 = r.pick([10, 20, 30, 40]), a1 = r.int(14, 18) * 5, a2 = r.int(12, 18) * 5;
      const ans = (n1 * a1 + n2 * a2) / (n1 + n2);
      if (!Number.isInteger(ans) || n1 === n2 || a1 === a2) return T.average[2](r);
      return { text: `בכיתה א׳ ${n1} תלמידים עם ממוצע ${a1}, ובכיתה ב׳ ${n2} תלמידים עם ממוצע ${a2}. מה הממוצע של כל התלמידים יחד?`, ans,
        d: [(a1 + a2) / 2, ans + 1, ans - 2, Math.max(a1, a2) - 1], ex: `סכום: ${n1}×${a1} + ${n2}×${a2} = ${n1 * a1 + n2 * a2}, חלקי ${n1 + n2} = ${ans}. לא הממוצע הפשוט (${(a1 + a2) / 2}).` };
    },
    (r) => { // מספרים זוגיים עוקבים
      const k = r.pick([4, 5, 6]), first = 2 * r.int(5, 30);
      const nums = Array.from({ length: k }, (_, i) => first + 2 * i);
      const S = nums.reduce((a, b) => a + b, 0);
      return { text: `סכומם של ${k} מספרים זוגיים עוקבים הוא ${S}. מהו הגדול מביניהם?`, ans: nums[k - 1],
        d: [nums[k - 2], Math.round(S / k), nums[k - 1] + 2, nums[0]], ex: `הממוצע ${S / k}. המספרים: ${nums.join(', ')}.` };
    },
    (r) => { // ציון נדרש
      const k = r.pick([4, 5, 6]), avg = r.int(70, 84), add = r.pick([2, 3]);
      const goal = avg + add, ans = goal * (k + 2) - avg * k;
      if (ans > 200 || ans % 2) return T.average[0](r);
      return { text: `הממוצע של עמית ב־${k} מבחנים הוא ${avg}. נשארו לו שני מבחנים, והוא רוצה ממוצע ${goal} בכל ${k + 2}. מה הציון הממוצע שהוא צריך בשני המבחנים האחרונים?`, ans: ans / 2,
        d: [goal, goal + add, ans / 2 - add, goal + 2 * add + 1], ex: `סכום עכשיו: ${avg * k}. סכום דרוש: ${goal}×${k + 2} = ${goal * (k + 2)}. חסר ${ans}, כלומר ${ans / 2} בממוצע לכל מבחן.` };
    },
  ],
};

export function arithmeticQuestion(seed, sub) {
  const r = makeRng(seed);
  const picked = r.pick(SUBS);
  const s = sub && SUBS.includes(sub) ? sub : picked;
  const q = r.pick(T[s])(r);
  let options, answer;
  if (q.str) {
    ({ options, answer } = withDistractors(r, q.ans, q.d, String));
  } else {
    const fb = [2, -2, 5, 10, -5, 3].map((k) => q.ans + k);
    const ds = [...q.d, ...fb].map((x) => Math.round(x * 10) / 10).filter((x) => Number.isFinite(x) && (q.pct || x > 0) && x !== q.ans);
    ({ options, answer } = withDistractors(r, q.ans, ds, String));
    options = options.map((o) => (q.pct ? `${o}%` : String(o)));
  }
  return { topic: 'arithmetic', sub: s, seed, kind: 'text', v: 2, prompt: q.text, options, answer, explain: q.ex };
}
