import React, { useState } from 'react';
import { View, Text, ScrollView, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Press from '../../components/Press';
import { Ionicons } from '@expo/vector-icons';
import { FocusBar } from '../components/Page';
import QuestionView, { Explain } from '../components/QuestionView';
import { useX, Btn, Pill, font } from '../ui';
import { useExam } from '../ExamContext';
import { makeQuestion } from '../gen';
import { REASONS } from '../engine/brain';
import { haptic } from '../../design/haptics';

// ============================================================================
//  סקירת טעות: השאלה כפי שהייתה, הבחירה שלך באדום, הנכונה בירוק, ההסבר —
//  ו"למה טעיתי?". הסיבה נשמרת ומשפיעה על ההחלטות של המערכת.
// ============================================================================

export default function Review({ navigation, route }) {
  const { c, t } = useX();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { state, setErrorReason } = useExam();
  const { sessionId, indices = [], at = 0, items: given } = route.params || {};
  const [k, setK] = useState(at);
  const s = sessionId ? state.sessions.find((x) => x.id === sessionId) : null;
  const list = given || (s ? indices.map((i) => s.items[i]) : []);
  const it = list[k];
  if (!it) return <View style={{ flex: 1, backgroundColor: c.paper }} />;
  const q = makeQuestion(it);
  const qid = it.qid || q.id;
  const reason = state.errors[qid]?.reason;
  const inNotebook = !!state.errors[qid];

  return (
    <View style={{ flex: 1, backgroundColor: c.paper }}>
      <FocusBar onClose={() => navigation.goBack()} title={`טעות ${k + 1} מתוך ${list.length}`} closeIcon="arrow-forward"
        right={<Pill label="לימוד" icon="book-outline" onPress={() => navigation.navigate('Lesson', { topic: q.topic, peek: true })} />} />
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
        <QuestionView q={q} chosen={it.chosen} onChoose={() => {}} reveal width={width - 36} />
        {it.chosen == null ? <Text style={[t.sub, { marginTop: 10 }]}>לא נענתה.</Text> : null}
        <Explain q={q} ok={false} />
        {inNotebook ? (
          <>
            <Text style={[t.h2, { marginTop: 22, marginBottom: 10 }]}>למה טעיתי?</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {REASONS.map((r) => (
                <Press key={r.id} scaleTo={0.96} onPress={() => { haptic.selection(); setErrorReason(qid, reason === r.id ? null : r.id); }}
                  accessibilityLabel={r.label} accessibilityState={{ selected: reason === r.id }}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, height: 44, borderRadius: 999, borderWidth: 1,
                    borderColor: reason === r.id ? c.deep : c.mist, backgroundColor: reason === r.id ? c.deep : c.surface }}>
                  <Ionicons name={r.icon} size={18} color={reason === r.id ? c.onDeep : c.deep} />
                  <Text style={{ fontFamily: font.b, fontSize: 15, color: reason === r.id ? c.onDeep : c.ink }}>{r.label}</Text>
                </Press>
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>
      <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 18, paddingTop: 10, paddingBottom: insets.bottom + 14, borderTopWidth: 1, borderColor: c.mist }}>
        <Btn wrapStyle={{ flex: 1 }} variant="line" label="הקודמת" disabled={k === 0} onPress={() => setK(k - 1)} />
        <Btn wrapStyle={{ flex: 2 }} label={k === list.length - 1 ? 'סיום' : 'הבאה'} onPress={() => (k === list.length - 1 ? navigation.goBack() : setK(k + 1))} />
      </View>
    </View>
  );
}
