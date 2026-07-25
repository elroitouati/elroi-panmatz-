import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { loadState, saveState } from '../storage';
import {
  DEFAULT_STAGES,
  DEFAULT_GOALS,
  DEFAULT_PSYCH_LINKS,
  DEFAULT_PSYCH_WEEKLY_TARGET,
} from '../data/defaults';
import { todayKey } from '../utils/date';
import { bumpedCurrent, loweredCurrent, atStart, reachedFinal, isNewPersonalBest } from '../utils/fitness';
import {
  ensurePermissions,
  scheduleDailyTrainingReminders,
  cancelTrainingReminders,
  sendReinforcement,
} from '../notifications';

const AppContext = createContext(null);

function freshState() {
  return {
    stages: DEFAULT_STAGES.map((s) => ({ ...s })),
    goals: DEFAULT_GOALS.map((g) => ({ ...g, trainingDays: [...g.trainingDays], history: [] })),
    logs: {}, // { 'YYYY-MM-DD': { trained, goals: { id: {done, value} } } }
    psych: {
      links: DEFAULT_PSYCH_LINKS.map((l) => ({ ...l })),
      weeklyTarget: DEFAULT_PSYCH_WEEKLY_TARGET,
      practiceDays: [],
    },
    settings: {
      notificationsEnabled: true,
      reminderHour: 18,
      reminderMinute: 0,
    },
  };
}

// מיזוג בטוח — מבטיח שכל המפתחות קיימים גם אחרי עדכוני גרסה
function normalize(loaded) {
  const base = freshState();
  if (!loaded) return base;
  return {
    stages: Array.isArray(loaded.stages) && loaded.stages.length ? loaded.stages : base.stages,
    goals: Array.isArray(loaded.goals) && loaded.goals.length ? loaded.goals : base.goals,
    logs: loaded.logs || {},
    psych: {
      links: loaded.psych?.links?.length ? loaded.psych.links : base.psych.links,
      weeklyTarget: loaded.psych?.weeklyTarget ?? base.psych.weeklyTarget,
      practiceDays: loaded.psych?.practiceDays || [],
    },
    settings: { ...base.settings, ...(loaded.settings || {}) },
  };
}

export function AppProvider({ children }) {
  const [state, setState] = useState(null); // null עד שנטען
  const [celebration, setCelebration] = useState(null); // יעד שהגיע ליעד סופי
  const [toast, setToast] = useState(null); // הודעת חיזוק קצרה בתוך האפליקציה
  const loadedRef = useRef(false);

  // טעינה ראשונית
  useEffect(() => {
    (async () => {
      const loaded = await loadState();
      setState(normalize(loaded));
      loadedRef.current = true;
    })();
  }, []);

  // שמירה בכל שינוי
  useEffect(() => {
    if (state && loadedRef.current) saveState(state);
  }, [state]);

  // סנכרון תזכורות אימון עם ימי האימון והעדפות
  useEffect(() => {
    if (!state) return;
    (async () => {
      if (!state.settings.notificationsEnabled) {
        await cancelTrainingReminders();
        return;
      }
      const granted = await ensurePermissions();
      if (!granted) return;
      // איחוד כל ימי האימון של היעדים הפעילים
      const days = new Set();
      state.goals.forEach((g) => {
        if (g.enabled) g.trainingDays.forEach((d) => days.add(d));
      });
      await scheduleDailyTrainingReminders(
        [...days],
        state.settings.reminderHour,
        state.settings.reminderMinute
      );
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    state?.settings.notificationsEnabled,
    state?.settings.reminderHour,
    state?.settings.reminderMinute,
    // חתימה של ימי האימון של יעדים פעילים
    state?.goals.map((g) => (g.enabled ? g.trainingDays.join('') : '')).join('|'),
  ]);

  const flash = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  // ---- פעולות שלבים ----
  const setStageDate = (stageId, dateKey) => {
    setState((s) => ({
      ...s,
      stages: s.stages.map((st) => (st.id === stageId ? { ...st, date: dateKey } : st)),
    }));
  };

  // ---- פעולות יעדי כושר ----
  const updateGoal = (id, patch) => {
    setState((s) => ({
      ...s,
      goals: s.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)),
    }));
  };

  const toggleGoalEnabled = (id) => {
    setState((s) => ({
      ...s,
      goals: s.goals.map((g) => (g.id === id ? { ...g, enabled: !g.enabled } : g)),
    }));
  };

  const renameGoal = (id, name) => updateGoal(id, { name });

  const setGoalTrainingDays = (id, days) =>
    updateGoal(id, { trainingDays: [...days].sort((a, b) => a - b) });

  const addGoal = (partial) => {
    const id = `goal-${Date.now()}`;
    const goal = {
      id,
      name: partial.name || 'יעד חדש',
      category: partial.category || 'calisthenics',
      tracking: partial.tracking || 'check',
      unit: partial.unit || '',
      enabled: true,
      emphasis: false,
      start: partial.start ?? 0,
      current: partial.current ?? partial.start ?? 0,
      final: partial.final ?? 0,
      step: partial.step ?? 1,
      lowerIsBetter: partial.lowerIsBetter ?? false,
      maintenance: false,
      trainingDays: partial.trainingDays || [0, 1, 2, 3, 4],
      history: [],
    };
    setState((s) => ({ ...s, goals: [...s.goals, goal] }));
    return id;
  };

  const deleteGoal = (id) => {
    setState((s) => ({ ...s, goals: s.goals.filter((g) => g.id !== id) }));
  };

  // "קל לי" — העלאת היעד הנוכחי בהדרגה; החזרת סוג האירוע להצגה
  const bumpGoal = (id) => {
    let event = 'up';
    setState((s) => {
      const goals = s.goals.map((g) => {
        if (g.id !== id) return g;
        if (g.maintenance || reachedFinal(g)) {
          event = 'maintenance';
          return { ...g, maintenance: true };
        }
        const next = bumpedCurrent(g);
        const nowFinal = g.lowerIsBetter ? next <= g.final : next >= g.final;
        if (nowFinal) {
          event = 'final';
          return { ...g, current: g.final, maintenance: true };
        }
        event = 'up';
        return { ...g, current: next };
      });
      return { ...s, goals };
    });
    // תופעות לוואי לפי סוג האירוע
    const goal = state.goals.find((g) => g.id === id);
    if (event === 'final') {
      setCelebration(goal ? { ...goal } : { name: 'יעד' });
      sendReinforcement('הגעת ליעד הסופי! 🏅', `${goal?.name || 'יעד'} עבר למצב תחזוקה — כל הכבוד!`);
    } else if (event === 'up') {
      flash('שדרוג יעד! היעד היומי עלה 📈');
      sendReinforcement('שדרוג יעד 📈', `העלית את היעד היומי ב${goal?.name || 'יעד'}.`);
    } else if (event === 'maintenance') {
      flash('היעד כבר במצב תחזוקה — ממשיכים לשמר 💪');
    }
    return event;
  };

  // "קשה לי" — הורדת היעד הנוכחי בהדרגה (יציאה ממצב תחזוקה אם צריך)
  const lowerGoal = (id) => {
    let event = 'down';
    setState((s) => {
      const goals = s.goals.map((g) => {
        if (g.id !== id) return g;
        if (atStart(g)) {
          event = 'min';
          return g;
        }
        event = 'down';
        return { ...g, current: loweredCurrent(g), maintenance: false };
      });
      return { ...s, goals };
    });
    if (event === 'down') flash('הורדת רמה — ממשיכים בקצב שנוח לך 👍');
    else flash('כבר ברמת הבסיס של היעד');
    return event;
  };

  // סימון ביצוע יעד היום — כולל שמירת ערך נמדד והיסטוריה לגרף
  const markGoalToday = (id, value) => {
    const key = todayKey();
    let pb = false;
    setState((s) => {
      const goal = s.goals.find((g) => g.id === id);
      const log = s.logs[key] || { trained: false, goals: {} };
      const goalsLog = { ...(log.goals || {}) };
      goalsLog[id] = { done: true, value: value ?? null };

      let goals = s.goals;
      if (goal && goal.tracking === 'measured' && value != null) {
        pb = isNewPersonalBest(goal, value);
        goals = s.goals.map((g) =>
          g.id === id
            ? { ...g, history: [...g.history, { date: key, value }].slice(-120) }
            : g
        );
      }
      return {
        ...s,
        goals,
        logs: { ...s.logs, [key]: { ...log, trained: true, goals: goalsLog } },
      };
    });
    if (pb) {
      flash('שיא אישי חדש! 🔥');
      const goal = state.goals.find((g) => g.id === id);
      sendReinforcement('שיא אישי חדש 🔥', `רשמת שיא חדש ב${goal?.name || 'יעד'}. ממשיכים לטפס!`);
    }
  };

  const unmarkGoalToday = (id) => {
    const key = todayKey();
    setState((s) => {
      const log = s.logs[key];
      if (!log) return s;
      const goalsLog = { ...(log.goals || {}) };
      delete goalsLog[id];
      const stillTrained = Object.values(goalsLog).some((v) => v.done);
      return {
        ...s,
        logs: { ...s.logs, [key]: { ...log, trained: stillTrained, goals: goalsLog } },
      };
    });
  };

  // סימון/ביטול "התאמנתי" ליום ספציפי (משמש בלוח)
  const setDayTrained = (dateKey, trained) => {
    setState((s) => {
      const log = s.logs[dateKey] || { trained: false, goals: {} };
      return { ...s, logs: { ...s.logs, [dateKey]: { ...log, trained } } };
    });
  };

  // ---- פסיכוטכני ----
  const markPsychToday = () => {
    const key = todayKey();
    setState((s) => {
      if (s.psych.practiceDays.includes(key)) return s;
      return { ...s, psych: { ...s.psych, practiceDays: [...s.psych.practiceDays, key] } };
    });
  };

  const unmarkPsychToday = () => {
    const key = todayKey();
    setState((s) => ({
      ...s,
      psych: { ...s.psych, practiceDays: s.psych.practiceDays.filter((d) => d !== key) },
    }));
  };

  const setPsychWeeklyTarget = (n) => {
    setState((s) => ({ ...s, psych: { ...s.psych, weeklyTarget: Math.max(1, n) } }));
  };

  // ---- הגדרות ----
  const updateSettings = (patch) => {
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  };

  const value = {
    state,
    celebration,
    dismissCelebration: () => setCelebration(null),
    toast,
    // שלבים
    setStageDate,
    // יעדים
    updateGoal,
    toggleGoalEnabled,
    renameGoal,
    setGoalTrainingDays,
    addGoal,
    deleteGoal,
    bumpGoal,
    lowerGoal,
    markGoalToday,
    unmarkGoalToday,
    setDayTrained,
    // פסיכוטכני
    markPsychToday,
    unmarkPsychToday,
    setPsychWeeklyTarget,
    // הגדרות
    updateSettings,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
