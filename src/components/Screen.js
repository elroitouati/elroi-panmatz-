import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedScrollHandler, useAnimatedStyle, interpolate, Extrapolation,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, layout, space } from '../design/tokens';
import { text } from '../design/typography';

// ============================================================================
//  מסך עם כותרת גדולה שמתקפלת — כמו באפליקציות של אפל.
//  הכותרת הגדולה גוללת עם התוכן; כשהיא יוצאת מהמסך, סרגל קומפקטי מופיע.
//  התנועה צמודה לגלילה (לא אנימציה עם זמן), ולכן אין מה להפחית בה.
//  ה-BlurView סטטי — מנפישים רק את השקיפות של העטיפה (טשטוש מונפש יקר).
// ============================================================================

const BAR = 44;

export default function Screen({ title, overline, action, children, bottomInset = 120 }) {
  const insets = useSafeAreaInsets();
  const y = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => { y.value = e.contentOffset.y; });

  const bar = useAnimatedStyle(() => ({
    opacity: interpolate(y.value, [36, 64], [0, 1], Extrapolation.CLAMP),
  }));
  const big = useAnimatedStyle(() => ({
    opacity: interpolate(y.value, [20, 56], [1, 0], Extrapolation.CLAMP),
  }));

  return (
    <View style={styles.root}>
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + space[4],
          paddingBottom: insets.bottom + bottomInset,
          paddingHorizontal: layout.gutter,
        }}
      >
        <Animated.View style={[styles.head, big]}>
          <View style={styles.headText}>
            {overline ? <Text style={text.sub} numberOfLines={1}>{overline}</Text> : null}
            <Text style={text.largeTitle} numberOfLines={1} accessibilityRole="header">{title}</Text>
          </View>
          {action}
        </Animated.View>
        {children}
      </Animated.ScrollView>

      <Animated.View pointerEvents="none" style={[styles.bar, { height: insets.top + BAR }, bar]}>
        {Platform.OS === 'ios' ? <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} /> : null}
        <View style={[StyleSheet.absoluteFill, styles.tint]} />
        <Text style={[text.headlineStrong, styles.barTitle, { marginTop: insets.top }]} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.hairline} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  head: { flexDirection: 'row', alignItems: 'flex-end', gap: space[3], marginBottom: space[5] },
  headText: { flex: 1, minWidth: 0 },
  bar: { position: 'absolute', top: 0, start: 0, end: 0, justifyContent: 'center' },
  tint: { backgroundColor: Platform.OS === 'ios' ? colors.barTint : colors.bgDeep },
  barTitle: { textAlign: 'center', lineHeight: BAR, height: BAR },
  hairline: { position: 'absolute', bottom: 0, start: 0, end: 0, height: StyleSheet.hairlineWidth, backgroundColor: colors.separator },
});
