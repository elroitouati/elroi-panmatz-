import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Card from '../components/Card';
import StatTile from '../components/StatTile';
import { colors, spacing, radius, font } from '../theme';
import { useApp } from '../context/AppContext';
import {
  buildMonthGrid, keyToDate, todayKey, monthLabel, HEB_WEEKDAYS_SHORT,
} from '../utils/date';
import { classifyDay, anyGoalTrainsOn, computeStreak } from '../utils/fitness';

export default function CalendarScreen() {
  const { state, setDayTrained } = useApp();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  if (!state) return null;

  const today = todayKey();
  const weeks = buildMonthGrid(year, month);
  const enabledGoals = state.goals.filter((g) => g.enabled);

  const changeMonth = (delta) => {
    let m = month + delta;
    let y = year;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setMonth(m);
    setYear(y);
  };

  const dayInfo = (key) => {
    const d = keyToDate(key);
    const log = state.logs[key];
    const isPast = key < today;
    const isToday = key === today;
    const status = classifyDay(enabledGoals, log, d.getDay(), isPast, isToday);
    return { status, isToday, day: d.getDate() };
  };

  // סטטיסטיקות לחודש המוצג
  const stats = useMemo(() => {
    let workouts = 0;
    let trainingPast = 0;
    let trainedPast = 0;
    weeks.flat().forEach((key) => {
      if (!key) return;
      const d = keyToDate(key);
      const log = state.logs[key];
      const trained = log && log.trained;
      if (trained) workouts += 1;
      const isTrainingDay = anyGoalTrainsOn(enabledGoals, d.getDay());
      if (isTrainingDay && (key < today || key === today)) {
        trainingPast += 1;
        if (trained) trainedPast += 1;
      }
    });
    const adherence = trainingPast === 0 ? 0 : Math.round((trainedPast / trainingPast) * 100);
    const streak = computeStreak(enabledGoals, state.logs);

    return { workouts, adherence, streak };
  }, [weeks, state.logs, enabledGoals, today]);

  const onDayPress = (key) => {
    if (!key || key > today) return; // אי אפשר לסמן ימים עתידיים
    const cur = state.logs[key]?.trained;
    setDayTrained(key, !cur);
  };

  return (
    <Screen title="הלוח שלי" subtitle="מעקב האימונים שביצעת">
      {/* ניווט חודשים */}
      <Card>
        <View style={styles.monthNav}>
          <Pressable onPress={() => changeMonth(1)} hitSlop={10}>
            <Ionicons name="chevron-forward" size={26} color={colors.cream} />
          </Pressable>
          <Text style={styles.monthTitle}>{monthLabel(year, month)}</Text>
          <Pressable onPress={() => changeMonth(-1)} hitSlop={10}>
            <Ionicons name="chevron-back" size={26} color={colors.cream} />
          </Pressable>
        </View>

        {/* כותרות ימים */}
        <View style={styles.weekHeader}>
          {HEB_WEEKDAYS_SHORT.map((d) => (
            <Text key={d} style={styles.weekHeaderText}>{d}</Text>
          ))}
        </View>

        {/* רשת הימים */}
        {weeks.map((week, wi) => (
          <View key={wi} style={styles.week}>
            {week.map((key, di) => {
              if (!key) return <View key={di} style={styles.cell} />;
              const info = dayInfo(key);
              const style = statusStyle(info.status);
              return (
                <Pressable key={di} style={styles.cell} onPress={() => onDayPress(key)}>
                  <View style={[styles.dayBox, style.box, info.isToday && styles.todayRing]}>
                    <Text style={[styles.dayNum, style.text]}>{info.day}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}

        {/* מקרא */}
        <View style={styles.legend}>
          <LegendDot color={colors.gold} label="בוצע" />
          <LegendDot color={colors.rest} label="מנוחה" />
          <LegendDot color={colors.danger} label="פספוס" />
        </View>
        <Text style={styles.hint}>לחיצה על יום מסמנת/מבטלת אימון שבוצע</Text>
      </Card>

      {/* סטטיסטיקות מהירות */}
      <View style={styles.statsRow}>
        <StatTile value={stats.workouts} label="אימונים החודש" icon="barbell-outline" />
        <StatTile value={stats.streak} label="רצף נוכחי" icon="flame-outline" emphasis />
        <StatTile value={`${stats.adherence}%`} label="עמידה ביעד" icon="checkmark-done-outline" />
      </View>
    </Screen>
  );
}

function statusStyle(status) {
  switch (status) {
    case 'done': return { box: { backgroundColor: colors.gold }, text: { color: colors.bg, fontWeight: '800' } };
    case 'rest': return { box: { backgroundColor: colors.bgDeep, borderWidth: 1, borderColor: colors.rest }, text: { color: colors.rest } };
    case 'missed': return { box: { backgroundColor: 'rgba(200,90,74,0.18)', borderWidth: 1, borderColor: colors.danger }, text: { color: colors.danger, fontWeight: '700' } };
    case 'today': return { box: { backgroundColor: colors.bgDeep }, text: { color: colors.cream } };
    default: return { box: { backgroundColor: 'transparent' }, text: { color: colors.creamDim } };
  }
}

function LegendDot({ color, label }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  monthNav: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  monthTitle: { color: colors.cream, fontSize: font.h3, fontWeight: '800' },
  weekHeader: { flexDirection: 'row-reverse', marginBottom: spacing.sm },
  weekHeaderText: { flex: 1, textAlign: 'center', color: colors.creamDim, fontSize: font.tiny, fontWeight: '700' },
  week: { flexDirection: 'row-reverse', marginBottom: 6 },
  cell: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  dayBox: { width: 38, height: 38, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  todayRing: { borderWidth: 2, borderColor: colors.cream },
  dayNum: { fontSize: font.small },
  legend: { flexDirection: 'row-reverse', justifyContent: 'center', gap: spacing.lg, marginTop: spacing.md },
  legendItem: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendText: { color: colors.creamDim, fontSize: font.tiny },
  hint: { color: colors.creamDim, fontSize: font.tiny, textAlign: 'center', marginTop: spacing.sm },
  statsRow: { flexDirection: 'row-reverse', gap: spacing.sm, marginTop: spacing.sm },
});
