import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors, radius, space, type } from '../design/tokens';
import { text } from '../design/typography';
import { dir } from '../design/rtl';

// שדה טקסט: תווית מעל, placeholder שמדגים את הפורמט, רמז מתחת.
// מספרים נכתבים LTR. גודל 17 — מתחת ל-16 iOS מגדיל את המסך בפוקוס.
export default function Input({ label, hint, numeric, style, ...rest }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={style}>
      {label ? <Text style={[text.caption, styles.label]}>{label}</Text> : null}
      <TextInput
        {...rest}
        onFocus={(e) => { setFocused(true); rest.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); rest.onBlur?.(e); }}
        placeholderTextColor={colors.ink3}
        selectionColor={colors.gold}
        accessibilityLabel={label}
        style={[
          styles.input,
          numeric && styles.numeric,
          focused && styles.focused,
        ]}
      />
      {hint ? <Text style={[text.caption, styles.hint]}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { marginBottom: space[2] },
  input: {
    minHeight: 50, borderRadius: radius.control, backgroundColor: colors.bgDeep,
    paddingHorizontal: space[4], color: colors.ink, fontSize: type.body[0],
    fontFamily: type.family.regular, textAlign: dir.start,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  numeric: { writingDirection: 'ltr', textAlign: 'center', ...type.tabular },
  focused: { borderColor: colors.gold },
  hint: { marginTop: space[2] },
});
