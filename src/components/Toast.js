import React, { useEffect, useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, runOnJS, useReducedMotion,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, space, duration, ease } from '../design/tokens';
import { text } from '../design/typography';

// הודעת חיזוק קצרה מעל סרגל הטאבים.
// נכנסת ב-250ms ויוצאת ב-150ms באותו כיוון (יציאה תמיד מהירה מכניסה).
// מעבר ולא keyframes: הודעה חדשה באמצע יציאה ממשיכה מהמקום הנוכחי.
export default function Toast({ message }) {
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(message);
  const p = useSharedValue(0);

  useEffect(() => {
    if (message) {
      setShown(message);
      p.value = reduced ? 1 : withTiming(1, { duration: duration.toastIn, easing: ease.out });
    } else if (reduced) {
      p.value = 0; setShown(null);
    } else {
      p.value = withTiming(0, { duration: duration.toastOut, easing: ease.out }, (f) => {
        if (f) runOnJS(setShown)(null);
      });
    }
  }, [message, reduced]);

  const style = useAnimatedStyle(() => ({
    opacity: p.value,
    transform: [{ translateY: (1 - p.value) * 12 }],
  }));

  if (!shown) return null;
  return (
    <Animated.View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      style={[styles.wrap, { bottom: insets.bottom + 76 }, style]}
    >
      <Text style={[text.sub, styles.text]}>{shown}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute', alignSelf: 'center', maxWidth: '88%',
    backgroundColor: colors.bgDeep, borderRadius: radius.pill,
    paddingVertical: space[3], paddingHorizontal: space[5],
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.separator,
  },
  text: { color: colors.ink, textAlign: 'center' },
});
