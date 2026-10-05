import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Screen from '../components/Screen';
import IconButton from '../components/IconButton';
import { Section, Row } from '../components/Group';
import { colors, radius, space } from '../design/tokens';
import { text } from '../design/typography';
import { ltr } from '../design/rtl';
import { haptic } from '../design/haptics';
import { useApp } from '../context/AppContext';
import { buildMonthGrid, keyToDate, todayKey, monthLabel, HEB_WEEKDAYS_SHORT } from '../utils/date';
import { classifyDay, anyGoalTrainsOn, computeStreak } from '../utils/fitness';

// ============================================================================
//  הלוח שלי. שלושה מצבים נבדלים בצורה, לא רק בגוון:
//  בוצע = מילוי זהב · פספוס = טבעת אדומה · מנוחה = ספרה עמומה.
//  היום = טבעת שמנת. מעבר חודש מיידי — פעולה חוזרת, בלי אנימציה.
// ============================================================================

const CELL = 38;

export default function CalendarScreen() {
  const { state, setDayTrained } = useApp();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const today = todayKey();
  const weeks = useMemo(() => buildMonthGrid(year, month), [year, month]);
  const enabledGoals = state ? state.goals.filter((g) => g.enabled) : [];

  const stats = useMemo(() => {
    if (!state) return null;
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
  }, [weeks, state, today]);

  if (!state) return null;

  const changeMonth = (delta) => {
    let m = month + delta, y = year;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setMonth(m); setYear(y);
  };

  const onDayPress = (key) => {
    if (!key || key > today) return;   // אי אפשר לסמן יום שעוד לא הגיע
    haptic.selection();
    setDayTrained(key, !state.logs[key]?.trained);
  };

  return (
    <Screen title="הלוח שלי" overline="מעקב האימונים">
      <View style={styles.card}>
        {/* בעברית "הבא" שמאלה: הקודם מימין (›), הבא משמאל (‹) */}
        <View style={styles.monthNav}>
          <IconButton icon="chevron-forward" label="לחודש הקודם" onPress={() => changeMonth(-1)} tone="plain" />
          <Text style={[text.headlineStrong, styles.month]}>{monthLabel(year, month)}</Text>
          <IconButton icon="chevron-back" label="לחודש הבא" onPress={() => changeMonth(1)} tone="plain" />
        </View>

        <View style={styles.week}>
          {HEB_WEEKDAYS_SHORT.map((d) => (
            <Text key={d} style={[text.caption, styles.weekHead]}>{d}</Text>
          ))}
        </View>

        {weeks.map((week, wi) => (
          <View key={wi} style={styles.week}>
            {week.map((key, di) => {
              if (!key) return <View key={di} style={styles.cellWrap} />;
              const d = keyToDate(key);
              const isToday = key === today;
              const status = classifyDay(enabledGoals, state.logs[key], d.getDay(), key < today, isToday);
              const done = status === 'done';
              const missed = status === 'missed';
              const future = key > today;
              return (
                <Pressable
                  key={di}
                  onPress={() => onDayPress(key)}
                  disabled={future}
                  accessibilityRole="button"
                  accessibilityLabel={`${d.getDate()} — ${done ? 'בוצע' : missed ? 'פספוס' : 'מנוחה'}`}
                  style={styles.cellWrap}
                >
                  {({ pressed }) => (
                    <View
                      style={[
                        styles.cell,
                        done && styles.done,
                        missed && styles.missed,
                        isToday && !done && styles.today,
                        pressed && !done && styles.pressed,
                      ]}
                    >
                      <Text
                        style={[
                          text.headline,
                          styles.num,
                          done && styles.numDone,
                          missed && styles.numMissed,
                          !done && !missed && !isToday && styles.numRest,
                          isToday && !done && styles.numToday,
                        ]}
                      >
                        {ltr(d.getDate())}
                      </Text>
                    </View>
                  )}
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
      </View>
      <Text style={[text.caption, styles.hint]}>לחיצה על יום שעבר מסמנת או מבטלת אימון.</Text>

      <Section title="החודש">
        <Row
          title="רצף נוכחי"
          value={`${ltr(stats.streak)} ${stats.streak === 1 ? 'יום' : 'ימים'}`}
          valueStyle={styles.gold}
        />
        <Row title="אימונים" value={ltr(stats.workouts)} />
        <Row title="עמידה ביעד" value={ltr(`${stats.adherence}%`)} />
      </Section>
    </Screen>
  );
}

function Legend({ swatch, label }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.lg, swatch]} />
      <Text style={text.caption}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.group, borderRadius: radius.card, padding: space[4] },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space[3] },
  month: { textAlign: 'center' },
  week: { flexDirection: 'row', marginBottom: 4 },
  weekHead: { flex: 1, textAlign: 'center' },
  cellWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 44 },
  cell: {
    width: CELL, height: CELL, borderRadius: CELL / 2, borderWidth: 2, borderColor: 'transparent',
    alignItems: 'center', justifyContent: 'center',
  },
  done: { backgroundColor: colors.gold, borderColor: colors.gold },
  missed: { borderColor: colors.red },
  today: { borderColor: colors.ink },
  pressed: { backgroundColor: colors.groupPressed },
  num: { textAlign: 'center' },
  numDone: { color: colors.onGold, fontFamily: 'Heebo_700Bold' },
  numMissed: { color: colors.red },
  numRest: { color: colors.ink2 },
  numToday: { fontFamily: 'Heebo_700Bold' },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: space[5], marginTop: space[3] },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  lg: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: 'transparent' },
  lgDone: { backgroundColor: colors.gold, borderColor: colors.gold },
  lgMissed: { borderColor: colors.red },
  lgRest: { backgroundColor: colors.bgDeep },
  hint: { paddingHorizontal: space[4], paddingTop: space[2] },
  gold: { color: colors.gold, fontFamily: 'Heebo_700Bold' },
});
