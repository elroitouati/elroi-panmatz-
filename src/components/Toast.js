import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing, font } from '../theme';

// הודעת חיזוק צפה בתוך האפליקציה (שיא, שדרוג יעד וכו').
export default function Toast({ message }) {
  const y = useRef(new Animated.Value(80)).current;

  useEffect(() => {
    if (message) {
      Animated.spring(y, { toValue: 0, useNativeDriver: true, friction: 7 }).start();
    } else {
      Animated.timing(y, { toValue: 80, duration: 200, useNativeDriver: true }).start();
    }
  }, [message]);

  if (!message) return null;

  return (
    <Animated.View style={[styles.wrap, { transform: [{ translateY: y }] }]} pointerEvents="none">
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    bottom: 96,
    alignSelf: 'center',
    backgroundColor: colors.gold,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    maxWidth: '90%',
  },
  text: { color: colors.bg, fontWeight: '800', fontSize: font.small, textAlign: 'center' },
});
