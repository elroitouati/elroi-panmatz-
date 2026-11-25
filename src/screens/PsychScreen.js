import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Reveal from '../components/Reveal';
import ExamTasksCard from '../components/ExamTasksCard';
import { colors, radius, space } from '../design/tokens';
import { text } from '../design/typography';
import { useExam } from '../exam/ExamContext';
import { pace, PACE_LABEL, fmtDay, fmtWindow } from '../exam/engine/brain';
import { dayDiff } from '../exam/engine/time';

// ============================================================================
//  הטאב "מבחן" בעולם הזית — שער לעולם המבחן. לחיצה על הטאב פותחת ישר את
//  גיליון הכניסה; מי שמגיע לכאן בהחלקה רואה תקציר וכפתור כניסה.
// ============================================================================

export default function PsychScreen() {
  const ex = useExam();
  if (!ex?.state) return null;
  const { state, today } = ex;
  const p = pace(state, today);
  const days = dayDiff(today, state.settings.examDate);

  return (
    <Screen title="מבחן" overline={`פסיכוטכני · ${fmtWindow(state)}`}>
      <Reveal index={0}>
        <ExamTasksCard />
      </Reveal>
      <Reveal index={1}>
        <View style={styles.row}>
          <Stat icon="hourglass-outline" big={String(Math.max(0, days))} label="ימים לחלון המבחן" />
          <Stat icon="pulse-outline" big={state.attempts.length ? `${Math.round(p.now * 100)}%` : '—'} label={state.attempts.length ? PACE_LABEL[p.status] : 'מוכנות'} />
        </View>
        <Text style={[text.caption, styles.note]}>
          מבחן פסיכוטכני ממוחשב · כ־3 שעות · 8 סוגי שאלות. הלימוד, התרגול והסימולציות — בעולם המבחן.
        </Text>
      </Reveal>
    </Screen>
  );
}

function Stat({ icon, big, label }) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={20} color={colors.gold} />
      <Text style={[text.statSm, styles.center]}>{big}</Text>
      <Text style={[text.caption, styles.center]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space[3], marginTop: space[4] },
  stat: { flex: 1, backgroundColor: colors.group, borderRadius: radius.card, padding: space[4], alignItems: 'center', gap: 2 },
  center: { textAlign: 'center' },
  note: { paddingHorizontal: space[4], paddingTop: space[4], lineHeight: 19 },
});
