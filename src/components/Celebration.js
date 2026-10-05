import React, { useEffect, useRef, useState } from 'react';
import { Modal, View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useSharedValue, useAnimatedStyle, useAnimatedProps, withTiming, withDelay,
  useReducedMotion,
} from 'react-native-reanimated';
import Ring from './Ring';
import Button from './Button';
import { colors, radius, space, ease } from '../design/tokens';
import { text } from '../design/typography';
import { haptic } from '../design/haptics';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const CHECK_LEN = 48;

// ============================================================================
//  הגעה ליעד הסופי — רגע נדיר, ולכן היחיד שמקבל קצת יותר תנועה:
//  הטבעת נסגרת, הווי נכתב פנימה, ורטט "הצלחה" אחד באותו פריים שהווי מופיע.
//  בלי קונפטי. הפחתת תנועה: הכל מופיע מיד, הרטט נשאר.
// ============================================================================

export default function Celebration({ goal, onClose }) {
  const reduced = useReducedMotion();
  const [ring, setRing] = useState(0);
  const last = useRef(goal);
  if (goal) last.current = goal;
  const g = last.current;

  const card = useSharedValue(0);
  const draw = useSharedValue(0);

  useEffect(() => {
    if (!goal) return;
    if (reduced) {
      card.value = 1; draw.value = 1; setRing(1); haptic.success();
      return;
    }
    card.value = 0; draw.value = 0; setRing(0);
    card.value = withTiming(1, { duration: 250, easing: ease.out });
    const t = setTimeout(() => setRing(1), 120);           // הטבעת: 300ms
    draw.value = withDelay(440, withTiming(1, { duration: 260, easing: ease.out }));
    const h = setTimeout(() => haptic.success(), 440);     // אותו פריים שהווי מתחיל
    return () => { clearTimeout(t); clearTimeout(h); };
  }, [goal, reduced]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: card.value,
    transform: [{ scale: 0.96 + 0.04 * card.value }],
  }));
  const scrim = useAnimatedStyle(() => ({ opacity: card.value }));
  const check = useAnimatedProps(() => ({ strokeDashoffset: CHECK_LEN * (1 - draw.value) }));

  if (!goal || !g) return null;

  return (
    <Modal transparent visible statusBarTranslucent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.scrim, scrim]} />
      <View style={styles.center}>
        <Animated.View style={[styles.card, cardStyle]} accessibilityViewIsModal>
          <Ring progress={ring} size={120} stroke={10}>
            <Svg width={48} height={48} viewBox="0 0 48 48">
              <AnimatedPath
                d="M12 25l8 8 16-17"
                stroke={colors.gold}
                strokeWidth={5}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                strokeDasharray={CHECK_LEN}
                animatedProps={check}
              />
            </Svg>
          </Ring>
          <Text style={[text.title, styles.centerText, styles.title]}>הגעת ליעד</Text>
          <Text style={[text.headline, styles.centerText, styles.gold]}>{g.name}</Text>
          <Text style={[text.sub, styles.centerText, styles.body]}>
            מעכשיו שומרים על הרמה הזו עד הקבלה.
          </Text>
          <Button label="המשך" variant="primary" onPress={onClose} wrapStyle={styles.cta} />
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { backgroundColor: colors.scrim },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space[6] },
  card: {
    width: '100%', maxWidth: 340, alignItems: 'center',
    backgroundColor: colors.group, borderRadius: radius.card, padding: space[6],
  },
  centerText: { textAlign: 'center' },
  title: { marginTop: space[5] },
  gold: { color: colors.gold, marginTop: space[1] },
  body: { marginTop: space[3] },
  cta: { alignSelf: 'stretch', marginTop: space[6] },
});
