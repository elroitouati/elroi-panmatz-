import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { withTiming, useReducedMotion } from 'react-native-reanimated';
import Button from './Button';
import { colors, radius, space, ease, keep } from '../design/tokens';
import { text } from '../design/typography';
import { haptic } from '../design/haptics';
import { keyToDate, HEB_WEEKDAYS_FULL } from '../utils/date';
import { WORKOUTS, workoutFor } from '../utils/weekPlan';

// ============================================================================
//  "הצל את הרצף" — מופיע כשיש פספוס מהימים האחרונים שעוד אפשר להשלים.
//  יציאה אחרי ההצלה: שקיפות + הקטנה ל-0.96 ב-180ms (יציאה מהירה מכניסה),
//  והתוכן שמתחת עולה למקומו במעבר פריסה — כך שהמסך לא "קופץ".
//  הפחתת תנועה: העמעמה בלבד.
// ============================================================================

function exitOut(reduced) {
  return () => {
    'worklet';
    return {
      initialValues: { opacity: 1, transform: [{ scale: 1 }] },
      animations: {
        opacity: withTiming(0, { duration: 180, easing: ease.out, ...keep }),
        transform: [{ scale: reduced ? 1 : withTiming(0.96, { duration: 180, easing: ease.out }) }],
      },
    };
  };
}

export default function RescueCard({ missKey, plan, onRescue }) {
  const reduced = useReducedMotion();
  const d = keyToDate(missKey);
  const w = WORKOUTS[workoutFor(plan, d.getDay())];

  return (
    <Animated.View exiting={exitOut(reduced)} style={styles.card}>
      <View style={styles.top}>
        <View style={styles.badge}>
          <Ionicons name="refresh" size={22} color={colors.gold} />
        </View>
        <View style={styles.texts}>
          <Text style={text.headlineStrong}>הצל את הרצף</Text>
          <Text style={text.sub}>
            פספסת ביום {HEB_WEEKDAYS_FULL[d.getDay()]} ({w.label}). השלמת את האימון? הרצף יישמר.
          </Text>
        </View>
      </View>
      <Button
        label="השלמתי — הצל את הרצף"
        icon="refresh"
        variant="primary"
        onPress={() => { haptic.success(); onRescue(missKey); }}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.group, borderRadius: radius.card, padding: space[4], gap: space[4],
    borderWidth: 1, borderColor: colors.goldSoft, marginBottom: space[4],
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  badge: {
    width: 44, height: 44, borderRadius: radius.pill, backgroundColor: colors.goldSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  texts: { flex: 1, minWidth: 0, gap: 2 },
});
