import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// התראות פוש מקומיות בלבד — בלי שרת. כולל תזכורת אימון וחיזוקים על התקדמות.

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function ensurePermissions() {
  try {
    const settings = await Notifications.getPermissionsAsync();
    let granted = settings.granted;
    if (!granted) {
      const req = await Notifications.requestPermissionsAsync();
      granted = req.granted;
    }
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'תזכורות אימון',
        importance: Notifications.AndroidImportance.DEFAULT,
        lightColor: '#f0c239',
      });
    }
    return granted;
  } catch (e) {
    console.warn('בקשת הרשאות התראות נכשלה', e);
    return false;
  }
}

// קובע תזכורת אימון יומית חוזרת (שעה קבועה) בימי האימון שנבחרו.
// weekdays: מערך 0=ראשון..6=שבת. expo משתמש ב-1=ראשון..7=שבת בטריגר שבועי.
export async function scheduleDailyTrainingReminders(weekdays, hour = 18, minute = 0) {
  try {
    await cancelTrainingReminders();
    const ids = [];
    for (const wd of weekdays) {
      const id = await Notifications.scheduleNotificationAsync({
        identifier: `train-${wd}`,
        content: {
          title: 'אלרואי — זמן להתאמן 💪',
          body: 'עוד יום קרוב לפנמ"צ. סמן את האימון של היום כשתסיים.',
          color: '#f0c239',
        },
        trigger: {
          weekday: wd + 1, // המרה למוסכמת expo
          hour,
          minute,
          repeats: true,
        },
      });
      ids.push(id);
    }
    return ids;
  } catch (e) {
    console.warn('קביעת תזכורות נכשלה', e);
    return [];
  }
}

export async function cancelTrainingReminders() {
  try {
    for (let wd = 0; wd <= 6; wd++) {
      await Notifications.cancelScheduledNotificationAsync(`train-${wd}`).catch(() => {});
    }
  } catch (e) {
    // מתעלמים
  }
}

// חיזוק מיידי — שיא אישי, שדרוג יעד או הגעה ליעד סופי
export async function sendReinforcement(title, body) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, color: '#f0c239' },
      trigger: null, // מיידי
    });
  } catch (e) {
    // מתעלמים בשקט — חיזוק הוא לא קריטי
  }
}
