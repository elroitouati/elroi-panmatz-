import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Tile from '../components/Tile';
import StatTile from '../components/StatTile';
import { colors, space, radius, touch } from '../design/tokens';
import { text } from '../design/typography';
import { ltr } from '../design/rtl';
import { useApp } from '../context/AppContext';
import { buildMonthGrid, keyToDate, todayKey, monthLabel, HEB_WEEKDAYS_SHORT } from '../utils/date';
import { classifyDay, anyGoalTrainsOn, computeStreak } from '../utils/fitness';

// שלושת המצבים נבדלים בצורה ולא רק בגוון:
//   בוצע  — מילוי מלא
//   פספוס — מתאר בלבד
//   מנוחה — בלי מילוי ובלי מתאר
const CELL = 40;

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
    let m = month + delta, y = year;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setMonth(m); setYear(y);
  };

  const stats = useMemo(() => {
    let workouts = 0, due = 0, met = 0;
    weeks.flat().forEach((key) => {
      if (!key) return;
      const trained = state.logs[key]?.trained;
      if (trained) workouts += 1;
      if (anyGoalTrainsOn(enabledGoals, keyToDate(key).getDay()) && key <= today) {
        due += 1;
        if (trained) met += 1;
      }
    });
    return {
      workouts,
      adherence: due === 0 ? 0 : Math.round((met / due) * 100),
      streak: computeStreak(enabledGoals, state.logs),
    };
  }, [weeks, state.logs, enabledGoals, today]);

  const onDayPress = (key) => {
    if (!key || key > today) return;   // אי אפשר לסמן יום שעוד לא הגיע
    setDayTrained(key, !state.logs[key]?.trained);
  };

  return (
    <Screen title="הלוח שלי" subtitle="מעקב האימונים שביצעת">
      <Tile>
        {/* ניווט חודשים — החץ "הבא" פונה שמאלה, כי בעברית ההתקדמות שמאלה */}
        <View style={styles.monthNav}>
          <Pressable
            onPress={() => changeMonth(-1)}
            accessibilityRole="button"
            accessibilityLabel="לחודש הקודם"
            hitSlop={10}
            style={({ pressed }) => [styles.navBtn, pressed && styles.pressed]}
          >
            <Ionicons name="chevron-forward" size={20} color={colors.text1} />
          </Pressable>

          <Text style={text.bodyStrong}>{monthLabel(year, month)}</Text>

          <Pressable
            onPress={() => changeMonth(1)}
            accessibilityRole="button"
            accessibilityLabel="לחודש הבא"
            hitSlop={10}
            style={({ pressed }) => [styles.navBtn, pressed && styles.pressed]}
          >
            <Ionicons name="chevron-back" size={20} color={colors.text1} />
          </Pressable>
        </View>

        <View style={styles.weekHead}>
          {HEB_WEEKDAYS_SHORT.map((d) => (
            <Text key={d} style={[text.label, styles.weekHeadText]}>{d}</Text>
          ))}
        </View>

        {weeks.map((week, wi) => (
          <View key={wi} style={styles.week}>
            {week.map((key, di) => {
              if (!key) return <View key={di} style={styles.cellWrap} />;
              const d = keyToDate(key);
              const status = classifyDay(enabledGoals, state.logs[key], d.getDay(), key < today, key === today);
              const isToday = key === today;
              const done = status === 'done';
              const missed = status === 'missed';

              return (
                <Pressable
                  key={di}
                  onPress={() => onDayPress(key)}
                  disabled={key > today}
                  accessibilityRole="button"
                  accessibilityLabel={`${d.getDate()} — ${
                    done ? 'בוצע' : missed ? 'לא בוצע' : 'מנוחה'
                  }`}
                  style={styles.cellWrap}
                >
                  <View
                    style={[
                      styles.cell,
                      done && styles.cellDone,
                      missed && styles.cellMissed,
                      isToday && styles.cellToday,
                    ]}
                  >
                    <Text
                      style={[
                        text.label,
                        done && styles.numDone,
                        missed && styles.numMissed,
                        !done && !missed && styles.numRest,
                      ]}
                    >
                      {ltr(d.getDate())}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}

        <View style={styles.legend}>
          <Legend swatch={styles.lgDone} label="בוצע" />
          <Legend swatch={styles.lgMissed} label="פספוס" />
          <Legend swatch={styles.lgRest} label="מנוחה" />
        </View>
        <Text style={[text.label, styles.hint]}>
          לחיצה על יום שעבר מסמנת או מבטלת אימון
        </Text>
      </Tile>

      <View style={styles.bento}>
        <StatTile label="רצף נוכחי" value={stats.streak} unit={stats.streak === 1 ? 'יום' : 'ימים'} icon="flame-outline" accent />
        <StatTile label="אימונים החודש" value={stats.workouts} icon="barbell-outline" />
      </View>
      <View style={styles.bento}>
        <StatTile label="עמידה ביעד" value={stats.adherence} unit="%" icon="checkmark-done-outline" />
        <StatTile label="ימי אימון בשבוע" value={new Set(enabledGoals.flatMap((g) => g.trainingDays)).size} icon="calendar-outline" />
      </View>
    </Screen>
  );
}

function Legend({ swatch, label }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.lgBase, swatch]} />
      <Text style={text.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  monthNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: space[4],
  },
  navBtn: {
    width: touch.min, height: touch.min, borderRadius: radius.pill,
    alignItems: 'center', justifyContent: 'center',
  },
  pressed: { backgroundColor: colors.surface3 },

  weekHead: { flexDirection: 'row', marginBottom: space[2] },
  weekHeadText: { flex: 1, textAlign: 'center' },
  week: { flexDirection: 'row', marginBottom: space[1] },
  cellWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: touch.min },
  cell: {
    width: CELL, height: CELL, borderRadius: radius.sm,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'transparent',
  },
  cellDone: { backgroundColor: colors.accent },
  cellMissed: { borderColor: colors.danger },
  cellToday: { borderColor: colors.text1, borderWidth: 2 },
  numDone: { color: colors.onAccent },
  numMissed: { color: colors.danger },
  numRest: { color: colors.text3 },

  legend: {
    flexDirection: 'row', justifyContent: 'center',
    gap: space[5], marginTop: space[4],
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  lgBase: { width: 14, height: 14, borderRadius: 4, borderWidth: 1, borderColor: 'transparent' },
  lgDone: { backgroundColor: colors.accent },
  lgMissed: { borderColor: colors.danger },
  lgRest: { backgroundColor: colors.surface2 },
  hint: { textAlign: 'center', marginTop: space[2] },

  bento: { flexDirection: 'row', gap: space[3] },
});
