import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, useReducedMotion } from 'react-native-reanimated';
import Screen from '../components/Screen';
import IconButton from '../components/IconButton';
import DayCell from '../components/DayCell';
import Reveal from '../components/Reveal';
import { Section, Row } from '../components/Group';
import DaySheet from '../sheets/DaySheet';
import { colors, radius, space, ease, keep } from '../design/tokens';
import { text } from '../design/typography';
import { ltr } from '../design/rtl';
import { haptic } from '../design/haptics';
import { useApp } from '../context/AppContext';
import { buildMonthGrid, keyToDate, todayKey, monthLabel, HEB_WEEKDAYS_SHORT } from '../utils/date';
import { WORKOUTS, workoutFor } from '../utils/weekPlan';
import { dayStatus, currentStreak, bestStreak, rangeStats } from '../utils/journal';

// ============================================================================
//  הלוח שלי — התוכנית מול הביצוע.
//  כל יום מראה מה היה מתוכנן (אייקון) ומה קרה (צורת העיגול).
//  לחיצה על יום פותחת את הפירוט שלו; משם מסמנים, מבטלים או מצדיקים.
//  מעבר חודש: החלפה עדינה בכיוון הקריאה (200ms, ease-out) — כדי שהרשת
//  לא "תקפוץ" (preventing a jarring change). הפחתת תנועה: שקיפות בלבד.
// ============================================================================

const plural = (n, one, many) => `${ltr(n)} ${n === 1 ? one : many}`;

export default function CalendarScreen() {
  const { state, setDayTrained, setDayExcused } = useApp();
  const reduced = useReducedMotion();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [openDay, setOpenDay] = useState(null);

  const gx = useSharedValue(0);
  const go = useSharedValue(1);
  const gridStyle = useAnimatedStyle(() => ({ opacity: go.value, transform: [{ translateX: gx.value }] }));

  const today = todayKey();
  const weeks = useMemo(() => buildMonthGrid(year, month), [year, month]);

  const stats = useMemo(() => {
    if (!state) return null;
    const args = [state.goals, state.weekPlan, state.logs, state.startedAt, today];
    return {
      month: rangeStats(weeks.flat(), ...args),
      streak: currentStreak(...args),
      best: bestStreak(...args),
    };
  }, [weeks, state, today]);

  if (!state) return null;

  const changeMonth = (delta) => {
    let m = month + delta, y = year;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setMonth(m); setYear(y);
    // בעברית "הבא" שמאלה: החודש הבא נכנס משמאל, הקודם מימין
    const cfg = { duration: 200, easing: ease.out };
    go.value = 0;
    go.value = withTiming(1, { ...cfg, ...keep }); // ההחלפה נשארת כהעמעמה גם בהפחתת תנועה
    if (!reduced) {
      gx.value = delta > 0 ? -16 : 16;
      gx.value = withTiming(0, cfg);
    }
  };

  const m = stats.month;

  return (
    <Screen title="הלוח שלי" overline="התוכנית מול הביצוע">
      <Reveal index={0}>
        <View style={styles.card}>
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

          <Animated.View style={gridStyle}>
            {weeks.map((week, wi) => (
              <View key={wi} style={styles.week}>
                {week.map((key, di) => {
                  if (!key) return <View key={di} style={styles.empty} />;
                  const d = keyToDate(key);
                  const status = dayStatus({
                    goals: state.goals, plan: state.weekPlan, log: state.logs[key],
                    key, today, startedAt: state.startedAt,
                  });
                  const type = workoutFor(state.weekPlan, d.getDay());
                  return (
                    <DayCell
                      key={di}
                      day={d.getDate()}
                      status={status}
                      isToday={key === today}
                      planIcon={type === 'rest' ? null : WORKOUTS[type].icon}
                      onPress={() => { haptic.selection(); setOpenDay({ key, status }); }}
                      label={`${d.getDate()} — ${WORKOUTS[type].label}, ${
                        { done: 'בוצע', missed: 'פספוס', excused: 'מוצדק', today: 'היום', future: 'עתידי', rest: 'מנוחה' }[status]
                      }`}
                    />
                  );
                })}
              </View>
            ))}
          </Animated.View>

          <View style={styles.legend}>
            <Legend swatch={styles.lgDone} label="בוצע" />
            <Legend swatch={styles.lgMissed} label="פספוס" />
            <Legend swatch={styles.lgExcused} label="מוצדק" />
          </View>
          <View style={styles.legend}>
            <LegendIcon icon={WORKOUTS.strength.icon} label="כוח" />
            <LegendIcon icon={WORKOUTS.run.icon} label="ריצה" />
            <Text style={text.caption}>בלי אייקון = מנוחה</Text>
          </View>
        </View>
        <Text style={[text.caption, styles.hint]}>לחיצה על יום מראה מה היה מתוכנן ומה בוצע.</Text>
      </Reveal>

      <Reveal index={1}>
        <Section title="החודש">
          <Row
            title="רצף נוכחי"
            value={plural(stats.streak, 'יום', 'ימים')}
            valueStyle={styles.gold}
            leading={<Ionicons name="flame" size={20} color={colors.gold} />}
          />
          <Row
            title="שיא רצף"
            value={plural(stats.best, 'יום', 'ימים')}
            leading={<Ionicons name="trophy-outline" size={20} color={colors.ink2} />}
          />
          <Row
            title="אימונים"
            subtitle={`כוח ${ltr(m.strength)} · ריצה ${ltr(m.run)}`}
            value={`${ltr(m.met)}/${ltr(m.due)}`}
            leading={<Ionicons name="barbell-outline" size={20} color={colors.ink2} />}
          />
          <Row
            title="עמידה בתוכנית"
            value={ltr(`${m.adherence}%`)}
            valueStyle={m.adherence >= 80 ? styles.gold : null}
            leading={<Ionicons name="checkmark-done-outline" size={20} color={colors.ink2} />}
          />
          {m.excused ? (
            <Row
              title="ימים מוצדקים"
              value={ltr(m.excused)}
              leading={<Ionicons name="bandage-outline" size={20} color={colors.ink2} />}
            />
          ) : null}
        </Section>
      </Reveal>

      <DaySheet
        target={openDay}
        state={state}
        onClose={() => setOpenDay(null)}
        onSetTrained={setDayTrained}
        onSetExcused={setDayExcused}
      />
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

function LegendIcon({ icon, label }) {
  return (
    <View style={styles.legendItem}>
      <Ionicons name={icon} size={12} color={colors.ink2} />
      <Text style={text.caption}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.group, borderRadius: radius.card, padding: space[4], overflow: 'hidden' },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space[3] },
  month: { textAlign: 'center' },
  week: { flexDirection: 'row', marginBottom: 2 },
  weekHead: { flex: 1, textAlign: 'center', marginBottom: space[1] },
  empty: { flex: 1 },
  legend: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: space[5], marginTop: space[3] },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  lg: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: 'transparent' },
  lgDone: { backgroundColor: colors.gold, borderColor: colors.gold },
  lgMissed: { borderColor: colors.red },
  lgExcused: { backgroundColor: colors.bgDeep, borderColor: colors.ink3 },
  hint: { paddingHorizontal: space[4], paddingTop: space[2] },
  gold: { color: colors.gold, fontFamily: 'Heebo_700Bold' },
});
