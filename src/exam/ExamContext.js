import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { keyOf, addDays } from './engine/time';
import { review as srsReview, isDue } from './engine/srs';
import { planForDay, readiness, trimAttempts, wordDeck, startOf } from './engine/brain';
import { scheduleStudyReminders, scheduleEvening } from './notify';
import { mergeExam } from './engine/merge';
import { attachExamSync, notifyExamChanged } from './examSync';

const NATIVE = Platform.OS !== 'web'; // בדפדפן אין התראות מקומיות

// ============================================================================
//  מצב עולם המבחן — נשמר בנפרד מפנמ"צ (מפתח משלו), כדי שאפשר יהיה לסנכרן
//  אותו לענן בעתיד בלי לגעת בשאר האפליקציה.
// ============================================================================

const KEY = 'elroi-panmatz-exam-v1';

const STUDY_DEFAULT = { hour: 17, minute: 0 };
export function defaultExamState(today = keyOf(), resetAt = 0) {
  return {
    v: 1,
    resetAt,
    settingsAt: 0,
    simAt: 0,
    errorsGone: {},
    createdAt: today,
    startReadiness: null,
    settings: {
      theme: 'light',
      examDate: '2027-01-28',
      dailyMinutes: 30,
      notify: true,
      studyByDay: { 0: STUDY_DEFAULT, 1: STUDY_DEFAULT, 2: STUDY_DEFAULT, 3: STUDY_DEFAULT, 4: STUDY_DEFAULT, 5: { hour: 14, minute: 0 }, 6: null },
      evening: { hour: 20, minute: 30 },
      simDates: ['2026-12-18', '2027-01-08', '2027-01-22'],
      offDays: [],
    },
    attempts: [],
    sessions: [],
    cards: {},
    newToday: { d: today, n: 0 },
    lessons: {},
    errors: {},
    daily: {},
    diagnosticDone: false,
    activeSim: null,
  };
}

const Ctx = createContext(null);

export function ExamProvider({ children }) {
  const [state, setState] = useState(null);
  const [today, setToday] = useState(keyOf());
  const saveTimer = useRef(null);
  const stateRef = useRef(null);
  stateRef.current = state;

  useEffect(() => {
    (async () => {
      let s = null;
      try { const raw = await AsyncStorage.getItem(KEY); if (raw) s = JSON.parse(raw); } catch (e) { /* מתחילים מחדש */ }
      const base = defaultExamState();
      const next = s ? { ...base, ...s, settings: { ...base.settings, ...(s.settings || {}) } } : base;
      // תאריך התחלה: מי שעוד לא התחיל לענות — התוכנית היומית מתחילה מחר
      if (!next.settings.startDate) {
        const today = keyOf();
        next.settings = { ...next.settings, startDate: next.attempts.length ? next.createdAt : addDays(today, 1) };
        next.settingsAt = Date.now();
        if (!next.attempts.length && next.daily?.[today]) { const d = { ...next.daily }; delete d[today]; next.daily = d; }
      }
      // תיקון חד-פעמי: הגרסה נפתחה לראשונה אחרי חצות, ולכן "מחר" נקבע ל-25.11.
      // הבקשה הייתה להתחיל ב-24.11 — אם עוד לא התחלת, מחזירים את ההתחלה ל-24.11.
      if (!next.startFix1) {
        next.startFix1 = true;
        if (next.settings.startDate === '2026-11-25' && !next.attempts.length) {
          next.settings = { ...next.settings, startDate: '2026-11-24' };
          next.settingsAt = Date.now();
        }
      }
      setState(next);
    })();
  }, []);

  // שמירה מושהית — אחרי כל שינוי, בלי לחסום את הממשק
  useEffect(() => {
    if (!state) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
    }, 400);
    notifyExamChanged();
  }, [state]);

  // סנכרון עם הענף (טלפון ↔ מחשב) — רק אם יש התחברות
  useEffect(() => attachExamSync({
    getState: () => stateRef.current,
    merge: (remote) => setState((s) => (s ? mergeExam(s, remote) : s)),
  }), []);

  // יום חדש כשחוזרים לאפליקציה
  useEffect(() => {
    const sub = AppState.addEventListener('change', (st) => { if (st === 'active') setToday(keyOf()); });
    const t = setInterval(() => setToday(keyOf()), 60000);
    return () => { sub.remove(); clearInterval(t); };
  }, []);

  // תוכנית היום נקבעת פעם אחת ביום ונשמרת — כך שהרשימה לא "קופצת" תוך כדי היום
  useEffect(() => {
    if (!state || state.daily?.[today]?.plan || today < startOf(state)) return;
    const p = planForDay(state, today);
    const deck = wordDeck(state, today).map((w) => w.id);
    const tasks = p.tasks.map((t) => (t.id === 'words' ? { ...t, words: deck } : t));
    setState((s) => ({ ...s, daily: { ...pruneDaily(s.daily, today), [today]: { ...(s.daily?.[today] || {}), plan: { ...p, tasks }, done: s.daily?.[today]?.done || {} } } }));
  }, [state, today]);

  // תזכורות לימוד — כשההגדרות משתנות
  const settingsKey = state ? JSON.stringify([state.settings.notify, state.settings.studyByDay, state.settings.dailyMinutes]) : '';
  useEffect(() => { if (state && NATIVE) scheduleStudyReminders(state.settings); }, [settingsKey]);

  // תזכורת ערב — כשההתקדמות היומית משתנה
  const dayData = state?.daily?.[today];
  const remaining = dayData?.plan ? dayData.plan.tasks.filter((t) => !dayData.done?.[t.id]) : [];
  const eveningKey = state ? JSON.stringify([today, remaining.map((t) => t.id), state.settings.evening, state.settings.notify, state.settings.offDays.includes(today)]) : '';
  useEffect(() => {
    if (!state || !dayData?.plan || !NATIVE) return;
    scheduleEvening(state.settings, state.settings.offDays.includes(today) ? [] : remaining, today);
  }, [eveningKey]);

  // ---------------------------------------------------------------------------
  //  פעולות
  // ---------------------------------------------------------------------------
  const markTask = useCallback((taskId, day = keyOf()) => {
    if (!taskId) return;
    setState((s) => ({ ...s, daily: { ...s.daily, [day]: { ...(s.daily[day] || {}), done: { ...(s.daily[day]?.done || {}), [taskId]: true } } } }));
  }, []);

  // סיום סשן שאלות: ניסיונות, מחברת טעויות, היסטוריה, משימה
  const recordSession = useCallback(({ mode, items, durationMs, taskId, topic, complete = true, sections }) => {
    const day = keyOf();
    const now = Date.now();
    const id = `s${now}`;
    setState((s) => {
      const attempts = trimAttempts([
        ...s.attempts,
        ...items.filter((it) => it.chosen != null).map((it) => ({
          t: now, d: day, mode, topic: it.topic, sub: it.sub, seed: it.seed, ref: it.ref || null,
          ok: !!it.ok, ms: Math.round(it.ms || 0), changes: it.changes || 0, firstOk: it.firstOk ?? null, sid: id,
        })),
      ]);
      const errors = { ...s.errors };
      const errorsGone = { ...(s.errorsGone || {}) };
      for (const it of items) {
        if (it.chosen == null) continue;
        const qid = it.qid;
        if (!it.ok) {
          errors[qid] = { topic: it.topic, sub: it.sub, seed: it.seed, ref: it.ref || null, chosen: it.chosen, at: day, reason: errors[qid]?.reason || null, streak: 0, ts: now };
        } else if (errors[qid]) {
          const streak = (errors[qid].streak || 0) + 1;
          if (streak >= 2) { delete errors[qid]; errorsGone[qid] = now; } else errors[qid] = { ...errors[qid], streak, at: day, ts: now };
        }
      }
      const answered = items.filter((it) => it.chosen != null);
      const session = {
        id, mode, d: day, t: now, topic: topic || null, durationMs: Math.round(durationMs || 0), complete,
        n: items.length, answered: answered.length, correct: answered.filter((x) => x.ok).length,
        items: items.map((it) => ({ topic: it.topic, sub: it.sub, seed: it.seed, ref: it.ref || null, qid: it.qid, chosen: it.chosen ?? null, ok: !!it.ok, ms: Math.round(it.ms || 0) })),
        sections: sections || null,
        readiness: readiness(attempts),
      };
      const next = { ...s, attempts, errors, errorsGone, sessions: [...s.sessions, session].slice(-80) };
      if (mode === 'diagnostic' && complete) {
        next.diagnosticDone = true;
        next.startReadiness = readiness(attempts);
      }
      if (complete && taskId) {
        next.daily = { ...s.daily, [day]: { ...(s.daily[day] || {}), done: { ...(s.daily[day]?.done || {}), [taskId]: true } } };
      }
      if (mode === 'sim') { next.activeSim = null; next.simAt = now; }
      return next;
    });
    return id;
  }, []);

  const reviewWord = useCallback((wordId, knew) => {
    const day = keyOf();
    setState((s) => {
      const card = s.cards[wordId];
      const fresh = !card;
      // חזרה מוקדמת (לפני שהגיע הזמן) לא מקדמת קופסה — רק רושמת שנראתה
      const next = card && !isDue(card, day) && knew ? { ...card, seen: card.seen + 1 } : srsReview(card, knew, day);
      const nt = s.newToday?.d === day ? s.newToday.n : 0;
      return { ...s, cards: { ...s.cards, [wordId]: next }, newToday: { d: day, n: nt + (fresh ? 1 : 0) } };
    });
  }, []);

  const undoWord = useCallback((wordId, prevCard, wasNew) => {
    const day = keyOf();
    setState((s) => {
      const cards = { ...s.cards };
      if (prevCard) cards[wordId] = prevCard; else delete cards[wordId];
      const nt = s.newToday?.d === day ? s.newToday.n : 0;
      return { ...s, cards, newToday: { d: day, n: Math.max(0, nt - (wasNew ? 1 : 0)) } };
    });
  }, []);

  const setLesson = useCallback((topic, patch) => {
    setState((s) => ({ ...s, lessons: { ...s.lessons, [topic]: { ...(s.lessons[topic] || {}), ...patch } } }));
  }, []);

  const setErrorReason = useCallback((qid, reason) => {
    setState((s) => (s.errors[qid] ? { ...s, errors: { ...s.errors, [qid]: { ...s.errors[qid], reason, ts: Date.now() } } } : s));
  }, []);

  const updateSettings = useCallback((patch) => {
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch }, settingsAt: Date.now() }));
  }, []);

  const setOffToday = useCallback((off) => {
    const day = keyOf();
    setState((s) => {
      const set = new Set(s.settings.offDays);
      if (off) set.add(day); else set.delete(day);
      return { ...s, settings: { ...s.settings, offDays: [...set].sort() }, settingsAt: Date.now() };
    });
  }, []);

  const saveSim = useCallback((sim) => setState((s) => ({ ...s, activeSim: sim, simAt: Date.now() })), []);

  const resetExam = useCallback(() => setState(defaultExamState(keyOf(), Date.now())), []);

  const value = useMemo(() => ({
    state, today, markTask, recordSession, reviewWord, undoWord, setLesson, setErrorReason, updateSettings, setOffToday, saveSim, resetExam,
  }), [state, today]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

function pruneDaily(daily, today) {
  // שומרים 60 יום אחורה
  const min = addDays(today, -60);
  const out = {};
  for (const k of Object.keys(daily || {})) if (k >= min) out[k] = daily[k];
  return out;
}

export function useExam() {
  return useContext(Ctx);
}

// תוכנית היום כפי שנשמרה (או מחושבת אם עוד לא)
export function useToday() {
  const ex = useExam();
  if (!ex?.state) return null;
  const { state, today } = ex;
  const saved = today >= startOf(state) ? state.daily?.[today] : null;
  const plan = saved?.plan || planForDay(state, today);
  const done = saved?.done || {};
  const off = state.settings.offDays.includes(today);
  return { plan, done, off, finished: plan.tasks.filter((t) => done[t.id]).length, total: plan.tasks.length };
}
