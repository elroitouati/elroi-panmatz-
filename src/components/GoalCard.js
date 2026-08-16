import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from './Card';
import ProgressBar from './ProgressBar';
import MiniChart from './MiniChart';
import IconBadge from './IconBadge';
import StatTile from './StatTile';
import { colors, radius, spacing, font } from '../theme';
import { formatValue, unitLabel, goalProgress, reachedFinal, atStart, categoryIcon } from '../utils/fitness';
import { HEB_WEEKDAYS_SHORT } from '../utils/date';

export default function GoalCard({ goal, todayDone, onToggleEnabled, onEdit, onBump, onLower, onMarkDone, onUnmark }) {
  const measured = goal.tracking === 'measured';
  const done = reachedFinal(goal) || goal.maintenance;
  const minReached = atStart(goal);
  const daysText = goal.trainingDays.map((d) => HEB_WEEKDAYS_SHORT[d]).join(' · ');

  return (
    <Card highlight={goal.emphasis} style={!goal.enabled && styles.disabled}>
      {/* כותרת */}
      <View style={styles.header}>
        <Pressable onPress={() => onToggleEnabled(goal.id)} hitSlop={8}>
          <IconBadge icon={categoryIcon(goal.category)} size={44} active={goal.enabled} />
        </Pressable>

        <View style={{ flex: 1 }}>
          <View style={styles.titleRow}>
            <Text style={styles.name}>{goal.name}</Text>
            {goal.emphasis && <Tag text="פוקוס" bg={colors.goldDim} fg={colors.bg} />}
            {goal.maintenance && <Tag text="תחזוקה" bg={colors.rest} fg={colors.cream} />}
            {!measured && <Tag text="משלים" bg={colors.bgDeep} fg={colors.creamDim} />}
          </View>
          <Text style={styles.days}>ימי אימון: {daysText || '—'}</Text>
        </View>

        <Pressable onPress={() => onEdit(goal)} hitSlop={8}>
          <Ionicons name="create-outline" size={22} color={colors.creamDim} />
        </Pressable>
      </View>

      {/* יעד מתקדם — רק לתרגילים נמדדים */}
      {measured && (
        <View style={styles.progressBlock}>
          <View style={styles.numbersRow}>
            <StatTile
              icon={categoryIcon(goal.category)}
              value={`${formatValue(goal, goal.current)} ${unitLabel(goal)}`}
              label="יעד היום"
              emphasis
            />
            <StatTile
              icon="flag-outline"
              value={`${formatValue(goal, goal.final)} ${unitLabel(goal)}`}
              label="יעד סופי"
            />
          </View>
          <ProgressBar progress={goalProgress(goal)} height={8} />
        </View>
      )}

      {/* בקרת רמה — "קשה לי" / "קל לי" — רק לתרגילים נמדדים */}
      {measured && (
        <View style={styles.levelRow}>
          <Pressable
            style={[styles.actionBtn, styles.hardBtn, minReached && styles.btnDisabled]}
            onPress={() => onLower(goal.id)}
            disabled={minReached}
          >
            <Ionicons name="trending-down" size={16} color={minReached ? colors.creamDim : colors.cream} />
            <Text style={[styles.hardText, minReached && { color: colors.creamDim }]}>קשה לי</Text>
          </Pressable>

          {done ? (
            <View style={[styles.actionBtn, styles.maintBtn]}>
              <Ionicons name="shield-checkmark" size={16} color={colors.success} />
              <Text style={styles.maintText}>תחזוקה</Text>
            </View>
          ) : (
            <Pressable style={[styles.actionBtn, styles.easyBtn]} onPress={() => onBump(goal.id)}>
              <Ionicons name="trending-up" size={16} color={colors.gold} />
              <Text style={styles.easyText}>קל לי</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* סימון ביצוע */}
      <View style={styles.actions}>
        {todayDone ? (
          <Pressable style={[styles.actionBtn, styles.doneBtn]} onPress={() => onUnmark(goal.id)}>
            <Ionicons name="checkmark-circle" size={18} color={colors.bg} />
            <Text style={styles.doneText}>בוצע היום</Text>
          </Pressable>
        ) : (
          <Pressable style={[styles.actionBtn, styles.markBtn]} onPress={() => onMarkDone(goal)}>
            <Ionicons name="ellipse-outline" size={18} color={colors.cream} />
            <Text style={styles.markText}>סמן ביצוע</Text>
          </Pressable>
        )}
      </View>

      {/* גרף התקדמות — רק לתרגילים נמדדים */}
      {measured && (
        <View style={styles.chart}>
          <MiniChart goal={goal} />
        </View>
      )}
    </Card>
  );
}

function Tag({ text, bg, fg }) {
  return (
    <View style={[styles.tag, { backgroundColor: bg }]}>
      <Text style={[styles.tagText, { color: fg }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  disabled: { opacity: 0.55 },
  header: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.md },
  titleRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  name: { color: colors.cream, fontSize: font.body, fontWeight: '800' },
  days: { color: colors.creamDim, fontSize: font.tiny, textAlign: 'right', marginTop: 3 },
  tag: { borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 1 },
  tagText: { fontSize: 10, fontWeight: '800' },
  progressBlock: { marginTop: spacing.lg },
  numbersRow: { flexDirection: 'row-reverse', gap: spacing.sm, marginBottom: spacing.md },
  levelRow: { flexDirection: 'row-reverse', gap: spacing.sm, marginTop: spacing.lg },
  actions: { flexDirection: 'row-reverse', gap: spacing.sm, marginTop: spacing.sm },
  actionBtn: {
    flex: 1, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: spacing.md, borderRadius: radius.pill,
  },
  easyBtn: { backgroundColor: colors.bgDeep, borderWidth: 1, borderColor: colors.goldDim },
  easyText: { color: colors.gold, fontWeight: '700', fontSize: font.small },
  hardBtn: { backgroundColor: colors.bgDeep, borderWidth: 1, borderColor: colors.line },
  hardText: { color: colors.cream, fontWeight: '700', fontSize: font.small },
  btnDisabled: { opacity: 0.5 },
  maintBtn: { backgroundColor: colors.bgDeep, borderWidth: 1, borderColor: colors.rest },
  maintText: { color: colors.success, fontWeight: '700', fontSize: font.small },
  markBtn: { backgroundColor: colors.bgDeep, borderWidth: 1, borderColor: colors.line },
  markText: { color: colors.cream, fontWeight: '700', fontSize: font.small },
  doneBtn: { backgroundColor: colors.gold },
  doneText: { color: colors.bg, fontWeight: '800', fontSize: font.small },
  chart: { marginTop: spacing.lg, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: spacing.md },
});
