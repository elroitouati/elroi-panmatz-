import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, View, Pressable, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, interpolate, Extrapolation,
  cancelAnimation, runOnJS, useAnimatedReaction, useReducedMotion,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spring, space } from '../design/tokens';
import { haptic } from '../design/haptics';

// ============================================================================
//  גיליון תחתון — המתכון "Bottom sheet you can drag to dismiss" מ-animate-expo.
//  • גרירה 1:1, מתחילה מהערך שעל המסך (תופסים באמצע תנועה — אין קפיצה).
//  • מהירות מחליטה, לא מרחק: העפה קצרה סוגרת (project).
//  • המהירות נמסרת לקפיץ — אין "תפר" בין האצבע לאנימציה.
//  • מעל הקצה העליון: התנגדות הולכת וגדלה (rubberband), לא עצירה.
//  • בסגירה overshootClamping — הגיליון לא מבזיק רווח מתחת למסך.
//  • העמוד שמאחור נדחף לאחור (SheetHost) — "dim to focus" של אפל.
// ============================================================================

function project(velocity, rate = 0.998) {
  'worklet';
  return ((velocity / 1000) * rate) / (1 - rate);
}
function rubberband(overshoot, dimension, c = 0.55) {
  'worklet';
  return (overshoot * dimension * c) / (dimension + c * Math.abs(overshoot));
}

// ---- הדחיפה לאחור של העמוד ----
const HostCtx = createContext(null);

export function SheetHost({ children }) {
  const progress = useSharedValue(0);   // 0 = אין גיליון, 1 = גיליון פתוח
  const page = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - 0.06 * progress.value }],
    borderRadius: 14 * progress.value,
  }));
  return (
    <HostCtx.Provider value={progress}>
      <Animated.View style={[styles.page, page]}>{children}</Animated.View>
    </HostCtx.Provider>
  );
}

const OVERSHOOT = 80; // גוף נסתר מתחת למסך, כדי שקפיצה למעלה לא תחשוף רווח

export default function Sheet({ visible, onClose, children, scroll }) {
  const host = useContext(HostCtx);
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(visible);
  const height = useSharedValue(700);
  const y = useSharedValue(9999);        // פיקסלים מהמצב הפתוח
  const start = useSharedValue(0);
  const opened = useRef(false);
  const closingByGesture = useRef(false);

  // הסנכרון עם העמוד שמאחור מחושב על ה-UI thread, בלי רינדור
  useAnimatedReaction(
    () => interpolate(y.value, [0, height.value], [1, 0], Extrapolation.CLAMP),
    (p) => { if (host) host.value = p; },
  );

  const finishClose = () => {
    opened.current = false;
    setMounted(false);
    if (closingByGesture.current) { closingByGesture.current = false; onClose?.(); }
  };

  useEffect(() => {
    if (visible) { setMounted(true); return; }
    if (!mounted) return;
    if (closingByGesture.current) return;          // הגרירה כבר מנפישה את הסגירה
    if (reduced) { y.value = height.value; finishClose(); return; }
    y.value = withSpring(height.value, spring.sheetClose, (f) => { if (f) runOnJS(finishClose)(); });
  }, [visible]);

  const onLayout = (e) => {
    height.value = e.nativeEvent.layout.height - OVERSHOOT;
    if (!opened.current && visible) {
      opened.current = true;
      y.value = height.value;
      // נפתח בלחיצה — אין מומנטום של אצבע, ולכן אין קפיצה (dampingRatio 1)
      y.value = reduced ? 0 : withSpring(0, spring.sheetOpen);
    }
  };

  const pan = useMemo(() => Gesture.Pan()
    .maxPointers(1)                       // אצבע שנייה לא מקפיצה את הגיליון
    .activeOffsetY([-10, 10])
    .onStart(() => { cancelAnimation(y); start.value = y.value; })
    .onUpdate((e) => {
      const next = start.value + e.translationY;
      y.value = next >= 0 ? next : -rubberband(-next, height.value);
    })
    .onEnd((e) => {
      const projected = y.value + project(e.velocityY);
      if (projected > height.value * 0.4) {
        runOnJS(markGesture)();
        y.value = withSpring(height.value, { ...spring.sheetClose, velocity: e.velocityY },
          (f) => { if (f) runOnJS(finishClose)(); });
      } else {
        // חזרה עם המומנטום של האצבע — כאן קפיצה קלה מוצדקת
        y.value = withSpring(0, { ...spring.sheetSnap, velocity: e.velocityY });
        runOnJS(haptic.light)();
      }
    }), []);

  function markGesture() { closingByGesture.current = true; }

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  const scrimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(y.value, [0, height.value], [1, 0], Extrapolation.CLAMP),
  }));

  if (!mounted) return null;

  const Body = scroll ? ScrollView : View;

  return (
    <Modal transparent visible statusBarTranslucent animationType="none" onRequestClose={onClose}>
      <GestureHandlerRootView style={styles.fill}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.scrim, scrimStyle]}>
          <Pressable style={styles.fill} onPress={onClose} accessibilityLabel="סגירה" />
        </Animated.View>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.kav} pointerEvents="box-none">
          <Animated.View
            onLayout={onLayout}
            style={[styles.sheet, { paddingBottom: OVERSHOOT + insets.bottom + space[4] }, sheetStyle]}
          >
            <GestureDetector gesture={pan}>
              <View style={styles.grabZone} accessibilityLabel="ידית גרירה">
                <View style={styles.grabber} />
              </View>
            </GestureDetector>
            <Body
              style={scroll ? styles.scroll : undefined}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {children}
            </Body>
          </Animated.View>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, overflow: 'hidden', backgroundColor: colors.bg },
  fill: { flex: 1 },
  scrim: { backgroundColor: colors.scrim },
  kav: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    marginBottom: -OVERSHOOT,
    backgroundColor: colors.bgDeep,
    borderTopStartRadius: radius.sheet,
    borderTopEndRadius: radius.sheet,
    paddingHorizontal: space[5],
    maxHeight: '92%',
  },
  grabZone: { paddingTop: space[2], paddingBottom: space[4], alignItems: 'center' },
  grabber: { width: 38, height: 5, borderRadius: 3, backgroundColor: colors.ink3 },
  scroll: { flexGrow: 0, flexShrink: 1 },
});
