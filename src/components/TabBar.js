import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, space, type } from '../design/tokens';
import { haptic } from '../design/haptics';

// ============================================================================
//  סרגל הטאבים. מעבר טאב קורה עשרות פעמים ביום — ולכן בלי שום אנימציה
//  (emil-design-eng: פעולה תכופה = אפס תנועה). המצב הפעיל: אייקון מלא וזהב,
//  כך שהוא מובחן בצורה ולא רק בצבע. חומר שקוף מעל התוכן, כמו באייפון.
// ============================================================================

const ICONS = {
  'היום': 'home',
  'כושר': 'barbell',
  'הלוח שלי': 'calendar',
  'פסיכוטכני': 'bulb',
};

export default function TabBar({ state, navigation }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, space[2]) }]}>
      {Platform.OS === 'ios' ? <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} /> : null}
      <View style={[StyleSheet.absoluteFill, styles.tint]} />
      <View style={styles.hairline} />
      {state.routes.map((route, i) => {
        const focused = state.index === i;
        const icon = ICONS[route.name] || 'ellipse';
        const onPress = () => {
          const e = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !e.defaultPrevented) {
            haptic.selection();
            navigation.navigate(route.name);
          }
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
            <Ionicons name={focused ? icon : `${icon}-outline`} size={24} color={focused ? colors.gold : colors.ink3} />
            <Text style={[styles.label, { color: focused ? colors.gold : colors.ink3 }]} numberOfLines={1}>
              {route.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { position: 'absolute', start: 0, end: 0, bottom: 0, flexDirection: 'row', paddingTop: space[2] },
  tint: { backgroundColor: Platform.OS === 'ios' ? colors.barTint : 'rgba(47,58,32,0.97)' },
  hairline: { position: 'absolute', top: 0, start: 0, end: 0, height: StyleSheet.hairlineWidth, backgroundColor: colors.separator },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, minHeight: 48 },
  label: { fontFamily: type.family.medium, fontSize: type.tab[0], lineHeight: type.tab[1], letterSpacing: 0, includeFontPadding: false },
});
