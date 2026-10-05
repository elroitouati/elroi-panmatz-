import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useSharedValue, useAnimatedStyle, useAnimatedProps, withTiming, withDelay,
  interpolateColor, useReducedMotion,
} from 'react-native-reanimated';
import { colors, duration, ease } from '../design/tokens';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const SIZE = 30;
const CHECK_LEN = 24;

// ============================================================================
//  עיגול הסימון — הרגע שחוזר הכי הרבה באפליקציה, ולכן הכי קצר:
//  מילוי 180ms, והווי "נכתב" פנימה מיד אחריו. מעבר ולא keyframes — כך לחיצה
//  כפולה מהירה מתהפכת מהמקום הנוכחי במקום להתחיל מאפס.
//  pressed: העיגול מתכווץ כבר ברגע הנגיעה בשורה.
// ============================================================================

export default function CheckCircle({ done, pressed }) {
  const reduced = useReducedMotion();
  const d = useSharedValue(done ? 1 : 0);
  const draw = useSharedValue(done ? 1 : 0);
  const s = useSharedValue(1);

  useEffect(() => {
    const t = done ? 1 : 0;
    if (reduced) { d.value = t; draw.value = t; return; }
    d.value = withTiming(t, { duration: duration.toggle, easing: ease.out });
    draw.value = done
      ? withDelay(60, withTiming(1, { duration: 220, easing: ease.out }))
      : withTiming(0, { duration: 100, easing: ease.out });
  }, [done, reduced]);

  useEffect(() => {
    s.value = withTiming(pressed ? 0.9 : 1, { duration: duration.press, easing: ease.out });
  }, [pressed]);

  const circle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(d.value, [0, 1], ['transparent', colors.gold]),
    borderColor: interpolateColor(d.value, [0, 1], [colors.ink3, colors.gold]),
    transform: [{ scale: s.value }],
  }));
  const check = useAnimatedProps(() => ({ strokeDashoffset: CHECK_LEN * (1 - draw.value) }));

  return (
    <Animated.View style={[styles.circle, circle]}>
      <Svg width={16} height={16} viewBox="0 0 24 24">
        <AnimatedPath
          d="M5 12.5l4.5 4.5L19 7.5"
          stroke={colors.onGold}
          strokeWidth={3.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          strokeDasharray={CHECK_LEN}
          animatedProps={check}
        />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  circle: {
    width: SIZE, height: SIZE, borderRadius: SIZE / 2, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
});
