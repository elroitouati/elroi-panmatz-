import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, space, touch, type } from '../design/tokens';
import { text } from '../design/typography';
import { dir } from '../design/rtl';

// ============================================================================
//  Input — תווית תמיד מעל השדה, לעולם לא placeholder כתווית
//  (הוא נעלם ברגע שמקלידים ולוקח איתו את ההקשר).
//  ה-placeholder מדגים פורמט ("8:00"), לא חוזר על התווית.
//  שגיאה יושבת ליד השדה, אומרת מה קרה ומה לעשות, ולא נשענת על אדום בלבד.
// ============================================================================

export default function Input({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  hint,
  keyboardType = 'default',
  maxLength,
  numeric = false,     // מספרים: LTR + tabular + מיושר למרכז
  style,
}) {
  return (
    <View style={style}>
      {label ? <Text style={[text.labelStrong, styles.label]}>{label}</Text> : null}

      <TextInput
        style={[
          styles.field,
          numeric && styles.numeric,
          error && styles.fieldError,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.text3}
        keyboardType={keyboardType}
        maxLength={maxLength}
        accessibilityLabel={label}
        allowFontScaling={false}
      />

      {error ? (
        <View style={styles.msgRow}>
          <Ionicons name="alert-circle" size={15} color={colors.danger} />
          <Text style={[text.label, styles.error]}>{error}</Text>
        </View>
      ) : hint ? (
        <Text style={[text.label, styles.hint]}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { marginBottom: space[2] },
  field: {
    minHeight: touch.min,
    backgroundColor: colors.bgSunken,
    borderWidth: 1,
    borderColor: colors.borderInput,
    borderRadius: radius.sm,
    paddingHorizontal: space[3],
    paddingVertical: space[3],
    color: colors.text1,
    fontFamily: type.family.regular,
    fontSize: type.size.body,
    textAlign: dir.start,
  },
  numeric: {
    textAlign: 'center',
    fontFamily: type.family.bold,
    ...type.tabular,
  },
  fieldError: { borderColor: colors.danger },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[1],
    marginTop: space[2],
  },
  error: { color: colors.danger, flex: 1 },
  hint: { marginTop: space[2] },
});
