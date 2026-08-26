import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, Easing } from 'react-native';
import { colors, radius, space } from '../design/tokens';
import useReducedMotion from '../design/useReducedMotion';

// אבן שלד יחידה. הריצוד עדין ואיטי, ונעצר לגמרי כשהמשתמש ביקש להפחית תנועה.
export function SkeletonBox({ width, height, rounded = radius.sm, style }) {
  const reduced = useReducedMotion();
  const pulse = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (reduced) {
      pulse.setValue(0.7);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 750, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.5, duration: 750, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [reduced]);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: rounded, backgroundColor: colors.surface2, opacity: pulse },
        style,
      ]}
    />
  );
}

// שלד בצורת מסך הבית: כרטיס שלב, שורת אריחים, מפת מסלול, שורות יעד.
// שלד בצורת התוכן — לא ספינר. הוא מספר למשתמש מה עומד להיטען.
export default function AppSkeleton() {
  return (
    <View style={styles.root} accessibilityLabel="טוען את הנתונים שלך">
      <View style={styles.header}>
        <SkeletonBox width={150} height={26} />
        <SkeletonBox width={40} height={40} rounded={radius.pill} />
      </View>

      <SkeletonBox width="100%" height={168} rounded={radius.lg} />

      <View style={styles.row}>
        <SkeletonBox width="48.5%" height={96} rounded={radius.lg} />
        <SkeletonBox width="48.5%" height={96} rounded={radius.lg} />
      </View>

      <SkeletonBox width="100%" height={104} rounded={radius.lg} />

      <View style={styles.row}>
        <SkeletonBox width="48.5%" height={96} rounded={radius.lg} />
        <SkeletonBox width="48.5%" height={96} rounded={radius.lg} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: space[5],
    paddingTop: space[16],
    gap: space[3],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space[2],
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
});
