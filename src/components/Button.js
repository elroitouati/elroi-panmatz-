import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Press from './Press';
import { colors, radius, space } from '../design/tokens';
import { text } from '../design/typography';

// כפתור אחד, ארבעה תפקידים. כפתור ראשי (זהב) אחד בלבד לכל מסך.
// הכפתור קורא לפעולה בשמה ("שמירת התוצאה"), לא "אישור".
const V = {
  primary: { bg: colors.gold, fg: colors.onGold },
  secondary: { bg: colors.bgDeep, fg: colors.ink },
  done: { bg: colors.bgDeep, fg: colors.gold },
  destructive: { bg: colors.redSoft, fg: colors.red },   // הרסני — תמיד אדום
  plain: { bg: 'transparent', fg: colors.ink2 },
};

export default function Button({ label, onPress, variant = 'secondary', icon, disabled, style, wrapStyle, accessibilityHint }) {
  const v = V[variant] || V.secondary;
  return (
    <Press
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      wrapStyle={wrapStyle}
      style={[styles.btn, { backgroundColor: v.bg, opacity: disabled ? 0.4 : 1 }, style]}
    >
      <View style={styles.content}>
        {icon ? <Ionicons name={icon} size={18} color={v.fg} /> : null}
        <Text style={[text.button, { color: v.fg }]} numberOfLines={1}>{label}</Text>
      </View>
    </Press>
  );
}

const styles = StyleSheet.create({
  btn: { height: 50, borderRadius: radius.control, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space[4] },
  content: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
});
