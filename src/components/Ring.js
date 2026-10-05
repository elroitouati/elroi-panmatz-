import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue, useAnimatedProps, withTiming, useReducedMotion,
} from 'react-native-reanimated';
import { colors, duration, ease } from '../design/tokens';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ============================================================================
//  Ring — החתימה של האפליקציה, בהשראת טבעות הפעילות של אפל.
//  מטרה: ציון מצב. 300ms ב-ease-in-out (תנועה על המסך) — מתחת לתקרת ה-300ms
//  של אנימציית ממשק. רץ על ה-UI thread דרך animatedProps; React לא מרנדר מחדש.
//  הפחתת תנועה: הטבעת קופצת ישר לערך.
// ============================================================================

export default function Ring({ progress = 0, size = 132, stroke = 12, children }) {
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  const reduced = useReducedMotion();
  const p = useSharedValue(0);

  useEffect(() => {
    const target = Math.max(0, Math.min(1, progress));
    p.value = reduced ? target : withTiming(target, { duration: duration.fill, easing: ease.inOut });
  }, [progress, reduced]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: C * (1 - p.value),
    // קצה מעוגל באפס מצייר נקודה — מסתירים כשאין התקדמות
    strokeOpacity: p.value > 0.002 ? 1 : 0,
  }));

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={styles.rotate}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.track} strokeWidth={stroke} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.gold}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={C}
          fill="none"
          animatedProps={animatedProps}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  rotate: { transform: [{ rotate: '-90deg' }] },   // מתחילים מלמעלה
  center: { alignItems: 'center', justifyContent: 'center' },
});
