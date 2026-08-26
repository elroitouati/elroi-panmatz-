import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, radius, space, touch } from '../design/tokens';
import { text } from '../design/typography';
import { HEB_WEEKDAYS_SHORT, HEB_WEEKDAYS_FULL } from '../utils/date';

// בורר ימי אימון. 'row' מתהפך תחת RTL כך שיום ראשון יושב מימין.
// המצב הנבחר מסומן במילוי ובמשקל, לא רק בצבע.
export default function DayPicker({ selected, onChange }) {
  const toggle = (d) =>
    onChange(selected.includes(d) ? selected.filter((x) => x !== d) : [...selected, d]);

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
            style={({ pressed }) => [
              styles.day,
              on && styles.dayOn,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[text.label, on ? styles.textOn : styles.textOff]}>{short}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space[2] },
  day: {
    flex: 1,
    minHeight: touch.min,
    borderRadius: radius.sm,
    backgroundColor: colors.surface1,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  pressed: { opacity: 0.8 },
  textOn: { color: colors.onAccent },
  textOff: { color: colors.text2 },
});
