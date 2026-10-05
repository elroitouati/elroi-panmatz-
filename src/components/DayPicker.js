import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, radius, space } from '../design/tokens';
import { text } from '../design/typography';
import { haptic } from '../design/haptics';
import { HEB_WEEKDAYS_SHORT, HEB_WEEKDAYS_FULL } from '../utils/date';

// בורר ימי אימון. 'row' מתהפך ב-RTL — יום ראשון מימין.
// נבחר = מילוי זהב (צורה, לא רק צבע). רטט "בחירה" אחד לכל החלפה.
export default function DayPicker({ selected, onChange }) {
  const toggle = (d) => {
    haptic.selection();
    onChange(selected.includes(d) ? selected.filter((x) => x !== d) : [...selected, d]);
  };
  return (
    <View style={styles.row}>
      {HEB_WEEKDAYS_SHORT.map((short, d) => {
        const on = selected.includes(d);
        return (
          <Pressable
            key={d}
            onPress={() => toggle(d)}
            accessibilityRole="checkbox"
            accessibilityLabel={`יום ${HEB_WEEKDAYS_FULL[d]}`}
            accessibilityState={{ checked: on }}
            style={styles.cell}
          >
            {({ pressed }) => (
              <View style={[styles.day, on && styles.on, pressed && !on && styles.pressed]}>
                <Text style={[text.headline, { color: on ? colors.onGold : colors.ink2 }]}>{short}</Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space[1] },
  cell: { flex: 1, alignItems: 'center' },
  day: {
    width: 40, height: 40, borderRadius: radius.pill, backgroundColor: colors.bgDeep,
    alignItems: 'center', justifyContent: 'center',
  },
  on: { backgroundColor: colors.gold },
  pressed: { backgroundColor: colors.groupPressed },
});
