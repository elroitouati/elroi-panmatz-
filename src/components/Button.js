import React from 'react';
import { Pressable, Text, View, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, space, touch, state, motion } from '../design/tokens';
import { text } from '../design/typography';

// ============================================================================
//  Button — היררכיה: ראשי (מילוי) ← משני (מתאר) ← שלישוני (טקסט) ← הרסני.
//  פעולה ראשית אחת בלבד לכל מסך. שתי ראשיות = אף אחת.
//  הכפתור נושא את שם הפעולה שלו ("שמירת היעד"), לא "אישור".
//  כל מצב מעוצב: רגיל, לחוץ, מושבת, טוען.
// ============================================================================

const VARIANTS = {
  primary: {
    bg: colors.accent,
    bgPressed: colors.accentPressed,
    fg: colors.onAccent,
    border: 'transparent',
  },
  secondary: {
    bg: colors.surface1,
    bgPressed: colors.surface3,
    fg: colors.text1,
    border: colors.border,
  },
  tertiary: {
    bg: 'transparent',
    bgPressed: colors.surface1,
    fg: colors.text2,
    border: 'transparent',
  },
  // הרסני תמיד אדום — לעולם לא בצבע הדגש.
  danger: {
    bg: colors.dangerSurface,
    bgPressed: colors.danger,
    fg: colors.danger,
    border: colors.danger,
  },
};

export default function Button({
  label,
  onPress,
  variant = 'secondary',
  icon,
  disabled = false,
  loading = false,
  fullWidth = true,
  disabledReason,     // מדוע הכפתור מושבת — כפתור מת בלי סיבה הוא מבוי סתום
  style,
}) {
  const v = VARIANTS[variant] || VARIANTS.secondary;
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={inactive ? undefined : onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={disabled ? disabledReason : undefined}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        fullWidth && styles.fullWidth,
        {
          backgroundColor: pressed ? v.bgPressed : v.bg,
          borderColor: v.border,
          opacity: disabled ? state.disabledOpacity : 1,
          transform: [{ scale: pressed ? state.pressedScale : 1 }],
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.fg} />
      ) : (
        <View style={styles.content}>
          {icon ? <Ionicons name={icon} size={18} color={v.fg} /> : null}
          <Text style={[text.button, { color: v.fg }]} numberOfLines={1}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: touch.min,          // 44 — מינימום מטרת מגע
    paddingHorizontal: space[4],
    paddingVertical: space[3],
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: { alignSelf: 'stretch' },
  // 'row' — יוגה מהפכת תחת RTL, האייקון נוחת מימין לטקסט.
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[2],
  },
});
