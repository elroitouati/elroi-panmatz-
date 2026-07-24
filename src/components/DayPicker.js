import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, radius, spacing, font } from '../theme';
import { HEB_WEEKDAYS_SHORT } from '../utils/date';

// בורר ימי אימון שבועי (0=ראשון..6=שבת). RTL: ראשון מימין.
export default function DayPicker({ selected, onChange }) {
  const toggle = (d) => {
    if (selected.includes(d)) onChange(selected.filter((x) => x !== d));
    else onChange([...selected, d]);
  };
  return (
    <View style={styles.row}>
      {HEB_WEEKDAYS_SHORT.map((label, d) => {
        const on = selected.includes(d);
        return (
          <Pressable key={d} onPress={() => toggle(d)} style={[styles.day, on && styles.dayOn]}>
            <Text style={[styles.dayText, on && styles.dayTextOn]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row-reverse', justifyContent: 'space-between', gap: 6 },
  day: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: radius.sm,
    backgroundColor: colors.bgDeep,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayOn: { backgroundColor: colors.gold, borderColor: colors.gold },
  dayText: { color: colors.creamDim, fontSize: font.small, fontWeight: '700' },
  dayTextOn: { color: colors.bg, fontWeight: '800' },
});
