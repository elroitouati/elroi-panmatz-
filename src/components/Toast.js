import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { colors, radius, space, motion } from '../design/tokens';
import { text } from '../design/typography';
import useReducedMotion from '../design/useReducedMotion';

// הודעת חיזוק קצרה. עולה מעל פס הניווט ונעלמת בעצמה.
export default function Toast({ message }) {
  const reduced = useReducedMotion();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduced) { anim.setValue(message ? 1 : 0); return; }
    Animated.timing(anim, {
      toValue: message ? 1 : 0,
      duration: motion.duration.fade,
      easing: motion.easing.standard,
      useNativeDriver: true,
    }).start();
  }, [message, reduced]);

  if (!message) return null;

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });

  return (
    <Animated.View
      style={[styles.wrap, { opacity: anim, transform: [{ translateY }] }]}
      pointerEvents="none"
      accessibilityLiveRegion="polite"
    >
      <Text style={[text.label, styles.text]}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    bottom: 116,
    alignSelf: 'center',
    maxWidth: '88%',
    backgroundColor: colors.surface3,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: space[3],
    paddingHorizontal: space[5],
  },
  text: { color: colors.text1, textAlign: 'center' },
});
