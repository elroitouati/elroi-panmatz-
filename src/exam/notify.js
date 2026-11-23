import * as Notifications from 'expo-notifications';
import { ensurePermissions } from '../notifications';

// ============================================================================
//  התראות של עולם המבחן — מקומיות בלבד, מזהים משלהן (לא נוגעות באימונים):
//  • exam-study-<יום>: תזכורת לימוד שבועית לכל יום שנבחרה לו שעה.
//    ביום שישי: "בדיקה שבועית היום".
//  • exam-evening: בערב, רק אם נשארו משימות היום — עם רשימת המשימות.
//    נקבעת מחדש בכל התקדמות, ומתבטלת כשהכול הושלם.
// ============================================================================

const BLUE = '#263B55';

export async function cancelStudyReminders() {
  for (let wd = 0; wd <= 6; wd++) {
    await Notifications.cancelScheduledNotificationAsync(`exam-study-${wd}`).catch(() => {});
  }
}

export async function scheduleStudyReminders(settings) {
  try {
    await cancelStudyReminders();
    if (!settings.notify) return;
    const ok = await ensurePermissions();
    if (!ok) return;
    for (let wd = 0; wd <= 6; wd++) {
      const t = settings.studyByDay?.[wd];
      if (!t || (settings.weeklyOff || []).includes(wd)) continue;
      const friday = wd === 5;
      await Notifications.scheduleNotificationAsync({
        identifier: `exam-study-${wd}`,
        content: {
          title: friday ? 'פסיכוטכני · בדיקה שבועית היום' : 'פסיכוטכני · האימון של היום',
          body: friday ? '30 דקות בתנאי מבחן. המערכת תתאים את השבוע הבא לפי התוצאות.' : `${settings.dailyMinutes || 30} דקות: מילים, תרגול מעורב וחזרה על טעויות.`,
          color: BLUE,
        },
        trigger: { weekday: wd + 1, hour: t.hour, minute: t.minute, repeats: true },
      });
    }
  } catch (e) {
    console.warn('תזכורות לימוד נכשלו', e);
  }
}

export async function scheduleEvening(settings, remaining, day) {
  try {
    await Notifications.cancelScheduledNotificationAsync('exam-evening').catch(() => {});
    if (!settings.notify || !settings.evening || !remaining.length) return;
    const [y, m, d] = day.split('-').map(Number);
    const when = new Date(y, m - 1, d, settings.evening.hour, settings.evening.minute, 0);
    if (when.getTime() <= Date.now() + 60000) return;
    const n = remaining.length;
    await Notifications.scheduleNotificationAsync({
      identifier: 'exam-evening',
      content: {
        title: `פסיכוטכני · ${n === 1 ? 'נשארה משימה אחת' : `נשארו ${n} משימות`}`,
        body: remaining.map((t) => `${t.title} (${t.minutes} דק׳)`).join(' · '),
        color: BLUE,
      },
      trigger: { date: when },
    });
  } catch (e) {
    console.warn('תזכורת ערב נכשלה', e);
  }
}
