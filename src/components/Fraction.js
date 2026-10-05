import React from 'react';
import { Text } from 'react-native';
import { colors, type } from '../design/tokens';

const LRI = '⁦';
const PDI = '⁩';

// "1/4" בתוך טבעת: ספרה גדולה ו"/4" קטן אחריה, משמאל לימין.
// טקסט מקונן אחד עם בידוד LTR — לא שורת flex, כי style.direction לא נתמך
// באנדרואיד והשורה מתהפכת ל-"4/ 1".
export default function Fraction({ value, total }) {
  return (
    <Text style={styles.big} allowFontScaling={false} accessibilityLabel={`${value} מתוך ${total}`}>
      {LRI}{value}
      <Text style={styles.small}>/{total}</Text>
      {PDI}
    </Text>
  );
}

const styles = {
  big: {
    fontFamily: type.family.heavy, fontSize: type.ring[0], lineHeight: type.ring[1] + 4,
    color: colors.ink, textAlign: 'center', includeFontPadding: false, ...type.tabular,
  },
  small: { fontFamily: type.family.bold, fontSize: 18, color: colors.ink2 },
};
