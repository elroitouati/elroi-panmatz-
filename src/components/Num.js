import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { type } from '../design/tokens';
import { text, unitStyle } from '../design/typography';
import { ltr } from '../design/rtl';

// ============================================================================
//  Num — חתימת האפליקציה.
//  המספר הוא הגיבור; היחידה יורדת ל-45% מגודלו ול-60% שקיפות, ומיושרת
//  לבייסליין שלו. הפרט הזה נושא יותר איכות נתפסת מכל אפקט אחר במסך.
//
//  המספר תמיד מבודד ל-LTR ותמיד tabular — כך הוא לא מתהפך בתוך משפט עברי
//  ולא קופץ כשהערך מתעדכן.
// ============================================================================

export default function Num({
  value,
  unit,
  size = 'stat',        // 'stat' (44) | 'statSm' (32)
  color,
  style,
}) {
  const preset = size === 'stat' ? text.stat : text.statSm;
  const numberSize = size === 'stat' ? type.size.stat : type.size.statSm;

  return (
    <View style={[styles.row, style]}>
      {/* בלי adjustsFontSizeToFit: בשילוב עם lineHeight קבוע אנדרואיד
          מרנדר את הספרות חתוכות ועם קו לרוחבן. במקום זה המספר נשאר
          בגודלו והמיכל מקבל מספיק מקום. */}
      <Text style={[preset, color && { color }]} allowFontScaling={false} numberOfLines={1}>
        {ltr(value)}
      </Text>
      {unit ? (
        <Text
          style={[preset, unitStyle(numberSize), color && { color }]}
          allowFontScaling={false}
          numberOfLines={1}
        >
          {unit}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // 'row' ולא 'row-reverse': תחת RTL יוגה מהפכת את הציר בעצמה,
  // כך שהמספר יושב מימין והיחידה משמאלו — בלי היפוך ידני.
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
});
