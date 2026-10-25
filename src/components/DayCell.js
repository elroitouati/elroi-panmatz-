import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, interpolateColor, useReducedMotion,
} from 'react-native-reanimated';
import { colors, duration, ease, type, keep } from '../design/tokens';
import { ltr } from '../design/rtl';

// ============================================================================
//  תא יום בלוח. מצבים נבדלים בצורה ולא רק בצבע:
//  בוצע = מילוי זהב · פספוס = טבעת אדומה · מוצדק = מילוי כהה + תחבושת
//  הושלם (השלמה) = טבעת זהב + חץ מעגלי
//  היום = טבעת שמנת · עתידי/מנוחה = ספרה עמומה.
//  מתחת לעיגול: אייקון האימון שמתוכנן ביום הזה (משקולת / רץ).
//  סימון "בוצע" ממלא את העיגול ב-180ms (מצב משתנה — state indication),
//  כמעבר ולא keyframes, כך שביטול באמצע מתהפך מהמקום. לחיצה מכווצת ל-0.92.
// ============================================================================

const SIZE = 34;

export default function DayCell({ day, status, isToday, planIcon, onPress, label }) {
  const reduced = useReducedMotion();
  const done = status === 'done';
  const d = useSharedValue(done ? 1 : 0);
  const s = useSharedValue(1);

  useEffect(() => {
    const t = done ? 1 : 0;
    d.value = withTiming(t, { duration: duration.toggle, easing: ease.out, ...keep });
  }, [done, reduced]);

  const madeup = status === 'madeup';
  const ring = status === 'missed' ? colors.red : madeup ? colors.gold : isToday ? colors.ink : status === 'excused' ? colors.ink3 : 'transparent';
  const rest = status === 'rest' || status === 'future';
  const fallbackFill = status === 'excused' ? colors.bgDeep : 'rgba(0,0,0,0)';

  const circle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(d.value, [0, 1], [fallbackFill, colors.gold]),
    borderColor: interpolateColor(d.value, [0, 1], [ring, colors.gold]),
    transform: [{ scale: s.value }],
  }));
  const num = useAnimatedStyle(() => ({
    color: interpolateColor(
      d.value, [0, 1],
      [status === 'missed' ? colors.red : madeup ? colors.gold : rest ? colors.ink2 : colors.ink, colors.onGold],
    ),
  }));

  const press = (v) => { s.value = withTiming(v, { duration: duration.press, easing: ease.out }); };
  const iconColor = done || madeup ? colors.gold : status === 'missed' ? colors.red : isToday ? colors.ink : colors.ink3;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => press(0.92)}
      onPressOut={() => press(1)}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={styles.wrap}
    >
      <Animated.View style={[styles.circle, circle]}>
        <Animated.Text style={[styles.num, (done || isToday || madeup) && styles.bold, num]} allowFontScaling={false}>
          {ltr(day)}
        </Animated.Text>
      </Animated.View>
      <View style={styles.iconRow}>
        {madeup ? (
          <Ionicons name="refresh" size={11} color={colors.gold} />
        ) : status === 'excused' ? (
          <Ionicons name="bandage-outline" size={11} color={colors.ink3} />
        ) : planIcon ? (
          <Ionicons name={planIcon} size={11} color={iconColor} />
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', paddingVertical: 3, minHeight: 52 },
  circle: {
    width: SIZE, height: SIZE, borderRadius: SIZE / 2, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  num: {
    fontFamily: type.family.medium, fontSize: 15, lineHeight: 19, textAlign: 'center',
    includeFontPadding: false, ...type.tabular,
  },
  bold: { fontFamily: type.family.bold },
  iconRow: { height: 14, marginTop: 2, alignItems: 'center', justifyContent: 'center' },
});
