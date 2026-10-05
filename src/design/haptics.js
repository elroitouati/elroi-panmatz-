import * as Haptics from 'expo-haptics';

// רטט — שלושה כללים מוחלטים (animate-expo §8):
// 1. באותו פריים של המשוב החזותי.  2. אחד לכל פעולה.  3. אף פעם לא המשוב היחיד.
// רטט כבוי אצל הרבה משתמשים, ולכן כל קריאה עטופה — כשל שקט, לא קריסה.
const quiet = (p) => p.catch(() => {});

export const haptic = {
  selection: () => quiet(Haptics.selectionAsync()),                                  // ערך עבר שלב: סטפר, יום
  light: () => quiet(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),          // משהו "נתפס": סימון, גיליון נסגר
  success: () => quiet(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  error: () => quiet(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
};
