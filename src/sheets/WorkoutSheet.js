import React, { useRef } from 'react';
import { Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Sheet from '../components/Sheet';
import { Section, Row } from '../components/Group';
import { colors, space } from '../design/tokens';
import { text } from '../design/typography';
import { haptic } from '../design/haptics';
import { WORKOUTS, WORKOUT_ORDER } from '../utils/weekPlan';
import { HEB_WEEKDAYS_FULL } from '../utils/date';

// בחירת האימון ליום בתוכנית. בחירה = שמירה וסגירה, כמו בורר של iOS.
// target = { day, type }
export default function WorkoutSheet({ target, onClose, onSelect }) {
  const last = useRef(target);
  if (target) last.current = target;
  const t = last.current;
  if (!t) return null;

  return (
    <Sheet visible={!!target} onClose={onClose}>
      <Text style={[text.title, styles.center]}>יום {HEB_WEEKDAYS_FULL[t.day]}</Text>
      <Text style={[text.sub, styles.center, styles.sub]}>מה עושים ביום הזה?</Text>
      <Section>
        {WORKOUT_ORDER.map((type) => {
          const on = type === t.type;
          return (
            <Row
              key={type}
              title={WORKOUTS[type].label}
              leading={<Ionicons name={WORKOUTS[type].icon} size={22} color={on ? colors.gold : colors.ink2} />}
              trailing={on ? <Ionicons name="checkmark" size={22} color={colors.gold} /> : null}
              onPress={() => { haptic.selection(); onSelect(t.day, type); onClose(); }}
              accessibilityLabel={`${WORKOUTS[type].label}${on ? ', נבחר' : ''}`}
            />
          );
        })}
      </Section>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  center: { textAlign: 'center' },
  sub: { marginBottom: space[5] },
});
