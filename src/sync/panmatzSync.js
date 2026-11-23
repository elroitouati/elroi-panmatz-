// סנכרון דו-כיווני עם My Day דרך הטבלה panmatz_daily ב-Supabase.
//
//  • כל שינוי ביעדי היום או בסימון נכתב לטבלה (upsert).
//  • מאזינים ל-Realtime: סימון שנעשה ב-My Day מעדכן את המצב המקומי.
//  • אופליין: השינויים נשמרים בתור מקומי ונשלחים כשחוזר החיבור.
//    "האחרון קובע" לפי updated_at (נאכף גם בשרת), ובלי כפילויות.
//  • בלי מפתחות / בלי התחברות — כלום לא רץ, והאפליקציה עובדת כמו קודם.
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, supabaseConfigured, currentUser } from './supabase';
import { todayKey } from '../utils/date';
import {
  SYNC_BACK_DAYS,
  SYNC_FORWARD_DAYS,
  addDays,
  rowKey,
  rowsForRange,
  diffRows,
  enqueue,
  applyDone,
} from '../utils/syncRows';

const TABLE = 'panmatz_daily';
const META_KEY = 'elroi-panmatz-sync-v1'; // נפרד לגמרי ממפתח הנתונים של האפליקציה
const ts = (v) => (v ? new Date(v).getTime() : 0);

let meta = null; // { pushed: { key: row }, queue: [row+updated_at] }
let host = null; // { getState, update }
let channel = null;
let debounce = null;
const listeners = new Set();
let status = { user: null, lastSync: null, error: null };

function setStatus(patch) {
  status = { ...status, ...patch };
  listeners.forEach((fn) => fn(status));
}
export const getSyncStatus = () => status;
export function onSyncStatus(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

async function loadMeta() {
  if (meta) return meta;
  try {
    const raw = await AsyncStorage.getItem(META_KEY);
    meta = raw ? JSON.parse(raw) : null;
  } catch {
    meta = null;
  }
  if (!meta || typeof meta !== 'object') meta = { pushed: {}, queue: [] };
  meta.pushed = meta.pushed || {};
  meta.queue = meta.queue || [];
  return meta;
}

async function saveMeta() {
  try {
    // שומרים רק חלון של ~חודש אחורה כדי שהקובץ לא יגדל
    const cutoff = addDays(todayKey(), -35);
    Object.keys(meta.pushed).forEach((k) => {
      if (k.split('|')[0] < cutoff) delete meta.pushed[k];
    });
    await AsyncStorage.setItem(META_KEY, JSON.stringify(meta));
  } catch {
    // לא קריטי — ננסה שוב בשינוי הבא
  }
}

// ---------------------------------------------------------------------------
//  שליחה
// ---------------------------------------------------------------------------
async function queueChanges(state) {
  const user = await currentUser();
  if (!user || !state) return;
  await loadMeta();
  const today = todayKey();
  const from = addDays(today, -SYNC_BACK_DAYS);
  const to = addDays(today, SYNC_FORWARD_DAYS);
  const changed = diffRows(rowsForRange(state, from, to), meta.pushed, today, from, to);
  if (!changed.length) return;
  const updated_at = new Date().toISOString();
  changed.forEach((r) => {
    meta.queue = enqueue(meta.queue, { ...r, updated_at });
    meta.pushed[rowKey(r)] = r;
  });
  await saveMeta();
}

let flushing = null;
export function flush() {
  if (!flushing) {
    flushing = (async () => {
      try {
        const user = await currentUser();
        if (!user) return;
        await loadMeta();
        if (!meta.queue.length) return;
        const batch = meta.queue.slice(0, 200);
        const { error } = await supabase
          .from(TABLE)
          .upsert(batch.map((r) => ({ ...r, user_id: user.id })), { onConflict: 'user_id,date,goal_id' });
        if (error) throw error;
        const sent = new Set(batch.map((r) => `${rowKey(r)}|${r.updated_at}`));
        meta.queue = meta.queue.filter((r) => !sent.has(`${rowKey(r)}|${r.updated_at}`));
        await saveMeta();
        setStatus({ lastSync: new Date().toISOString(), error: null });
      } catch (e) {
        setStatus({ error: e }); // נשאר בתור — יישלח כשיחזור החיבור
      } finally {
        flushing = null;
      }
    })();
  }
  return flushing;
}

// נקרא אחרי כל שינוי מצב (עם השהיה קטנה, כדי לאחד שינויים רצופים)
export function notifyStateChanged() {
  if (!supabaseConfigured || !host) return;
  clearTimeout(debounce);
  debounce = setTimeout(async () => {
    try {
      await queueChanges(host.getState());
      await flush();
    } catch {
      // הסנכרון לעולם לא מפיל את האפליקציה
    }
  }, 700);
}

// ---------------------------------------------------------------------------
//  קבלה
// ---------------------------------------------------------------------------
async function applyRemoteRows(rows) {
  await loadMeta();
  let touched = false;
  const updates = [];
  rows.forEach((r) => {
    if (!r || !r.date || !r.goal_id) return;
    const key = rowKey(r);
    const mine = meta.queue.find((q) => rowKey(q) === key);
    if (mine && ts(mine.updated_at) >= ts(r.updated_at)) return; // השינוי המקומי חדש יותר
    if (mine) meta.queue = meta.queue.filter((q) => q !== mine); // השרת חדש יותר
    if (r.deleted) return;
    // מעדכנים את "מה שנשלח" לפני שמשנים את המצב, כדי שלא יישלח חזרה (הד)
    const prev = meta.pushed[key] || { date: r.date, goal_id: r.goal_id, title: r.title, target: r.target, deleted: false };
    meta.pushed[key] = { ...prev, done: !!r.done };
    updates.push(r);
    touched = true;
  });
  if (!touched) return;
  await saveMeta();
  host?.update((s) => updates.reduce((acc, r) => applyDone(acc, r.date, r.goal_id, !!r.done), s));
}

async function pull() {
  const user = await currentUser();
  if (!user) return;
  const today = todayKey();
  const { data, error } = await supabase
    .from(TABLE)
    .select('date, goal_id, title, target, done, deleted, updated_at')
    .eq('user_id', user.id)
    .gte('date', addDays(today, -SYNC_BACK_DAYS))
    .lte('date', addDays(today, SYNC_FORWARD_DAYS));
  if (error) throw error;
  await applyRemoteRows(data || []);
}

export async function syncNow() {
  if (!supabaseConfigured || !host) return;
  try {
    await flush();
    await pull();
    await queueChanges(host.getState());
    await flush();
    setStatus({ lastSync: new Date().toISOString(), error: null });
  } catch (e) {
    setStatus({ error: e });
  }
}

function subscribe(user) {
  unsubscribe();
  channel = supabase
    .channel(`panmatz-${user.id}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: TABLE, filter: `user_id=eq.${user.id}` },
      (payload) => {
        applyRemoteRows([payload.new]).catch(() => {});
      }
    )
    .subscribe((s) => {
      if (s === 'SUBSCRIBED') syncNow(); // חיבור או חיבור מחדש — משלימים פערים
    });
}

function unsubscribe() {
  if (channel) {
    supabase.removeChannel(channel);
    channel = null;
  }
}

// ---------------------------------------------------------------------------
//  חיבור לאפליקציה (נקרא פעם אחת מ-AppContext)
// ---------------------------------------------------------------------------
export function attachSync({ getState, update }) {
  if (!supabaseConfigured) return () => {};
  host = { getState, update };
  const start = (user) => {
    setStatus({ user });
    if (user) subscribe(user);
    else unsubscribe();
  };
  currentUser().then(start);
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'INITIAL_SESSION') start(session?.user ?? null);
  });
  const appSub = AppState.addEventListener('change', (s) => {
    if (s === 'active') {
      supabase.auth.startAutoRefresh();
      syncNow();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
  return () => {
    data.subscription.unsubscribe();
    appSub.remove();
    unsubscribe();
    host = null;
  };
}

// ---------------------------------------------------------------------------
//  התחברות
// ---------------------------------------------------------------------------
export async function signIn(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw error;
}

export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
  if (error) throw error;
  return !!data.session; // false = צריך לאשר אימייל
}

export async function signOut() {
  unsubscribe();
  await supabase.auth.signOut();
  meta = { pushed: {}, queue: [] };
  await AsyncStorage.removeItem(META_KEY).catch(() => {});
  setStatus({ user: null, lastSync: null, error: null });
}

// ---------------------------------------------------------------------------
//  גיבוי מלא לענן / שחזור
// ---------------------------------------------------------------------------
export async function backupToCloud(state) {
  const user = await currentUser();
  if (!user) throw new Error('צריך להתחבר קודם');
  const updated_at = new Date().toISOString();
  const { error } = await supabase.from('panmatz_backup').upsert({ user_id: user.id, state, updated_at });
  if (error) throw error;
  return updated_at;
}

export async function lastBackupTime() {
  const user = await currentUser();
  if (!user) return null;
  const { data } = await supabase.from('panmatz_backup').select('updated_at').eq('user_id', user.id).maybeSingle();
  return data?.updated_at ?? null;
}

export async function fetchBackup() {
  const user = await currentUser();
  if (!user) throw new Error('צריך להתחבר קודם');
  const { data, error } = await supabase.from('panmatz_backup').select('state, updated_at').eq('user_id', user.id).maybeSingle();
  if (error) throw error;
  return data; // null אם אין גיבוי
}
