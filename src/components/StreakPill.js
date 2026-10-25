import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue, useAnimatedStyle, withSequence, withTiming, withSpring, useReducedMotion,
} from 'react-native-reanimated';
import { colors, radius, space, ease } from '../design/tokens';
import { text } from '../design/typography';
import { ltr } from '../design/rtl';

// גלולת הרצף. כשהרצף עולה (סימון אימון / הצלה) הלהבה "נושמת" פעם אחת:
// 1 → 1.3 ב-140ms ובחזרה בקפיץ רך. state indication — קורה כמה פעמים
// בשבוע, לא בלולאה. לא בטעינה, לא כשהרצף יורד. הפחתת תנועה: בלי.
export default function StreakPill({ streak }) {
  const reduced = useReducedMotion();
  const prev = useRef(streak);
  const s = useSharedValue(1);

  useEffect(() => {
    if (streak > prev.current && !reduced) {
      s.value = withSequence(
        withTiming(1.3, { duration: 140, easing: ease.out }),
        withSpring(1, { duration: 350, dampingRatio: 0.5 }),
      );
    }
    prev.current = streak;
  }, [streak]);

  const flame = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));

  return (
    <Animated.View style={styles.pill} accessibilityLabel={`רצף של ${streak} ימים`}>
      <Animated.View style={flame}>
        <Ionicons name="flame" size={14} color={colors.gold} />
      </Animated.View>
      <Text style={text.captionStrong}>
        רצף {ltr(streak)} {streak === 1 ? 'יום' : 'ימים'}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start',
    backgroundColor: colors.goldSoft, borderRadius: radius.pill,
    paddingHorizontal: space[3], paddingVertical: 5, marginTop: space[2],
  },
});
