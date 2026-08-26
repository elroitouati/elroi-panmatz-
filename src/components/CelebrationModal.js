import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from './Button';
import { colors, radius, space, motion } from '../design/tokens';
import { text } from '../design/typography';
import useReducedMotion from '../design/useReducedMotion';

// ============================================================================
//  הגעה ליעד הסופי.
//  בלי קונפטי: הכיוון הוא ציוד ומשמעת, לא צעצוע. במקום זה חותם שנחתם —
//  תג שנכנס פנימה ב-400ms עם עקומה קפיצית קלה, וטקסט שעולה אחריו.
//  כשהמשתמש ביקש להפחית תנועה, הכל מופיע מיד בלי אנימציה.
// ============================================================================

export default function CelebrationModal({ goal, onClose }) {
  const reduced = useReducedMotion();
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!goal) return;
    if (reduced) { enter.setValue(1); return; }
    enter.setValue(0);
    Animated.timing(enter, {
      toValue: 1,
      duration: motion.duration.celebrate,   // 400ms — התקרה
      easing: motion.easing.spring,
      useNativeDriver: true,
    }).start();
  }, [goal, reduced]);

  if (!goal) return null;

  const scale = enter.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] });
  const lift = enter.interpolate({ inputRange: [0, 1], outputRange: [12, 0] });

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
      <View style={styles.scrim}>
        <Animated.View style={[styles.panel, { opacity: enter, transform: [{ scale }] }]}>
          <View style={styles.seal}>
            <Ionicons name="shield-checkmark" size={34} color={colors.onAccent} />
          </View>

          <Animated.View style={{ transform: [{ translateY: lift }], opacity: enter }}>
            <Text style={[text.label, styles.center]}>הגעת ליעד הסופי</Text>
            <Text style={[text.title, styles.center, styles.name]}>{goal.name}</Text>
            <Text style={[text.bodyDim, styles.center, styles.body]}>
              מכאן היעד עובר למצב תחזוקה: ממשיכים ברמה הזו עד הקבלה, בלי העלאות נוספות.
            </Text>
          </Animated.View>

          <Button label="הבנתי" variant="primary" onPress={onClose} style={styles.cta} />
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1, backgroundColor: colors.scrim,
    alignItems: 'center', justifyContent: 'center', padding: space[5],
  },
  panel: {
    width: '100%', maxWidth: 340,
    backgroundColor: colors.bg,
    borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.accentBorder,
    padding: space[6],
    alignItems: 'center',
  },
  seal: {
    width: 64, height: 64, borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: space[5],
  },
  center: { textAlign: 'center' },
  name: { marginTop: space[1] },
  body: { marginTop: space[3] },
  cta: { marginTop: space[6] },
});
