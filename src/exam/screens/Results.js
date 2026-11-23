import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Flow from '../../components/Flow';
import Press from '../../components/Press';
import Reveal from '../../components/Reveal';
import { FocusBar } from '../components/Page';
import { useX, Btn, Bar, SectionTitle, ON_FLOW, font } from '../ui';
import { useExam } from '../ExamContext';
import { TOPICS, TOPIC } from '../topics';
import { fmtClock } from './Quiz';
import { makeQuestion } from '../gen';
import { dir } from '../../design/rtl';

// ============================================================================
//  תוצאות: הציון, הזמן, פירוק לפי נושא, ורשימת הטעויות — כל אחת נפתחת
//  להסבר ולבחירת "למה טעיתי". סקירת טעויות היא החלק שבו הכי לומדים.
// ============================================================================

const TITLES = { daily: 'תרגול מעורב', topic: 'תרגול נושא', errors: 'חזרה על טעויות', diagnostic: 'אבחון פתיחה', weekly: 'בדיקה שבועית', sim: 'סימולציה מלאה' };

export default function Results({ navigation, route }) {
  const { c, t } = useX();
  const insets = useSafeAreaInsets();
  const { state } = useExam();
  const { sessionId, timeUp } = route.params || {};
  const s = state?.sessions.find((x) => x.id === sessionId);
  if (!s) return <View style={{ flex: 1, backgroundColor: c.paper }} />;

  const answered = s.items.filter((x) => x.chosen != null);
  const pct = Math.round((s.correct / Math.max(1, s.n)) * 100);
  const wrong = s.items.map((x, i) => ({ ...x, i })).filter((x) => !x.ok);
  const per = TOPICS.map((tp) => {
    const list = s.items.filter((x) => x.topic === tp.id);
    return { ...tp, n: list.length, ok: list.filter((x) => x.ok).length };
  }).filter((x) => x.n);
  const unanswered = s.n - answered.length;

  return (
    <View style={{ flex: 1, backgroundColor: c.paper }}>
      <FocusBar onClose={() => navigation.goBack()} title={TITLES[s.mode]} closeIcon="close" />
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: insets.bottom + 110 }} showsVerticalScrollIndicator={false}>
        <Reveal index={0}>
          <Flow variant="exam" style={{ padding: 22 }}>
            <Text style={{ fontFamily: font.m, fontSize: 15, color: ON_FLOW.dim, textAlign: dir.start }}>
              {timeUp ? 'הזמן נגמר' : 'הסתיים'} · {fmtClock(s.durationMs)} דקות
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginTop: 6 }}>
              <Text style={{ fontFamily: font.h, fontSize: 56, lineHeight: 60, color: ON_FLOW.ink, fontVariant: ['tabular-nums'] }}>{pct}<Text style={{ fontSize: 26, color: ON_FLOW.dim }}>%</Text></Text>
              <Text style={{ fontFamily: font.b, fontSize: 18, color: ON_FLOW.dim, marginBottom: 8 }}>{s.correct} מתוך {s.n}</Text>
            </View>
            <Text style={{ fontFamily: font.r, fontSize: 17, lineHeight: 25, color: ON_FLOW.dim, marginTop: 6, textAlign: dir.start }}>
              {unanswered ? `${unanswered} שאלות לא נענו. ` : ''}
              {wrong.length ? `${wrong.length - unanswered > 0 ? wrong.length - unanswered : 0} טעויות נכנסו למחברת — כל אחת תחזור עד שתענה נכון פעמיים.` : 'בלי טעויות. כל הכבוד.'}
            </Text>
          </Flow>
        </Reveal>

        {s.sections ? (
          <Reveal index={1}>
            <SectionTitle>לפי פרק</SectionTitle>
            <View style={{ backgroundColor: c.surface, borderRadius: 22, paddingVertical: 6 }}>
              {s.sections.map((sec, i) => (
                <View key={i} style={{ paddingVertical: 12, paddingHorizontal: 18, borderTopWidth: i ? 1 : 0, borderColor: c.mist }}>
                  <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                    <Text style={[t.strong, { flex: 1, fontSize: 17 }]}>{TOPIC[sec.topic].name}</Text>
                    <Text style={[t.sub, { fontFamily: font.b }]}>{sec.ok}/{sec.n} · {fmtClock(sec.ms)}</Text>
                  </View>
                  <Bar value={sec.ok / Math.max(1, sec.n)} />
                </View>
              ))}
            </View>
          </Reveal>
        ) : per.length > 1 ? (
          <Reveal index={1}>
            <SectionTitle>לפי נושא</SectionTitle>
            <View style={{ backgroundColor: c.surface, borderRadius: 22, paddingVertical: 6 }}>
              {per.map((p, i) => (
                <View key={p.id} style={{ paddingVertical: 12, paddingHorizontal: 18, borderTopWidth: i ? 1 : 0, borderColor: c.mist }}>
                  <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                    <Text style={[t.strong, { flex: 1, fontSize: 17 }]}>{p.name}</Text>
                    <Text style={[t.sub, { fontFamily: font.b }]}>{p.ok}/{p.n}</Text>
                  </View>
                  <Bar value={p.ok / p.n} color={p.ok / p.n >= 0.85 ? c.ok : c.deep} />
                </View>
              ))}
            </View>
          </Reveal>
        ) : null}

        {wrong.length ? (
          <Reveal index={2}>
            <SectionTitle>הטעויות ({wrong.length})</SectionTitle>
            <View style={{ backgroundColor: c.surface, borderRadius: 22, paddingVertical: 6 }}>
              {wrong.slice(0, 40).map((w, k) => {
                const q = makeQuestion(w);
                return (
                  <Press key={w.i} scaleTo={1} pressedStyle={{ backgroundColor: c.pressed }} accessibilityLabel={`טעות ${k + 1}`}
                    onPress={() => navigation.navigate('Review', { sessionId, indices: wrong.map((x) => x.i), at: k })}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 18, borderTopWidth: k ? 1 : 0, borderColor: c.mist }}>
                    <Ionicons name={w.chosen == null ? 'remove-circle-outline' : 'close-circle'} size={22} color={c.bad} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={t.strong} numberOfLines={1}>{TOPIC[w.topic].name}</Text>
                      <Text style={t.sub} numberOfLines={1}>{q.word || q.pair || q.prompt.split('\n')[0]}</Text>
                    </View>
                    <Ionicons name="chevron-back" size={20} color={c.steel} />
                  </Press>
                );
              })}
            </View>
          </Reveal>
        ) : null}
      </ScrollView>
      <View style={{ position: 'absolute', start: 0, end: 0, bottom: 0, paddingHorizontal: 18, paddingTop: 10, paddingBottom: insets.bottom + 14, backgroundColor: c.paper, borderTopWidth: 1, borderColor: c.mist, gap: 10 }}>
        {wrong.length ? <Btn label="סקירת הטעויות" icon="search" onPress={() => navigation.navigate('Review', { sessionId, indices: wrong.map((x) => x.i), at: 0 })} /> : null}
        <Btn label="סיום" variant={wrong.length ? 'line' : 'primary'} onPress={() => navigation.goBack()} />
      </View>
    </View>
  );
}
