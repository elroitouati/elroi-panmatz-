// ============================================================================
//  סנכרון עולם המבחן לענן (Supabase, הטבלה exam_state) — בין הטלפון למחשב.
//  • אותו חשבון ואותה התחברות כמו הסנכרון עם My Day.
//  • מסמך אחד למשתמש. כל שליחה: מושכים → ממזגים (merge.js) → כותבים.
//    כך שני מכשירים שעבדו במקביל לא דורסים זה את זה.
//  • Realtime: שינוי במכשיר השני נכנס תוך שניות.
//  • בלי מפתחות / בלי התחברות / בלי טבלה — לא קורה כלום, הכול נשאר מקומי.
// ============================================================================
import { AppState, Platform } from 'react-native';
import { supabase, supabaseConfigured, currentUser } from '../sync/supabase';
import { mergeExam, fingerprint } from './engine/merge';

const TABLE = 'exam_state';
let host = null;        // { getState, merge }
let channel = null;
let timer = null;
let lastSent = '';
let running = null;
const listeners = new Set();
let status = { user: null, lastSync: null, error: null, missingTable: false, syncing: false };

function setStatus(p) { status = { ...status, ...p }; listeners.forEach((fn) => fn(status)); }
export const getExamSyncStatus = () => status;
export function onExamSyncStatus(fn) { listeners.add(fn); return () => listeners.delete(fn); }

const isMissingTable = (e) => /PGRST205|42P01|does not exist|Could not find the table/i.test(`${e?.code} ${e?.message}`);

export function syncExamNow() {
  if (!supabaseConfigured || !host) return Promise.resolve();
  if (running) return running;
  running = (async () => {
    try {
      const user = await currentUser();
      if (!user) return;
      setStatus({ syncing: true });
      const { data, error } = await supabase.from(TABLE).select('data').eq('user_id', user.id).maybeSingle();
      if (error) throw error;
      const remote = data?.data || null;
      const local = host.getState();
      if (!local) return;
      const merged = mergeExam(local, remote);
      if (remote && fingerprint(merged) !== fingerprint(local)) host.merge(remote);
      const fp = fingerprint(merged);
      if (!remote || fp !== fingerprint(remote)) {
        const { error: e2 } = await supabase.from(TABLE).upsert({ user_id: user.id, data: merged, updated_at: new Date().toISOString() });
        if (e2) throw e2;
      }
      lastSent = fp;
      setStatus({ lastSync: new Date().toISOString(), error: null, missingTable: false });
    } catch (e) {
      setStatus({ error: e, missingTable: isMissingTable(e) });
    } finally {
      setStatus({ syncing: false });
      running = null;
    }
  })();
  return running;
}

export function notifyExamChanged() {
  if (!supabaseConfigured || !host) return;
  clearTimeout(timer);
  timer = setTimeout(() => {
    const s = host?.getState();
    if (!s || fingerprint(s) === lastSent) return;
    syncExamNow();
  }, 3000);
}

function subscribe(user) {
  unsubscribe();
  channel = supabase
    .channel(`exam-${user.id}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: TABLE, filter: `user_id=eq.${user.id}` }, (payload) => {
      const remote = payload.new?.data;
      if (!remote || !host) return;
      lastSent = fingerprint(remote);
      host.merge(remote);
    })
    .subscribe((s) => { if (s === 'SUBSCRIBED') syncExamNow(); });
}
function unsubscribe() { if (channel) { supabase.removeChannel(channel); channel = null; } }

export function attachExamSync({ getState, merge }) {
  if (!supabaseConfigured) return () => {};
  host = { getState, merge };
  const start = (user) => {
    setStatus({ user });
    if (user) subscribe(user); else unsubscribe();
  };
  currentUser().then(start);
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'INITIAL_SESSION') start(session?.user ?? null);
  });
  const appSub = AppState.addEventListener('change', (s) => { if (s === 'active') syncExamNow(); });
  // בדפדפן: גם כשחוזרים ללשונית
  const onVis = () => { if (typeof document !== 'undefined' && document.visibilityState === 'visible') syncExamNow(); };
  if (Platform.OS === 'web' && typeof document !== 'undefined') document.addEventListener('visibilitychange', onVis);
  return () => {
    data.subscription.unsubscribe();
    appSub.remove();
    if (Platform.OS === 'web' && typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVis);
    unsubscribe();
    host = null;
  };
}
