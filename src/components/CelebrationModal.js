import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, StyleSheet, Animated, Easing, Pressable, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, font } from '../theme';

const { width } = Dimensions.get('window');

// אנימציה חגיגית בהגעה ליעד הסופי, ואז מעבר למצב תחזוקה.
export default function CelebrationModal({ goal, onClose }) {
  const scale = useRef(new Animated.Value(0)).current;
  const confetti = useRef([...Array(14)].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (!goal) return;
    scale.setValue(0);
    Animated.spring(scale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }).start();
    confetti.forEach((v, i) => {
      v.setValue(0);
      Animated.timing(v, {
        toValue: 1,
        duration: 1100 + (i % 5) * 250,
        delay: i * 40,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    });
  }, [goal]);

  if (!goal) return null;

  const pieces = ['#f0c239', '#f5f2e6', '#8bbf5a', '#c9a233'];

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        {confetti.map((v, i) => {
          const startX = (i / confetti.length) * width;
          const translateY = v.interpolate({ inputRange: [0, 1], outputRange: [-40, 620] });
          const rotate = v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${(i % 2 ? 1 : -1) * 540}deg`] });
          const opacity = v.interpolate({ inputRange: [0, 0.85, 1], outputRange: [1, 1, 0] });
          return (
            <Animated.View
              key={i}
              style={[
                styles.confetti,
                {
                  left: startX,
                  backgroundColor: pieces[i % pieces.length],
                  transform: [{ translateY }, { rotate }],
                  opacity,
                },
              ]}
            />
          );
        })}

        <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
          <View style={styles.badge}>
            <Ionicons name="trophy" size={44} color={colors.bg} />
          </View>
          <Text style={styles.title}>הגעת ליעד הסופי!</Text>
          <Text style={styles.goalName}>{goal.name}</Text>
          <Text style={styles.body}>
            כל הכבוד — הגעת ליעד. מעכשיו {goal.name} עובר ל<Text style={styles.bold}>מצב תחזוקה</Text>:
            ממשיכים לתרגל ברמת היעד הסופי כל יום עד הקבלה, בלי העלאות נוספות.
          </Text>
          <Pressable style={styles.btn} onPress={onClose}>
            <Text style={styles.btnText}>ממשיכים לשמר 💪</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  confetti: {
    position: 'absolute',
    top: 0,
    width: 10,
    height: 16,
    borderRadius: 2,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.gold,
    width: '100%',
    maxWidth: 360,
  },
  badge: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: { color: colors.gold, fontSize: font.h2, fontWeight: '800', textAlign: 'center' },
  goalName: {
    color: colors.cream,
    fontSize: font.h3,
    fontWeight: '700',
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  body: {
    color: colors.creamDim,
    fontSize: font.small,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  bold: { color: colors.cream, fontWeight: '700' },
  btn: {
    backgroundColor: colors.gold,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
  },
  btnText: { color: colors.bg, fontWeight: '800', fontSize: font.body },
});
