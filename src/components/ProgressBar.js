import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, useReducedMotion } from 'react-native-reanimated';
import { colors, radius, duration, ease } from '../design/tokens';

// פס התקדמות שמתמלא מהתחלת השורה (ימין ב-RTL).
// המילוי ממוקם absolute ובלי ילדים — זה המקרה היחיד שבו מותר להנפיש רוחב
// (animate-expo §4): אין פריסה מחדש לאחים, והפינות המעוגלות לא נמרחות כמו ב-scaleX.
export default function ProgressBar({ progress = 0, height = 6, label }) {
  const reduced = useReducedMotion();
  const p = useSharedValue(0);
  useEffect(() => {
    const t = Math.max(0, Math.min(1, progress));
    p.value = reduced ? t : withTiming(t, { duration: 250, easing: ease.inOut });
  }, [progress, reduced]);
  const fill = useAnimatedStyle(() => ({ width: `${p.value * 100}%` }));

  return (
    <View
      style={[styles.track, { height }]}
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}
    >
      <Animated.View style={[styles.fill, fill]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: '100%', backgroundColor: colors.track, borderRadius: radius.pill, overflow: 'hidden' },
  fill: { position: 'absolute', top: 0, bottom: 0, start: 0, backgroundColor: colors.gold, borderRadius: radius.pill },
});
