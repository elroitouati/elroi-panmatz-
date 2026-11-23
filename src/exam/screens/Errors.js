import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Press from '../../components/Press';
import { FocusBar } from '../components/Page';
import { useX, Btn, SectionTitle, font } from '../ui';
import { useExam } from '../ExamContext';
import { openErrors, REASONS, fmtDay } from '../engine/brain';
import { TOPICS } from '../topics';
import { makeQuestion } from '../gen';

// ============================================================================
//  מחברת הטעויות: כל שאלה שטעית בה, לפי נושא. שאלה יוצאת מהמחברת רק אחרי
//  שתי תשובות נכונות ברצף (חזרה מרווחת על טעויות).
// ============================================================================

const REASON = Object.fromEntries(REASONS.map((r) => [r.id, r]));

export default function Errors({ navigation }) {
  const { c, t } = useX();
  const insets = useSafeAreaInsets();
  const { state } = useExam();
  const errs = openErrors(state);
  const groups = TOPICS.map((tp) => ({ tp, list: errs.filter((e) => e.topic === tp.id) })).filter((g) => g.list.length);

  return (
    <View style={{ flex: 1, backgroundColor: c.paper }}>
      <FocusBar onClose={() => navigation.goBack()} title="מחברת הטעויות" closeIcon="arrow-forward" />
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: insets.bottom + 110 }} showsVerticalScrollIndicator={false}>
        {!errs.length ? (
          <View style={{ alignItems: 'center', paddingVertical: 60, gap: 10 }}>
            <Ionicons name="checkmark-done-circle-outline" size={56} color={c.steel} />
            <Text style={[t.h3, { textAlign: 'center' }]}>המחברת ריקה</Text>
            <Text style={[t.bodyDim, { textAlign: 'center' }]}>כל שאלה שתטעה בה תיכנס לכאן עם ההסבר שלה.</Text>
          </View>
        ) : groups.map(({ tp, list }) => (
          <View key={tp.id}>
            <SectionTitle>{tp.name} · {list.length}</SectionTitle>
            <View style={{ backgroundColor: c.surface, borderRadius: 22, paddingVertical: 6 }}>
              {list.map((e, i) => {
                const q = makeQuestion(e);
                const r = REASON[e.reason];
                return (
                  <Press key={e.qid} scaleTo={1} pressedStyle={{ backgroundColor: c.pressed }} accessibilityLabel={`טעות ב${tp.name}`}
                    onPress={() => navigation.navigate('Review', { items: list.map((x) => ({ ...x })), at: i })}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 18, borderTopWidth: i ? 1 : 0, borderColor: c.mist }}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={t.strong} numberOfLines={1}>{q.word || q.pair || q.prompt.split('\n')[0]}</Text>
                      <Text style={t.sub} numberOfLines={1}>{fmtDay(e.at)}{r ? ` · ${r.label}` : ''}{e.streak ? ' · נכון פעם אחת' : ''}</Text>
                    </View>
                    <Ionicons name="chevron-back" size={20} color={c.steel} />
                  </Press>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
      {errs.length ? (
        <View style={{ position: 'absolute', start: 0, end: 0, bottom: 0, paddingHorizontal: 18, paddingTop: 10, paddingBottom: insets.bottom + 14, backgroundColor: c.paper, borderTopWidth: 1, borderColor: c.mist }}>
          <Btn label={`תרגול הטעויות · ${Math.min(10, errs.length)} שאלות`} icon="refresh" onPress={() => navigation.navigate('Quiz', { mode: 'errors', count: 10 })} />
        </View>
      ) : null}
    </View>
  );
}
