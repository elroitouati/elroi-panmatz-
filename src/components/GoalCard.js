import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Tile from './Tile';
import Num from './Num';
import Button from './Button';
import ProgressBar from './ProgressBar';
import MiniChart from './MiniChart';
import IconBadge from './IconBadge';
import { colors, space, radius, touch, state as st } from '../design/tokens';
import { text } from '../design/typography';
import { formatValue, unitLabel, goalProgress, reachedFinal, atStart, categoryIcon } from '../utils/fitness';
import { HEB_WEEKDAYS_SHORT } from '../utils/date';

// ============================================================================
//  כרטיס יעד.
//  פעולה ראשית אחת בכרטיס — "סמן ביצוע". כוונון הרמה הוא סרגל מדורג
//  קומפקטי ולא שני כפתורים מתחרים, כדי שההיררכיה תישאר חד-משמעית.
// ============================================================================

function Tag({ label, tone = 'neutral' }) {
  const isAccent = tone === 'accent';
  return (
    <View style={[styles.tag, isAccent ? styles.tagAccent : styles.tagNeutral]}>
      <Text style={[text.label, isAccent ? styles.tagTextAccent : styles.tagText]}>
        {label}
      </Text>
    </View>
  );
}

function StepButton({ icon, label, onPress, disabled }) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.step,
        pressed && !disabled && styles.stepPressed,
        disabled && { opacity: st.disabledOpacity },
      ]}
    >
      <Ionicons name={icon} size={18} color={colors.text1} />
    </Pressable>
  );
}

export default function GoalCard({
  goal, todayDone, isNext, onToggleEnabled, onEdit, onBump, onLower, onMarkDone, onUnmark,
}) {
  const measured = goal.tracking === 'measured';
  const maxed = reachedFinal(goal) || goal.maintenance;
  const minned = atStart(goal);
  const days = goal.trainingDays.map((d) => HEB_WEEKDAYS_SHORT[d]).join(' · ');

  return (
    <Tile style={[styles.card, !goal.enabled && styles.disabled]}>
      {/* כותרת */}
      <View style={styles.head}>
        <Pressable
          onPress={() => onToggleEnabled(goal.id)}
          accessibilityRole="switch"
          accessibilityLabel={`${goal.name} — מעקב`}
          accessibilityState={{ checked: goal.enabled }}
          hitSlop={8}
        >
          <IconBadge icon={categoryIcon(goal.category)} size={touch.min} active={goal.enabled} />
        </Pressable>

        <View style={styles.headText}>
          <View style={styles.titleRow}>
            <Text style={text.bodyStrong} numberOfLines={1}>{goal.name}</Text>
            {goal.emphasis ? <Tag label="פוקוס" tone="accent" /> : null}
            {goal.maintenance ? <Tag label="תחזוקה" /> : null}
          </View>
          <Text style={text.label} numberOfLines={1}>
            {days ? `אימון ${days}` : 'לא נקבעו ימי אימון'}
          </Text>
        </View>

        <Pressable
          onPress={() => onEdit(goal)}
          accessibilityRole="button"
          accessibilityLabel={`עריכת ${goal.name}`}
          hitSlop={10}
          style={({ pressed }) => [styles.edit, pressed && styles.stepPressed]}
        >
          <Ionicons name="create-outline" size={18} color={colors.text2} />
        </Pressable>
      </View>

      {measured ? (
        <>
          {/* מספרים — תווית מעל, ערך מתחת */}
          <View style={styles.numbers}>
            <View style={styles.numCol}>
              <Text style={text.label}>יעד היום</Text>
              <Num
                value={formatValue(goal, goal.current)}
                unit={unitLabel(goal)}
                size="statSm"
                color={colors.accent}
                style={styles.numStart}
              />
            </View>
            <View style={styles.numCol}>
              <Text style={text.label}>יעד סופי</Text>
              <Num
                value={formatValue(goal, goal.final)}
                unit={unitLabel(goal)}
                size="statSm"
                color={colors.text2}
                style={styles.numStart}
              />
            </View>
          </View>

          <ProgressBar progress={goalProgress(goal)} label={`התקדמות ב${goal.name}`} />

          {/* כוונון רמה — סרגל אחד, לא שני כפתורים מתחרים */}
          <View style={styles.stepper}>
            <StepButton
              icon="remove"
              label="קשה לי — הורדת היעד היומי"
              onPress={() => onLower(goal.id)}
              disabled={minned}
            />
            <Text style={[text.label, styles.stepperHint]} numberOfLines={1}>
              {maxed ? 'ברמת היעד הסופי' : minned ? 'ברמת הפתיחה' : 'כוונון היעד היומי'}
            </Text>
            <StepButton
              icon="add"
              label="קל לי — העלאת היעד היומי"
              onPress={() => onBump(goal.id)}
              disabled={maxed}
            />
          </View>
        </>
      ) : null}

      {/* רק היעד הבא בתור נושא את הכפתור הראשי — כך יש במסך
          פעולה ראשית אחת שאומרת "זה מה שעושים עכשיו" */}
      <Button
        label={todayDone ? 'בוצע היום' : 'סמן ביצוע'}
        icon={todayDone ? 'checkmark' : undefined}
        variant={!todayDone && isNext ? 'primary' : 'secondary'}
        onPress={() => (todayDone ? onUnmark(goal.id) : onMarkDone(goal))}
      />

      {measured ? (
        <View style={styles.chart}>
          <MiniChart goal={goal} />
        </View>
      ) : null}
    </Tile>
  );
}

const styles = StyleSheet.create({
  card: { gap: space[4] },
  disabled: { opacity: 0.5 },

  head: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  headText: { flex: 1, gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: space[2], flexWrap: 'wrap' },
  edit: {
    width: touch.min, height: touch.min, borderRadius: radius.pill,
    alignItems: 'center', justifyContent: 'center',
  },

  tag: { borderRadius: radius.pill, paddingHorizontal: space[2], paddingVertical: 2 },
  tagAccent: { backgroundColor: colors.accentSurface },
  tagNeutral: { backgroundColor: colors.surface2 },
  tagText: { color: colors.text2 },
  tagTextAccent: { color: colors.accent },

  numbers: { flexDirection: 'row', gap: space[6] },
  numCol: { flex: 1, gap: space[1] },
  numStart: { justifyContent: 'flex-start' },

  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[3],
  },
  step: {
    width: touch.min, height: touch.min, borderRadius: radius.md,
    backgroundColor: colors.surface1,
    borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  stepPressed: { backgroundColor: colors.surface3 },
  stepperHint: { flex: 1, textAlign: 'center' },

  chart: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: space[4] },
});
