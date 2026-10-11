import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, space, type } from '../design/tokens';
import { haptic } from '../design/haptics';

// ============================================================================
//  סרגל הטאבים.
//  • לחיצה על טאב: מעבר מיידי, בלי אנימציה (emil: פעולה של עשרות פעמים ביום).
//  • החלקה בין מסכים: הזהב עובר בין האייקונים יחד עם האצבע — position מגיע
//    מה-pager ומונע ב-native driver, כך שאין אנימציה עם זמן, רק מעקב 1:1.
//  • רטט "בחירה" אחד כשהמסך מתחלף, באותו רגע — בלחיצה ובהחלקה כאחד.
//  המצב הפעיל: אייקון מלא וזהב — צורה ולא רק צבע.
// ============================================================================

const ICONS = {
  'היום': 'home',
  'כושר': 'barbell',
  'הלוח שלי': 'calendar',
  'פסיכוטכני': 'bulb',
};

export default function TabBar({ state, navigation, position }) {
  const insets = useSafeAreaInsets();
  const prev = useRef(state.index);

  useEffect(() => {
    if (prev.current !== state.index) haptic.selection();
    prev.current = state.index;
  }, [state.index]);

  const n = state.routes.length;

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, space[2]) }]}>
      {Platform.OS === 'ios' ? <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} /> : null}
      <View style={[StyleSheet.absoluteFill, styles.tint]} />
      <View style={styles.hairline} />
      {state.routes.map((route, i) => {
        const focused = state.index === i;
        const icon = ICONS[route.name] || 'ellipse';
        // 1 כשהמסך הזה במרכז, 0 כשהוא מסך שלם הצידה. בלי position — לפי index.
        const on = position
          ? position.interpolate({
              inputRange: [i - 1, i, i + 1].map((v) => Math.max(-1, Math.min(n, v))),
              outputRange: [0, 1, 0],
              extrapolate: 'clamp',
            })
          : focused ? 1 : 0;
        const off = position ? Animated.subtract(1, on) : 1 - on;

        const onPress = () => {
          const e = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !e.defaultPrevented) navigation.navigate(route.name);
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={route.name}
            style={styles.item}
          >
            <View style={styles.iconBox}>
              <Animated.View style={[StyleSheet.absoluteFill, styles.center, { opacity: off }]}>
                <Ionicons name={`${icon}-outline`} size={24} color={colors.ink3} />
              </Animated.View>
              <Animated.View style={[StyleSheet.absoluteFill, styles.center, { opacity: on }]}>
                <Ionicons name={icon} size={24} color={colors.gold} />
              </Animated.View>
            </View>
            <View>
              <Animated.Text style={[styles.label, { color: colors.ink3, opacity: off }]} numberOfLines={1}>
                {route.name}
              </Animated.Text>
              <Animated.Text style={[styles.label, styles.labelOn, { opacity: on }]} numberOfLines={1}>
                {route.name}
              </Animated.Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { position: 'absolute', start: 0, end: 0, bottom: 0, flexDirection: 'row', paddingTop: space[2] },
  tint: { backgroundColor: Platform.OS === 'ios' ? colors.barTint : colors.bgDeep },
  hairline: { position: 'absolute', top: 0, start: 0, end: 0, height: StyleSheet.hairlineWidth, backgroundColor: colors.separator },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, minHeight: 48 },
  iconBox: { width: 28, height: 26 },
  center: { alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: type.family.medium, fontSize: type.tab[0], lineHeight: type.tab[1], letterSpacing: 0, includeFontPadding: false, textAlign: 'center' },
  labelOn: { position: 'absolute', top: 0, start: 0, end: 0, color: colors.gold },
});
