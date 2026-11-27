import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Flow from '../../components/Flow';
import Press from '../../components/Press';
import { FocusBar } from '../components/Page';
import QuestionView from '../components/QuestionView';
import ExamSheet from '../components/ExamSheet';
import { useX, Btn, Bar, ON_FLOW, font, useContentWidth, useKeys } from '../ui';
import { useExam } from '../ExamContext';
import { SIM_SECTIONS, TOPIC } from '../topics';
import { seedFrom } from '../gen/rng';
import { makeQuestion } from '../gen';
import { fmtClock } from './Quiz';
import { dir } from '../../design/rtl';
import { haptic } from '../../design/haptics';

// ============================================================================
//  סימולציה מלאה: 8 פרקים, זמן נפרד לכל פרק, בלי משוב עד הסוף.
//  בתוך פרק אפשר לחזור לשאלות; כשהזמן נגמר — עוברים לפרק הבא.
//  ההתקדמות נשמרת אחרי כל תשובה — אפשר לעצור ולהמשיך מאותה נקודה.
// ============================================================================

function freshSim() {
  const startedAt = Date.now();
  return {
    startedAt, section: 0, phase: 'intro', qIdx: 0, secElapsed: 0,
    items: SIM_SECTIONS.map((sec) => Array.from({ length: sec.count }, (_, i) => ({ topic: sec.topic, sub: null, seed: seedFrom('sim', startedAt, sec.topic, i) }))),
    answers: SIM_SECTIONS.map((sec) => Array.from({ length: sec.count }, () => ({ chosen: null, ms: 0, first: null, changes: 0 }))),
    meta: [],
  };
}

export default function Sim({ navigation, route }) {
  const { c, t } = useX();
  const width = useContentWidth();
  const insets = useSafeAreaInsets();
  const ex = useExam();
  const [sim, setSim] = useState(() => (route.params?.resume && ex.state.activeSim ? ex.state.activeSim : freshSim()));
  const [now, setNow] = useState(Date.now());
  const [exitOpen, setExitOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  const runStart = useRef(Date.now());
  const qStart = useRef(Date.now());
  const done = useRef(false);
  const scroll = useRef(null);

  const sec = SIM_SECTIONS[sim.section];
  const limit = sec.minutes * 60000;
  const used = sim.phase === 'run' ? sim.secElapsed + (now - runStart.current) : sim.secElapsed;
  const left = limit - used;

  useEffect(() => { const iv = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(iv); }, []);
  useEffect(() => { if (!done.current) ex.saveSim(sim); }, [sim]);
  useEffect(() => { if (sim.phase === 'run' && left <= 0) endSection(true); }, [left <= 0]);
  useEffect(() => navigation.addListener('beforeRemove', (e) => {
    if (done.current) return;
    e.preventDefault();
    setExitOpen(true);
  }), [navigation]);

  const questions = useMemo(() => sim.items[sim.section].map((it) => makeQuestion(it)), [sim.section, sim.startedAt]);
  const q = questions[sim.qIdx];
  const a = sim.answers[sim.section][sim.qIdx];

  const snapshot = (s) => {
    // רושם זמן לשאלה הנוכחית ולפרק
    const t0 = Date.now();
    const dq = t0 - qStart.current;
    const dsec = t0 - runStart.current;
    qStart.current = t0; runStart.current = t0;
    const answers = s.answers.map((arr, si) => (si === s.section ? arr.map((x, k) => (k === s.qIdx ? { ...x, ms: x.ms + dq } : x)) : arr));
    return { ...s, answers, secElapsed: s.secElapsed + dsec };
  };

  const begin = () => {
    haptic.light();
    runStart.current = Date.now(); qStart.current = Date.now();
    setSim((s) => ({ ...s, phase: 'run', qIdx: 0 }));
  };

  const choose = (i) => {
    setSim((s) => ({
      ...s,
      answers: s.answers.map((arr, si) => (si === s.section ? arr.map((x, k) => (k === s.qIdx ? { ...x, chosen: i, first: x.first ?? i, changes: x.chosen != null && x.chosen !== i ? x.changes + 1 : x.changes } : x)) : arr)),
    }));
  };

  const move = (d) => {
    setSim((s) => ({ ...snapshot(s), qIdx: Math.max(0, Math.min(sec.count - 1, s.qIdx + d)) }));
    scroll.current?.scrollTo({ y: 0, animated: false });
  };

  function endSection(timeUp) {
    setEndOpen(false);
    setSim((s0) => {
      const s = snapshot(s0);
      const arr = s.answers[s.section];
      const qs = s.items[s.section].map((it) => makeQuestion(it));
      const ok = arr.filter((x, k) => x.chosen === qs[k].answer).length;
      const meta = [...s.meta, { topic: SIM_SECTIONS[s.section].topic, n: arr.length, ok, ms: Math.min(s.secElapsed, SIM_SECTIONS[s.section].minutes * 60000) }];
      if (s.section === SIM_SECTIONS.length - 1) {
        setTimeout(() => finishAll({ ...s, meta }), 0);
        return { ...s, meta };
      }
      haptic.success();
      return { ...s, meta, section: s.section + 1, phase: 'intro', qIdx: 0, secElapsed: 0 };
    });
  }

  function finishAll(s) {
    if (done.current) return;
    done.current = true;
    const items = [];
    s.items.forEach((arr, si) => arr.forEach((it, k) => {
      const q2 = makeQuestion(it);
      const x = s.answers[si][k];
      items.push({ topic: it.topic, sub: q2.sub, seed: it.seed, ref: q2.ref, qid: q2.id, chosen: x.chosen, ok: x.chosen === q2.answer, ms: x.ms, changes: x.changes, firstOk: x.first == null ? null : x.first === q2.answer });
    }));
    const id = ex.recordSession({ mode: 'sim', items, durationMs: s.meta.reduce((sum, m) => sum + m.ms, 0), taskId: route.params?.taskId || (ex.state.daily?.[ex.today]?.plan?.tasks?.some((x) => x.id === 'sim') ? 'sim' : null), sections: s.meta });
    navigation.replace('Results', { sessionId: id });
  }

  const pause = () => {
    setExitOpen(false);
    const s = sim.phase === 'run' ? snapshot(sim) : sim;
    ex.saveSim({ ...s, phase: 'intro' === s.phase ? 'intro' : 'run' });
    done.current = true;
    navigation.goBack();
  };
  const cancel = () => {
    setExitOpen(false);
    done.current = true;
    ex.saveSim(null);
    navigation.goBack();
  };

  // בכניסה מחדש לפרק שהתחיל — השעון ממשיך מהמקום שנשמר
  useEffect(() => { runStart.current = Date.now(); qStart.current = Date.now(); }, []);

  const unanswered = sim.answers[sim.section].filter((x) => x.chosen == null).length;

  // מקלדת: 1–4 בוחרים, Enter / חץ שמאלה = הבאה, חץ ימינה = הקודמת
  useKeys((k) => {
    if (exitOpen || endOpen) return false;
    if (sim.phase === 'intro') { if (k === 'Enter') { begin(); return true; } return false; }
    if (['1', '2', '3', '4'].includes(k)) { choose(Number(k) - 1); return true; }
    if (k === 'Enter' || k === 'ArrowLeft') {
      if (sim.qIdx === sec.count - 1) { if (unanswered) setEndOpen(true); else endSection(false); } else move(1);
      return true;
    }
    if (k === 'ArrowRight') { move(-1); return true; }
    return false;
  });
  const warn = left < 5 * 60000;

  if (sim.phase === 'intro') {
    const totalQ = SIM_SECTIONS.reduce((s, x) => s + x.count, 0);
    return (
      <View style={{ flex: 1, backgroundColor: c.paper }}>
        <FocusBar onClose={() => setExitOpen(true)} title="סימולציה מלאה" />
        <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: insets.bottom + 30 }}>
          <Flow variant="exam" style={{ padding: 22 }}>
            <Text style={{ fontFamily: font.m, fontSize: 15, color: ON_FLOW.dim, textAlign: dir.start }}>פרק {sim.section + 1} מתוך {SIM_SECTIONS.length}</Text>
            <Text style={{ fontFamily: font.h, fontSize: 30, lineHeight: 36, color: ON_FLOW.ink, marginTop: 4, textAlign: dir.start }}>{TOPIC[sec.topic].name}</Text>
            <Text style={{ fontFamily: font.r, fontSize: 17, lineHeight: 25, color: ON_FLOW.dim, marginTop: 6, textAlign: dir.start }}>
              {sec.count} שאלות · {sec.minutes} דקות. {sim.secElapsed ? 'ממשיכים מאיפה שעצרת.' : 'השעון מתחיל כשלוחצים.'}
            </Text>
            <Btn variant="flow" label={sim.secElapsed ? 'להמשיך בפרק' : 'התחל פרק'} icon="play" onPress={begin} style={{ marginTop: 20 }} />
          </Flow>
          {sim.section === 0 && !sim.secElapsed ? (
            // תנאי המבחן של תיל: במחשב, שני דפי טיוטה ריקים, בלי טלפון ובלי עוד לשוניות
            <View style={{ backgroundColor: c.surface, borderRadius: 22, padding: 16, marginTop: 14, gap: 8 }}>
              <Text style={t.strong}>כמו ביום המבחן</Text>
              {['במחשב, לא בטלפון — המבחן עצמו רק במחשב', 'שני דפי טיוטה ריקים ועט — לא יותר', 'הטלפון כבוי ומחוץ לחדר', 'חדר סגור, ובדפדפן רק הלשונית הזאת'].map((x) => (
                <View key={x} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                  <Ionicons name="checkmark" size={18} color={c.deep} style={{ marginTop: 3 }} />
                  <Text style={[t.body, { flex: 1 }]}>{x}</Text>
                </View>
              ))}
            </View>
          ) : null}
          <View style={{ backgroundColor: c.surface, borderRadius: 22, paddingVertical: 6, marginTop: 14 }}>
            {SIM_SECTIONS.map((s, i) => {
              const m = sim.meta[i];
              return (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 18, borderTopWidth: i ? 1 : 0, borderColor: c.mist, opacity: i < sim.section ? 0.55 : 1 }}>
                  <Ionicons name={i < sim.section ? 'checkmark-circle' : i === sim.section ? 'ellipse' : 'ellipse-outline'} size={20} color={i === sim.section ? c.deep : c.steel} />
                  <Text style={[t.strong, { flex: 1, fontSize: 17 }]}>{TOPIC[s.topic].name}</Text>
                  <Text style={[t.sub, { fontFamily: font.b }]}>{m ? 'הושלם' : `${s.count} · ${s.minutes} דק׳`}</Text>
                </View>
              );
            })}
          </View>
          <Text style={[t.sub, { marginTop: 12, marginHorizontal: 4 }]}>{totalQ} שאלות, 3 שעות. בלי מחשבון. אין משוב עד הסוף — בדיוק כמו במבחן.</Text>
        </ScrollView>
        <SimExit c={c} open={exitOpen} onClose={() => setExitOpen(false)} onPause={pause} onCancel={cancel} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.paper }}>
      <FocusBar onClose={() => setExitOpen(true)} title={`${TOPIC[sec.topic].short} · ${sim.qIdx + 1}/${sec.count}`}
        right={(
          <View style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: warn ? c.deep : c.deepSoft }}>
            <Text style={{ fontFamily: font.b, fontSize: 17, color: warn ? c.onDeep : c.ink, fontVariant: ['tabular-nums'] }}>{fmtClock(left)}</Text>
          </View>
        )} />
      <View style={{ paddingHorizontal: 18, marginBottom: 6 }}><Bar value={(sim.qIdx + 1) / sec.count} height={5} /></View>
      <ScrollView ref={scroll} contentContainerStyle={{ padding: 18, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <QuestionView q={q} chosen={a.chosen} onChoose={choose} width={width - 36} wide={width >= 720} />
      </ScrollView>
      <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 18, paddingTop: 10, paddingBottom: insets.bottom + 14, borderTopWidth: 1, borderColor: c.mist }}>
        <Btn wrapStyle={{ flex: 1 }} variant="line" label="הקודמת" disabled={sim.qIdx === 0} onPress={() => move(-1)} />
        {sim.qIdx === sec.count - 1 ? (
          <Btn wrapStyle={{ flex: 2 }} label="סיום הפרק" onPress={() => (unanswered ? setEndOpen(true) : endSection(false))} />
        ) : (
          <Btn wrapStyle={{ flex: 2 }} label={a.chosen == null ? 'דילוג' : 'הבאה'} variant={a.chosen == null ? 'line' : 'primary'} onPress={() => move(1)} />
        )}
      </View>
      <ExamSheet visible={endOpen} onClose={() => setEndOpen(false)} title="לסיים את הפרק?"
        body={`${unanswered} שאלות בלי תשובה. במבחן אין קנס על ניחוש — עדיף לסמן משהו.`}
        primary="סיום הפרק" onPrimary={() => endSection(false)} secondary="לחזור לשאלות" />
      <SimExit c={c} open={exitOpen} onClose={() => setExitOpen(false)} onPause={pause} onCancel={cancel} />
    </View>
  );
}

function SimExit({ open, onClose, onPause, onCancel, c }) {
  return (
    <ExamSheet visible={open} onClose={onClose} title="לעצור את הסימולציה?" body="ההתקדמות נשמרת — אפשר להמשיך מאותה שאלה, מהיום או מהתרגול."
      primary="עצירה ושמירה" onPrimary={onPause} secondary="להמשיך"
      footer={(
        <Press onPress={onCancel} accessibilityLabel="ביטול הסימולציה" style={{ alignSelf: 'center', paddingVertical: 12, marginTop: 6 }}>
          <Text style={{ fontFamily: font.b, fontSize: 16, color: c.bad }}>ביטול הסימולציה (בלי שמירה)</Text>
        </Press>
      )} />
  );
}
