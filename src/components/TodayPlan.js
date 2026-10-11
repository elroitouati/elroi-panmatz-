import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, space } from '../design/tokens';
import { text } from '../design/typography';
import { WORKOUTS, workoutFor } from '../utils/weekPlan';
import { HEB_WEEKDAYS_SHORT, HEB_WEEKDAYS_FULL } from '../utils/date';

// ============================================================================
//  מה יש היום — לפי התוכנית השבועית.
//  למעלה: היום בשמו והאימון שלו, ומה מחר. למטה: פס של השבוע, היום בזהב.
//  לחיצה על יום בפס משנה את האימון שלו. מצב ריק בצורה (אייקון) ולא רק בצבע.
// ============================================================================

export default function TodayPlan({ plan, onEditDay }) {
  const today = new Date().getDay();
  const type = workoutFor(plan, today);
  const w = WORKOUTS[type];
  const rest = type === 'rest';
  const tomorrow = WORKOUTS[workoutFor(plan, (today + 1) % 7)];

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={[styles.badge, rest && styles.badgeRest]}>
          <Ionicons name={w.icon} size={26} color={rest ? colors.ink2 : colors.gold} />
        </View>
        <View style={styles.texts}>
          <Text style={text.caption} numberOfLines={1}>היום · יום {HEB_WEEKDAYS_FULL[today]}</Text>
          <Text style={[text.title, !rest && styles.gold]} numberOfLines={1}>{w.label}</Text>
          <Text style={text.sub} numberOfLines={1}>מחר: {tomorrow.label}</Text>
        </View>
      </View>

      <View style={styles.week}>
        {HEB_WEEKDAYS_SHORT.map((letter, d) => {
          const t = workoutFor(plan, d);
          const isToday = d === today;
          return (
            <Pressable
              key={d}
              onPress={() => onEditDay(d)}
              accessibilityRole="button"
              accessibilityLabel={`יום ${HEB_WEEKDAYS_FULL[d]}: ${WORKOUTS[t].label}. לחיצה לשינוי`}
              style={styles.col}
            >
              {({ pressed }) => (
                <>
                  <Text style={[text.caption, styles.letter, isToday && styles.letterToday]}>{letter}</Text>
                  <View style={[styles.dot, isToday && styles.dotToday, pressed && !isToday && styles.dotPressed]}>
                    <Ionicons
                      name={t === 'rest' ? 'moon-outline' : WORKOUTS[t].icon}
                      size={16}
                      color={isToday ? colors.onGold : t === 'rest' ? colors.ink3 : colors.ink2}
                    />
                  </View>
                </>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const DOT = 36;
const styles = StyleSheet.create({
  card: { backgroundColor: colors.group, borderRadius: radius.card, padding: space[4], gap: space[4], marginBottom: space[4] },
  top: { flexDirection: 'row', alignItems: 'center', gap: space[4] },
  badge: {
    width: 56, height: 56, borderRadius: radius.pill, backgroundColor: colors.goldSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeRest: { backgroundColor: colors.bgDeep },
  texts: { flex: 1, minWidth: 0, gap: 1 },
  gold: { color: colors.gold },
  week: {
    flexDirection: 'row', paddingTop: space[3],
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.separator,
  },
  col: { flex: 1, alignItems: 'center', gap: 6, minHeight: 44 },
  letter: { textAlign: 'center' },
  letterToday: { color: colors.gold, fontFamily: 'Heebo_700Bold' },
  dot: {
    width: DOT, height: DOT, borderRadius: DOT / 2, backgroundColor: colors.bgDeep,
    alignItems: 'center', justifyContent: 'center',
  },
  dotToday: { backgroundColor: colors.gold },
  dotPressed: { backgroundColor: colors.groupPressed },
});
