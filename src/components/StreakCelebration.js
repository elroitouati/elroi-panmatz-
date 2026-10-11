import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withDelay, withSpring, useReducedMotion,
} from 'react-native-reanimated';
import Button from './Button';
import { colors, radius, space, type, ease, keep } from '../design/tokens';
import { ltr } from '../design/rtl';
import { text } from '../design/typography';
import { haptic } from '../design/haptics';

// ============================================================================
//  חגיגת רצף — 7, 14, 30 ימים. רגע נדיר, ולכן כאן חי תקציב ה"דילייט":
//  1. הכרטיס נכנס (250ms ease-out, מ-0.96 — אף פעם לא מאפס).
//  2. הלהבה "נוחתת": מתחילה ב-0.6 וקופצת ל-1 בקפיץ עם overshoot קל
//     (dampingRatio 0.55) — רטט הצלחה אחד באותו פריים.
//  3. גל אור אחד יוצא מהלהבה ונעלם (600ms). פעם אחת — לא לולאה.
//  4. המספר והטקסט עולים פנימה אחרי הלהבה (120ms השהיה).
//  הפחתת תנועה: רק שקיפות. הרטט נשאר.
// ============================================================================

const COPY = {
  7: 'שבוע שלם בלי לפספס.',
  14: 'שבועיים ברצף. זה כבר הרגל.',
  30: 'חודש שלם. ככה מתקבלים.',
};
const copyFor = (n) => COPY[n] || `${n} ימים ברצף. אתה בדרך.`;

export default function StreakCelebration({ value, onClose }) {
  const reduced = useReducedMotion();
  const last = useRef(value);
  if (value) last.current = value;
  const n = last.current;

  const card = useSharedValue(0);
  const flame = useSharedValue(0);
  const wave = useSharedValue(0);
  const copy = useSharedValue(0);

  useEffect(() => {
    if (!value) return;
    if (reduced) {
      card.value = withTiming(1, { duration: 200, ...keep });
      flame.value = withTiming(1, { duration: 200, ...keep });
      copy.value = withDelay(120, withTiming(1, { duration: 200, ...keep }));
      wave.value = 1;
      haptic.success();
      return;
    }
    card.value = 0; flame.value = 0; wave.value = 0; copy.value = 0;
    card.value = withTiming(1, { duration: 250, easing: ease.out });
    flame.value = withDelay(120, withSpring(1, { duration: 450, dampingRatio: 0.55 }));
    wave.value = withDelay(120, withTiming(1, { duration: 600, easing: ease.out }));
    copy.value = withDelay(240, withTiming(1, { duration: 250, easing: ease.out }));
    const h = setTimeout(() => haptic.success(), 120); // אותו רגע שהלהבה נוחתת
    return () => clearTimeout(h);
  }, [value, reduced]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: card.value,
    transform: [{ scale: reduced ? 1 : 0.96 + 0.04 * card.value }],
  }));
  const scrim = useAnimatedStyle(() => ({ opacity: card.value }));
  const flameStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, flame.value * 2),
    transform: [{ scale: reduced ? 1 : 0.6 + 0.4 * flame.value }],
  }));
  const waveStyle = useAnimatedStyle(() => ({
    opacity: reduced ? 0 : 0.45 * (1 - wave.value),
    transform: [{ scale: 1 + 0.6 * wave.value }],
  }));
  const copyStyle = useAnimatedStyle(() => ({
    opacity: copy.value,
    transform: [{ translateY: reduced ? 0 : 10 * (1 - copy.value) }],
  }));

  if (!value || !n) return null;

  return (
    <Modal transparent visible statusBarTranslucent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.scrim, scrim]} />
      <View style={styles.center}>
        <Animated.View style={[styles.card, cardStyle]} accessibilityViewIsModal>
          <View style={styles.flameWrap}>
            <Animated.View style={[styles.wave, waveStyle]} />
            <Animated.View style={[styles.flame, flameStyle]}>
              <Ionicons name="flame" size={46} color={colors.onGold} />
            </Animated.View>
          </View>

          <Animated.View style={[styles.copy, copyStyle]}>
            <Text style={styles.number} allowFontScaling={false}>{ltr(n)}</Text>
            <Text style={[text.title, styles.centerText]}>ימים ברצף</Text>
            <Text style={[text.sub, styles.centerText, styles.body]}>{copyFor(n)}</Text>
          </Animated.View>

          <Button label="ממשיכים" variant="primary" onPress={onClose} wrapStyle={styles.cta} />
        </Animated.View>
      </View>
    </Modal>
  );
}

const FLAME = 96;
const styles = StyleSheet.create({
  scrim: { backgroundColor: colors.scrim },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space[6] },
  card: {
    width: '100%', maxWidth: 340, alignItems: 'center',
    backgroundColor: colors.group, borderRadius: radius.card, padding: space[6],
  },
  flameWrap: { width: FLAME, height: FLAME, alignItems: 'center', justifyContent: 'center' },
  wave: { position: 'absolute', width: FLAME, height: FLAME, borderRadius: FLAME / 2, backgroundColor: colors.gold },
  flame: {
    width: FLAME, height: FLAME, borderRadius: FLAME / 2, backgroundColor: colors.gold,
    alignItems: 'center', justifyContent: 'center',
  },
  copy: { alignItems: 'center', marginTop: space[4] },
  number: {
    fontFamily: type.family.heavy, fontSize: 56, lineHeight: 62, color: colors.gold,
    textAlign: 'center', includeFontPadding: false, ...type.tabular,
  },
  centerText: { textAlign: 'center' },
  body: { marginTop: space[2] },
  cta: { alignSelf: 'stretch', marginTop: space[6] },
});
