import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Tile from './Tile';
import Num from './Num';
import { colors, space, type } from '../design/tokens';
import { text } from '../design/typography';

// ============================================================================
//  StatTile — אריח סטטיסטיקה בבנטו.
//  התווית קטנה ועמומה *מעל*, המספר גדול מתחתיה. זה הסדר הנכון:
//  הערך הוא מה שבאים בשבילו, לא השם שלו. ההיפוך (שם גדול, מספר קטן)
//  הוא ההבדל הבולט ביותר בין דשבורד חובבני למקצועי.
//  גובה מינימלי קבוע — אחרת הרשת מתגלית כשהתוכן באורך שונה.
// ============================================================================

export default function StatTile({ label, value, unit, icon, accent = false }) {
  const valueColor = accent ? colors.accent : colors.text1;

  return (
    <Tile accent={accent} style={styles.tile}>
      <View style={styles.head}>
        <Text style={text.label} numberOfLines={1}>{label}</Text>
        {icon ? (
          <Ionicons
            name={icon}
            size={16}
            color={accent ? colors.accent : colors.text3}
          />
        ) : null}
      </View>
      <Num value={value} unit={unit} size="statSm" color={valueColor} style={styles.num} />
    </Tile>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minHeight: 96,           // קבוע — שומר על רשת ישרה
    justifyContent: 'space-between',
  },
  // 'row' מתהפך תחת RTL: התווית מימין, האייקון בפינה הנגדית.
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[2],
  },
  num: { marginTop: space[2] },
});
