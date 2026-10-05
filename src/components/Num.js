import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { text, unitStyle } from '../design/typography';
import { type } from '../design/tokens';
import { ltr } from '../design/rtl';

// מספר גיבור: הספרות גדולות, היחידה 45% מגודלן ו-60% שקיפות, על אותו בייסליין.
// תמיד tabular (לא קופץ כשמתעדכן) ותמיד מבודד LTR (לא מתהפך בתוך עברית).
export default function Num({ value, unit, size = 'stat', color, style }) {
  const preset = size === 'stat' ? text.stat : text.statSm;
  const px = size === 'stat' ? type.stat[0] : type.statSm[0];
  return (
    <View style={[styles.row, style]}>
      <Text style={[preset, color && { color }]} numberOfLines={1} allowFontScaling={false}>
        {ltr(value)}
      </Text>
      {unit ? (
        <Text style={[preset, unitStyle(px), color && { color }]} numberOfLines={1} allowFontScaling={false}>
          {unit}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // 'row' — תחת RTL המספר מימין והיחידה משמאלו, בלי היפוך ידני.
  row: { flexDirection: 'row', alignItems: 'baseline', gap: 5 },
});
