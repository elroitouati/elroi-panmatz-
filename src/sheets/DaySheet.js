import React, { useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Sheet from '../components/Sheet';
import Button from '../components/Button';
import { Section, Row } from '../components/Group';
import { colors, radius, space } from '../design/tokens';
import { text } from '../design/typography';
import { ltr } from '../design/rtl';
import { haptic } from '../design/haptics';
import { keyToDate, HEB_WEEKDAYS_FULL, HEB_MONTHS } from '../utils/date';
import { WORKOUTS, workoutFor } from '../utils/weekPlan';
import { formatValue, unitLabel } from '../utils/fitness';

// ============================================================================
//  פירוט יום: מה היה מתוכנן, מה בוצע בפועל, ופעולה אחת ראשית.
//  target = { key, status }
// ============================================================================

const STATUS = {
  done: { label: 'בוצע', color: colors.gold, bg: colors.goldSoft, icon: 'checkmark-circle' },
  missed: { label: 'פספוס', color: colors.red, bg: colors.redSoft, icon: 'close-circle' },
  excused: { label: 'יום מוצדק', color: colors.ink2, bg: colors.bgDeep, icon: 'bandage' },
  today: { label: 'היום', color: colors.ink, bg: colors.bgDeep, icon: 'time' },
  future: { label: 'עוד לא הגיע', color: colors.ink2, bg: colors.bgDeep, icon: 'calendar' },
  rest: { label: 'מנוחה', color: colors.ink2, bg: colors.bgDeep, icon: 'moon' },
};

export default function DaySheet({ target, state, onClose, onSetTrained, onSetExcused }) {
  const last = useRef(target);
  if (target) last.current = target;
  const t = last.current;
  if (!t || !state) return null;

  const date = keyToDate(t.key);
  const title = `יום ${HEB_WEEKDAYS_FULL[date.getDay()]}, ${date.getDate()} ב${HEB_MONTHS[date.getMonth()]}`;
  const log = state.logs[t.key];
  const plan = WORKOUTS[workoutFor(state.weekPlan, date.getDay())];
  const st = STATUS[t.status] || STATUS.rest;
  const future = t.status === 'future';
  const trained = !!log?.trained;
  const excused = !!log?.excused && !trained;

  const goalsDone = Object.entries(log?.goals || {})
    .filter(([, v]) => v?.done)
    .map(([id, v]) => ({ goal: state.goals.find((g) => g.id === id), value: v.value }))
    .filter((x) => x.goal);
  const psych = state.psych.practiceDays.includes(t.key);

  return (
    <Sheet visible={!!target} onClose={onClose} scroll>
      <Text style={[text.title, styles.center]}>{title}</Text>
      <View style={[styles.pill, { backgroundColor: st.bg }]}>
        <Ionicons name={st.icon} size={14} color={st.color} />
        <Text style={[text.captionStrong, { color: st.color }]}>{st.label}</Text>
      </View>

      <Section title="מתוכנן">
        <Row
          title={plan.label}
          leading={<Ionicons name={plan.icon} size={22} color={plan === WORKOUTS.rest ? colors.ink2 : colors.gold} />}
        />
      </Section>

      {goalsDone.length || psych || trained ? (
        <Section title="מה בוצע">
          {goalsDone.map(({ goal, value }) => (
            <Row
              key={goal.id}
              title={goal.name}
              value={value != null && goal.tracking === 'measured' ? `${ltr(formatValue(goal, value))} ${unitLabel(goal)}` : 'בוצע'}
              leading={<Ionicons name="checkmark-circle" size={22} color={colors.gold} />}
            />
          ))}
          {trained && !goalsDone.length ? (
            <Row title="אימון סומן בלוח" leading={<Ionicons name="checkmark-circle" size={22} color={colors.gold} />} />
          ) : null}
          {psych ? (
            <Row title="תרגול פסיכוטכני" leading={<Ionicons name="bulb" size={22} color={colors.gold} />} />
          ) : null}
        </Section>
      ) : null}

      {future ? (
        <Text style={[text.sub, styles.note]}>אפשר לסמן רק יום שכבר הגיע.</Text>
      ) : (
        <View style={styles.actions}>
          <Button
            label={trained ? 'בוצע — ביטול הסימון' : 'התאמנתי ביום הזה'}
            icon={trained ? 'checkmark' : undefined}
            variant={trained ? 'done' : 'primary'}
            onPress={() => {
              if (!trained) haptic.success();
              onSetTrained(t.key, !trained);
              onClose();
            }}
          />
          {!trained ? (
            <Button
              label={excused ? 'ביטול יום מוצדק' : 'יום מוצדק (מחלה / חופש)'}
              icon={excused ? undefined : 'bandage-outline'}
              variant="secondary"
              onPress={() => { haptic.selection(); onSetExcused(t.key, !excused); onClose(); }}
              accessibilityHint="יום מוצדק לא נחשב פספוס ולא שובר את הרצף"
            />
          ) : null}
        </View>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  center: { textAlign: 'center' },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'center',
    borderRadius: radius.pill, paddingHorizontal: space[3], paddingVertical: 5, marginTop: space[2],
  },
  note: { textAlign: 'center', marginTop: space[5] },
  actions: { gap: space[3], marginTop: space[6] },
});
