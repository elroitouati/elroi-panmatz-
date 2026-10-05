import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, radius } from '../design/tokens';
import { haptic } from '../design/haptics';

// סטפר בסגנון iOS: שני כפתורים בגלולה אחת. לחיצה = רטט "בחירה" אחד,
// כי ערך עבר שלב. בלי אנימציה — שינוי ערך שחוזר עשרות פעמים לא מונפש.
function Half({ glyph, label, onPress, disabled, size }) {
  return (
    <Pressable
      onPress={() => { haptic.selection(); onPress(); }}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        { width: size === 'sm' ? 44 : 52, height: size === 'sm' ? 36 : 50 },
        styles.half,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Text style={styles.glyph}>{glyph}</Text>
    </Pressable>
  );
}

export default function Stepper({ onPlus, onMinus, plusLabel, minusLabel, plusDisabled, minusDisabled, size }) {
  return (
    <View style={styles.wrap}>
      <Half glyph="+" label={plusLabel} onPress={onPlus} disabled={plusDisabled} size={size} />
      <View style={styles.sep} />
      <Half glyph="−" label={minusLabel} onPress={onMinus} disabled={minusDisabled} size={size} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', backgroundColor: colors.bgDeep, borderRadius: radius.control, overflow: 'hidden', alignItems: 'center' },
  half: { alignItems: 'center', justifyContent: 'center' },
  pressed: { backgroundColor: colors.groupPressed },
  disabled: { opacity: 0.35 },
  sep: { width: 1, height: 22, backgroundColor: colors.separator },
  glyph: { color: colors.ink, fontSize: 24, lineHeight: 28, includeFontPadding: false },
});
