// חיבור ל-Supabase — רק אם הוגדרו מפתחות בקובץ .env.
// בלי מפתחות (או בלי התחברות) האפליקציה עובדת בדיוק כמו קודם, מקומית בלבד.
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(url && anonKey && !url.includes('YOUR-PROJECT'));

export const supabase = supabaseConfigured
  ? createClient(url, anonKey, {
      auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
    })
  : null;

export async function currentUser() {
  if (!supabase) return null;
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.user ?? null;
  } catch {
    return null;
  }
}

export function authErrorText(e) {
  const m = String(e?.message || e || '');
  if (/Invalid login credentials/i.test(m)) return 'אימייל או סיסמה לא נכונים';
  if (/Email not confirmed/i.test(m)) return 'צריך לאשר את האימייל (בדוק את תיבת הדואר)';
  if (/already registered/i.test(m)) return 'המשתמש כבר קיים — לחץ "התחברות"';
  if (/Password should be/i.test(m)) return 'הסיסמה קצרה מדי (לפחות 6 תווים)';
  if (/network|fetch/i.test(m)) return 'אין חיבור לאינטרנט';
  return m || 'שגיאה לא ידועה';
}
