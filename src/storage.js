import AsyncStorage from '@react-native-async-storage/async-storage';

// כל הנתונים נשמרים מקומית על המכשיר בלבד — בלי שרת, בלי חשבון.
const KEY = 'elroi-panmatz-state-v1';

export async function loadState() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('טעינת נתונים נכשלה', e);
    return null;
  }
}

export async function saveState(state) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('שמירת נתונים נכשלה', e);
  }
}

export async function clearState() {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch (e) {
    console.warn('מחיקת נתונים נכשלה', e);
  }
}
