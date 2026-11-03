import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, I18nManager } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, useReducedMotion } from 'react-native-reanimated';
import { colors, radius, space, type, ease } from '../design/tokens';
import { haptic } from '../design/haptics';

// ============================================================================
//  בורר מקטעים בסגנון iOS. הגלולה הזהובה מחליקה אל המקטע שנבחר —
//  state indication, 200ms ease-out, transform בלבד (translateX), כך שאין
//  פריסה מחדש. ב-RTL המקטע הראשון מימין והגלולה זזה שמאלה.
//  רטט "בחירה" אחד בכל החלפה. הפחתת תנועה: הגלולה קופצת, הצבע מתחלף.
// ============================================================================

export default function Segmented({ options, value, onChange }) {
  const reduced = useReducedMotion();
  const [w, setW] = useState(0);
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  const x = useSharedValue(0);
  const seg = w / options.length;
  const dirSign = I18nManager.isRTL ? -1 : 1;

  useEffect(() => {
    const to = dirSign * index * seg;
    x.value = reduced ? to : withTiming(to, { duration: 200, easing: ease.out });
  }, [index, seg, reduced]);

  const pill = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <View style={styles.track} onLayout={(e) => setW(e.nativeEvent.layout.width - 4)} accessibilityRole="tablist">
      {w > 0 ? <Animated.View style={[styles.pill, { width: seg }, pill]} /> : null}
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => { if (!on) { haptic.selection(); onChange(o.value); } }}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={o.label}
            style={styles.item}
          >
            <Text style={[styles.label, on && styles.labelOn]} numberOfLines={1}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row', backgroundColor: colors.bgDeep, borderRadius: radius.control,
    padding: 2, marginBottom: space[4],
  },
  pill: {
    position: 'absolute', top: 2, bottom: 2, start: 2,
    backgroundColor: colors.gold, borderRadius: radius.control - 2,
  },
  item: { flex: 1, minHeight: 40, alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: type.family.medium, fontSize: 14, color: colors.ink2, includeFontPadding: false },
  labelOn: { fontFamily: type.family.bold, color: colors.onGold },
});
