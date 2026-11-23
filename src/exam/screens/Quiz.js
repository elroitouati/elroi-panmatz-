import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FocusBar } from '../components/Page';
import QuestionView, { Explain } from '../components/QuestionView';
import ExamSheet from '../components/ExamSheet';
import { useX, Btn, Pill, Bar, font } from '../ui';
import { useExam } from '../ExamContext';
import { makeQuestion } from '../gen';
import { buildDaily, buildTopic, buildDiagnostic, buildWeekly, buildErrors } from '../engine/brain';
import { TOPIC } from '../topics';
import { haptic } from '../../design/haptics';

// ============================================================================
//  מריץ שאלות. שני מצבים:
//  • תרגול (יומי / נושא / טעויות): בוחרים → "בדיקה" → הסבר → "הבא".
//    משוב מיידי עם הסבר = הדרך שבה לומדים מטעות (retrieval + feedback).
//  • מבחן (אבחון / בדיקה שבועית): בלי משוב עד הסוף, שעון יורד בבדיקה.
//  מעבר בין שאלות — מיידי, בלי אנימציה (פעולה של מאות פעמים ביום).
// ============================================================================

const FEEDBACK = { daily: true, topic: true, errors: true };
const TITLES = { daily: 'תרגול מעורב', topic: 'תרגול', errors: 'חזרה על טעויות', diagnostic: 'אבחון פתיחה', weekly: 'בדיקה שבועית' };
const LIMIT_MIN = { weekly: 30 };

export function fmtClock(ms) {
  const s = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

export default function Quiz({ navigation, route }) {
  const { c, t } = useX();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const ex = useExam();
  const { mode = 'daily', taskId, count, topic, sub } = route.params || {};

  const items = useMemo(() => {
    const s = ex.state;
    let list;
    if (mode === 'daily') list = buildDaily(s, ex.today, count || 18);
    else if (mode === 'topic') list = buildTopic(s, topic, sub, count || 10, String(Date.now()));
    else if (mode === 'diagnostic') list = buildDiagnostic();
    else if (mode === 'weekly') list = buildWeekly(ex.today);
    else if (mode === 'errors') list = buildErrors(s, count || 10);
    else list = [];
    return list.map((it) => {
      const q = makeQuestion(it);
      return { ...it, q, qid: q.id, sub: q.sub, ref: q.ref };
    });
  }, []);

  const feedback = !!FEEDBACK[mode];
  const limit = LIMIT_MIN[mode] ? LIMIT_MIN[mode] * 60000 : null;
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState(() => items.map(() => ({ chosen: null, first: null, changes: 0, ms: 0 })));
  const [checked, setChecked] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const [now, setNow] = useState(Date.now());
  const startedAt = useRef(Date.now());
  const qStart = useRef(Date.now());
  const finished = useRef(false);
  const scroll = useRef(null);

  useEffect(() => { const iv = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(iv); }, []);
  const elapsed = now - startedAt.current;
  const left = limit ? limit - elapsed : null;
  useEffect(() => { if (limit && left <= 0 && !finished.current) finish(true); }, [left]);

  // חזרה אחורה במכשיר = אותו אישור יציאה
  useEffect(() => navigation.addListener('beforeRemove', (e) => {
    if (finished.current) return;
    e.preventDefault();
    setExitOpen(true);
  }), [navigation]);

  if (!items.length) {
    return (
      <View style={{ flex: 1, backgroundColor: c.paper }}>
        <FocusBar onClose={() => { finished.current = true; navigation.goBack(); }} title={TITLES[mode]} />
        <View style={{ padding: 24 }}><Text style={t.lead}>אין כרגע שאלות כאן.</Text></View>
      </View>
    );
  }

  const cur = items[idx];
  const a = answers[idx];

  const choose = (i) => {
    setAnswers((arr) => arr.map((x, k) => (k === idx ? { ...x, chosen: i, first: x.first ?? i, changes: x.chosen != null && x.chosen !== i ? x.changes + 1 : x.changes } : x)));
  };

  const stamp = () => {
    const ms = Date.now() - qStart.current;
    qStart.current = Date.now();
    return ms;
  };

  const build = (ansArr) => items.map((it, k) => {
    const x = ansArr[k];
    return {
      topic: it.topic, sub: it.sub, seed: it.seed, ref: it.ref, qid: it.qid, chosen: x.chosen,
      ok: x.chosen === it.q.answer, ms: x.ms, changes: x.changes, firstOk: x.first == null ? null : x.first === it.q.answer,
    };
  });

  // addCurrent: מוסיף את זמן השאלה הנוכחית (כשעוד לא נרשם — במצב מבחן / סוף זמן)
  function finish(timeUp, addCurrent = true) {
    if (finished.current) return;
    finished.current = true;
    const extra = stamp();
    const ansArr = answers.map((x, k) => (k === idx && addCurrent ? { ...x, ms: x.ms + extra } : x));
    const id = ex.recordSession({ mode, items: build(ansArr), durationMs: Date.now() - startedAt.current, taskId, topic, complete: true });
    haptic.success();
    navigation.replace('Results', { sessionId: id, timeUp: !!timeUp });
  }

  const next = () => {
    if (a.chosen == null) return;
    if (feedback && !checked) {
      const ok = a.chosen === cur.q.answer;
      ok ? haptic.success() : haptic.error();
      setAnswers((arr) => arr.map((x, k) => (k === idx ? { ...x, ms: x.ms + stamp() } : x)));
      setChecked(true);
      setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 50);
      return;
    }
    if (idx === items.length - 1) { finish(false, !feedback); return; }
    if (!feedback) setAnswers((arr) => arr.map((x, k) => (k === idx ? { ...x, ms: x.ms + stamp() } : x)));
    setChecked(false);
    setIdx(idx + 1);
    qStart.current = Date.now();
    scroll.current?.scrollTo({ y: 0, animated: false });
  };

  const exit = () => {
    setExitOpen(false);
    finished.current = true;
    const built = build(answers);
    if (built.some((x) => x.chosen != null)) ex.recordSession({ mode, items: built, durationMs: Date.now() - startedAt.current, taskId: null, topic, complete: false });
    navigation.goBack();
  };

  const warn = left != null && left < 5 * 60000;
  const nextLabel = feedback && !checked ? 'בדיקה' : idx === items.length - 1 ? 'סיום' : 'הבא';

  return (
    <View style={{ flex: 1, backgroundColor: c.paper }}>
      <FocusBar
        onClose={() => setExitOpen(true)}
        title={`${idx + 1} / ${items.length}`}
        right={(
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            {feedback ? <Pill label="לימוד" icon="book-outline" onPress={() => navigation.navigate('Lesson', { topic: cur.topic, peek: true })} /> : null}
            <View style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: warn ? c.deep : c.deepSoft }}>
              <Text style={{ fontFamily: font.b, fontSize: 17, color: warn ? c.onDeep : c.ink, fontVariant: ['tabular-nums'] }}>{fmtClock(left != null ? left : elapsed)}</Text>
            </View>
          </View>
        )}
      />
      <View style={{ paddingHorizontal: 18, marginBottom: 6 }}><Bar value={(idx + (checked || !feedback ? 1 : 0)) / items.length} height={5} /></View>
      <ScrollView ref={scroll} contentContainerStyle={{ padding: 18, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <QuestionView q={cur.q} chosen={a.chosen} onChoose={choose} reveal={feedback && checked} width={width - 36} />
        {feedback && checked ? <Explain q={cur.q} ok={a.chosen === cur.q.answer} /> : null}
      </ScrollView>
      <View style={{ paddingHorizontal: 18, paddingTop: 10, paddingBottom: insets.bottom + 14, borderTopWidth: 1, borderColor: c.mist, backgroundColor: c.paper }}>
        <Btn label={nextLabel} onPress={next} disabled={a.chosen == null} />
      </View>
      <ExamSheet
        visible={exitOpen}
        onClose={() => setExitOpen(false)}
        title={feedback ? 'לצאת מהתרגול?' : `לצאת מה${TITLES[mode]}?`}
        body={feedback ? 'התשובות שכבר ענית יישמרו ויעזרו למערכת. המשימה תישאר פתוחה.' : 'התוצאה לא תיחשב כבדיקה מלאה. אפשר להתחיל שוב מאוחר יותר.'}
        primary="יציאה"
        onPrimary={exit}
        secondary="להמשיך"
      />
    </View>
  );
}
