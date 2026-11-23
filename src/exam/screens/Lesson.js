import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, useReducedMotion } from 'react-native-reanimated';
import Press from '../../components/Press';
import { FocusBar } from '../components/Page';
import { useX, Btn, font, useContentWidth, useKeys } from '../ui';
import { useExam } from '../ExamContext';
import { TOPIC } from '../topics';
import { LESSONS } from '../data/lessons';
import { Sequence, FigureCell, Matrix, TechDiagram, ChartView } from '../components/Visuals';
import { figuresQuestion } from '../gen/figures';
import { LETTERS } from '../components/QuestionView';
import { ease, keep } from '../../design/tokens';
import { IS_RTL } from '../../design/rtl';
import { haptic } from '../../design/haptics';

// ============================================================================
//  שיעור בשקופיות: נקודות התקדמות, שקופית שנכנסת מכיוון הקריאה (220ms),
//  ובסוף בדיקה עצמית עם משוב. השיעור הוא מקום קבוע לחזור אליו — הוא לא
//  מחליף תרגול; בסופו "לתרגול".
// ============================================================================

const LTR_ROW = IS_RTL ? 'row-reverse' : 'row';

function Diagram({ d, width }) {
  const { c, t } = useX();
  if (!d) return null;
  const box = { backgroundColor: c.surface, borderRadius: 20, padding: 18, marginVertical: 6, marginBottom: 16 };
  switch (d.kind) {
    case 'seq': return <View style={{ marginBottom: 16 }}><Sequence items={d.items} notes={d.notes} /></View>;
    case 'pair': return (
      <View style={[box, { alignItems: 'center', gap: 6 }]}>
        <Text style={{ fontFamily: font.h, fontSize: 30, color: c.ink }}>{d.a}</Text>
        <Ionicons name="arrow-down" size={22} color={c.steel} />
        <Text style={{ fontFamily: font.h, fontSize: 26, color: c.deep }}>{d.b}</Text>
      </View>
    );
    case 'word': return (
      <View style={box}>
        <Text style={{ fontFamily: font.h, fontSize: 36, color: c.ink, textAlign: 'center', marginBottom: 12 }}>{d.word}</Text>
        {d.options.map((o, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 }}>
            <View style={{ width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: i === d.answer ? c.ok : c.deepSoft }}>
              <Text style={{ fontFamily: font.b, color: i === d.answer ? '#fff' : c.slate }}>{LETTERS[i]}</Text>
            </View>
            <Text style={[t.body, i === d.answer && { fontFamily: font.b, color: c.ok }]}>{o}</Text>
          </View>
        ))}
      </View>
    );
    case 'figop': return (
      <View style={[box, { flexDirection: LTR_ROW, alignItems: 'center', justifyContent: 'center', gap: 6 }]}>
        <FigureCell cell={{ t: 'spokes', s: d.a }} size={70} />
        <Text style={{ fontFamily: font.h, fontSize: 28, color: c.steel }}>{d.op}</Text>
        <FigureCell cell={{ t: 'spokes', s: d.b }} size={70} />
        <Text style={{ fontFamily: font.h, fontSize: 28, color: c.steel }}>=</Text>
        <FigureCell cell={{ t: 'spokes', s: d.c }} size={70} />
      </View>
    );
    case 'rotate': return (
      <View style={[box, { flexDirection: LTR_ROW, alignItems: 'center', justifyContent: 'center', gap: 8 }]}>
        {d.angles.map((a, i) => (
          <React.Fragment key={i}>
            {i ? <Ionicons name="arrow-forward" size={20} color={c.steel} /> : null}
            <FigureCell cell={{ t: 'arrow', a }} size={70} />
          </React.Fragment>
        ))}
      </View>
    );
    case 'matrix-hint': {
      const q = figuresQuestion(7, 'union');
      return <View style={{ marginBottom: 16 }}><Matrix cells={q.matrix} width={Math.min(width, 280)} /></View>;
    }
    case 'gears': return <View style={{ marginBottom: 16 }}><TechDiagram d={{ type: 'gears', teeth: d.teeth, first: d.first, ask: d.ask }} width={Math.min(width, 340)} /></View>;
    case 'lever': return <View style={{ marginBottom: 16 }}><TechDiagram d={{ type: 'lever', w: d.w, d1: d.d1, d2: d.d2 }} width={Math.min(width, 340)} /></View>;
    case 'pulley': return <View style={{ marginBottom: 16 }}><TechDiagram d={{ type: 'pulley', n: d.n, w: d.w }} width={Math.min(width, 340)} /></View>;
    case 'bars': return <View style={{ marginBottom: 16 }}><ChartView chart={{ type: 'bar', title: 'דוגמה', labels: d.labels, values: d.values, step: 10 }} width={Math.min(width - 24, 320)} height={180} /></View>;
    case 'slots': return (
      <View style={[box, { flexDirection: 'row', justifyContent: 'center', gap: 8 }]}>
        {d.items.map((x, i) => (
          <View key={i} style={{ alignItems: 'center', gap: 4 }}>
            <View style={{ width: 62, height: 46, borderRadius: 12, borderWidth: 1.5, borderColor: x === '?' ? c.mist : c.deep, backgroundColor: x === '?' ? c.paper : c.deepSoft, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontFamily: font.b, fontSize: 16, color: x === '?' ? c.steel : c.deep }}>{x}</Text>
            </View>
            <Text style={{ fontFamily: font.m, fontSize: 14, color: c.slate }}>{i + 1}</Text>
          </View>
        ))}
      </View>
    );
    default: return null;
  }
}

export default function Lesson({ navigation, route }) {
  const { c, t } = useX();
  const width = useContentWidth();
  const insets = useSafeAreaInsets();
  const { state, today, setLesson, markTask } = useExam();
  const { topic, start = 0, taskId, peek } = route.params || {};
  const L = LESSONS[topic] || [];
  const [i, setI] = useState(Math.min(start, L.length - 1));
  const [pick, setPick] = useState(null);
  const reduced = useReducedMotion();
  const x = useSharedValue(0);
  const o = useSharedValue(1);
  const scroll = useRef(null);
  const slide = L[i];

  useEffect(() => {
    const prev = state.lessons[topic]?.step || 0;
    if (i + 1 > prev) setLesson(topic, { step: i + 1 });
    if (i === L.length - 1 && !state.lessons[topic]?.done) {
      setLesson(topic, { done: true, at: today, step: L.length });
    }
    if (i === L.length - 1 && taskId) markTask(taskId);
  }, [i]);

  const go = (n) => {
    if (n < 0 || n >= L.length) return;
    // קדימה: השקופית החדשה נכנסת מכיוון הקריאה (משמאל בעברית)
    const forward = n > i;
    const sign = (IS_RTL ? -1 : 1) * (forward ? 1 : -1);
    x.value = reduced ? 0 : 28 * sign;
    o.value = 0;
    x.value = withTiming(0, { duration: 220, easing: ease.out });
    o.value = withTiming(1, { duration: 220, easing: ease.out, ...keep });
    setPick(null);
    setI(n);
    scroll.current?.scrollTo({ y: 0, animated: false });
  };
  const st = useAnimatedStyle(() => ({ opacity: o.value, transform: [{ translateX: x.value }] }));
  // מקלדת: חץ שמאלה = הבא (כיוון הקריאה), חץ ימינה = הקודם
  useKeys((k) => {
    if (k === 'ArrowLeft') { go(i + 1); return true; }
    if (k === 'ArrowRight') { go(i - 1); return true; }
    return false;
  });

  if (!slide) return <View style={{ flex: 1, backgroundColor: c.paper }} />;
  const last = i === L.length - 1;

  return (
    <View style={{ flex: 1, backgroundColor: c.paper }}>
      <FocusBar onClose={() => navigation.goBack()} title={`לימוד · ${TOPIC[topic].name}`} />
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, paddingBottom: 10 }}>
        {L.map((_, k) => (
          <Press key={k} scaleTo={1} onPress={() => go(k)} hitSlop={6} accessibilityLabel={`שלב ${k + 1}`}
            style={{ width: k === i ? 22 : 8, height: 8, borderRadius: 99, backgroundColor: k === i ? c.deep : c.mist }} />
        ))}
      </View>
      <ScrollView ref={scroll} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 6, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <Animated.View style={st}>
          <View style={{ alignSelf: 'flex-start', backgroundColor: c.deepSoft, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 }}>
            <Text style={{ fontFamily: font.b, fontSize: 14, color: c.deep }}>{slide.tag}</Text>
          </View>
          <Text style={[t.h3, { fontSize: 28, lineHeight: 34, marginTop: 12, marginBottom: 10 }]}>{slide.title}</Text>
          {(slide.body || []).map((p, k) => <Text key={k} style={[t.lead, { marginBottom: 12 }]}>{p}</Text>)}
          <Diagram d={slide.diagram} width={width - 40} />
          {slide.steps ? (
            <View style={{ gap: 10 }}>
              {slide.steps.map((s, k) => (
                <View key={k} style={{ flexDirection: 'row', gap: 12, backgroundColor: c.surface, borderRadius: 16, padding: 14 }}>
                  <Text style={{ fontFamily: font.h, fontSize: 19, color: c.steel, width: 20 }}>{k + 1}</Text>
                  <Text style={[t.lead, { flex: 1, fontSize: 18, lineHeight: 27 }]}>{s}</Text>
                </View>
              ))}
            </View>
          ) : null}
          {slide.check ? (
            <View>
              <Text style={[t.lead, { fontFamily: font.b, marginBottom: 12 }]}>{slide.check.q}</Text>
              <View style={{ gap: 10 }}>
                {slide.check.options.map((op, k) => {
                  const showOk = pick != null && k === slide.check.answer;
                  const showBad = pick === k && k !== slide.check.answer;
                  return (
                    <Press key={k} onPress={() => { if (pick != null) return; setPick(k); k === slide.check.answer ? haptic.success() : haptic.error(); }}
                      accessibilityLabel={op}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 58, paddingHorizontal: 16, borderRadius: 16, borderWidth: 1.5,
                        borderColor: showOk ? c.ok : showBad ? c.bad : c.mist, backgroundColor: showOk ? c.okSoft : showBad ? c.badSoft : c.surface }}>
                      <View style={{ width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: showOk ? c.ok : showBad ? c.bad : c.deepSoft }}>
                        <Text style={{ fontFamily: font.b, color: showOk || showBad ? '#fff' : c.slate }}>{LETTERS[k]}</Text>
                      </View>
                      <Text style={[t.body, { flex: 1, fontFamily: font.m, fontSize: 18 }]}>{op}</Text>
                    </Press>
                  );
                })}
              </View>
              {pick != null ? (
                <View style={{ marginTop: 14, borderRadius: 16, padding: 14, backgroundColor: pick === slide.check.answer ? c.okSoft : c.badSoft }}>
                  <Text style={[t.body, { fontFamily: font.m, color: pick === slide.check.answer ? c.ok : c.bad }]}>
                    {pick === slide.check.answer ? 'נכון! ' : 'לא בדיוק. '}{slide.check.explain}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </Animated.View>
      </ScrollView>
      <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 10, paddingBottom: insets.bottom + 14, borderTopWidth: 1, borderColor: c.mist }}>
        <Btn wrapStyle={{ flex: 1 }} variant="line" label="הקודם" disabled={i === 0} onPress={() => go(i - 1)} />
        {last ? (
          <Btn wrapStyle={{ flex: 2 }} label={peek ? 'חזרה לשאלה' : 'לתרגול'} icon={peek ? 'arrow-forward' : 'play'}
            onPress={() => (peek ? navigation.goBack() : navigation.replace('Quiz', { mode: 'topic', topic }))} />
        ) : (
          <Btn wrapStyle={{ flex: 2 }} label="הבא" onPress={() => go(i + 1)} />
        )}
      </View>
    </View>
  );
}
