import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Screen from '../components/Screen';
import Num from '../components/Num';
import Button from '../components/Button';
import Stepper from '../components/Stepper';
import IconButton from '../components/IconButton';
import ProgressBar from '../components/ProgressBar';
import MiniChart from '../components/MiniChart';
import EmptyState from '../components/EmptyState';
import ValueSheet from '../sheets/ValueSheet';
import EditGoalSheet from '../sheets/EditGoalSheet';
import { colors, radius, space } from '../design/tokens';
import { text } from '../design/typography';
import { ltr } from '../design/rtl';
import { haptic } from '../design/haptics';
import { useApp } from '../context/AppContext';
import { todayKey, HEB_WEEKDAYS_SHORT } from '../utils/date';
import { formatValue, unitLabel, goalProgress, reachedFinal, atStart } from '../utils/fitness';

// ============================================================================
//  כושר. כרטיס לכל יעד: היעד של היום גדול, היעד הסופי קטן לידו.
//  פעולה ראשית (זהב) אחת בכל המסך — רק על היעד הבא בתור.
//  + = "קל לי", − = "קשה לי".
// ============================================================================

function Pill({ label, gold }) {
  return (
    <View style={[styles.pill, gold && styles.pillGold]}>
      <Text style={[text.caption, gold ? styles.pillGoldText : styles.pillText]}>{label}</Text>
    </View>
  );
}

function GoalCard({ goal, todayDone, isNext, onEdit, onBump, onLower, onMark, onUnmark }) {
  const measured = goal.tracking === 'measured';
  const maxed = reachedFinal(goal) || goal.maintenance;
  const days = goal.trainingDays.map((d) => HEB_WEEKDAYS_SHORT[d]).join(' · ');

  return (
    <View style={[styles.card, !goal.enabled && styles.paused]}>
      <View style={styles.head}>
        <View style={styles.headText}>
          <View style={styles.titleRow}>
            <Text style={text.headlineStrong} numberOfLines={1}>{goal.name}</Text>
            {goal.emphasis ? <Pill label="פוקוס" gold /> : null}
            {goal.maintenance ? <Pill label="תחזוקה" /> : null}
            {!goal.enabled ? <Pill label="מושהה" /> : null}
          </View>
          <Text style={text.caption} numberOfLines={1}>{days ? `אימון ${days}` : 'לא נקבעו ימי אימון'}</Text>
        </View>
        <IconButton icon="ellipsis-horizontal" label={`עריכת ${goal.name}`} onPress={() => onEdit(goal)} tone="plain" />
      </View>

      {measured ? (
        <>
          <View style={styles.numbers}>
            <View style={styles.flex}>
              <Text style={text.caption}>היעד של היום</Text>
              <Num value={formatValue(goal, goal.current)} unit={unitLabel(goal)} size="stat" />
            </View>
            <View>
              <Text style={text.caption}>יעד סופי</Text>
              <Num value={formatValue(goal, goal.final)} unit={unitLabel(goal)} size="statSm" color={colors.ink2} />
            </View>
          </View>
          <ProgressBar progress={goalProgress(goal)} label={`התקדמות ב${goal.name}`} />
        </>
      ) : null}

      <View style={styles.actions}>
        {measured ? (
          <Stepper
            onPlus={() => onBump(goal.id)}
            onMinus={() => onLower(goal.id)}
            plusDisabled={maxed}
            minusDisabled={atStart(goal)}
            plusLabel="קל לי — העלאת היעד היומי"
            minusLabel="קשה לי — הורדת היעד היומי"
          />
        ) : null}
        <Button
          label={todayDone ? 'בוצע היום' : 'סמן ביצוע'}
          icon={todayDone ? 'checkmark' : undefined}
          variant={todayDone ? 'done' : isNext ? 'primary' : 'secondary'}
          onPress={() => (todayDone ? onUnmark(goal.id) : onMark(goal))}
          accessibilityHint={todayDone ? 'לחיצה מבטלת את הסימון' : undefined}
          wrapStyle={styles.flex}
        />
      </View>

      {measured && (goal.history || []).length >= 2 ? (
        <View style={styles.chart}><MiniChart goal={goal} /></View>
      ) : null}
    </View>
  );
}

export default function FitnessScreen() {
  const {
    state, toggleGoalEnabled, updateGoal, deleteGoal,
    bumpGoal, lowerGoal, markGoalToday, unmarkGoalToday, addGoal,
  } = useApp();
  const [valueGoal, setValueGoal] = useState(null);
  const [editGoal, setEditGoal] = useState(null);

  if (!state) return null;
  const todayLog = state.logs[todayKey()];
  const enabledGoals = state.goals.filter((g) => g.enabled);
  const weekday = new Date().getDay();
  const nextId = enabledGoals.find(
    (g) => g.trainingDays.includes(weekday) && !todayLog?.goals?.[g.id]?.done
  )?.id ?? null;

  // יעד נמדד פותח את גיליון התוצאה; יעד סימון מסומן ישירות.
  const mark = (goal) => {
    if (goal.tracking === 'measured') setValueGoal(goal);
    else { haptic.light(); markGoalToday(goal.id, null); }
  };

  const handleAddGoal = () => {
    const id = addGoal({
      name: 'יעד חדש', category: 'calisthenics', tracking: 'measured', unit: 'חזרות',
      start: 5, current: 5, final: 20, step: 2,
    });
    setTimeout(() => {
      setEditGoal({
        id, name: 'יעד חדש', unit: 'חזרות', tracking: 'measured', enabled: true,
        final: 20, step: 2, current: 5, trainingDays: [0, 1, 2, 3, 4],
      });
    }, 60);
  };

  return (
    <Screen title="כושר" overline={`${ltr(enabledGoals.length)} יעדים במעקב`}>
      {state.goals.length === 0 ? (
        <View style={styles.card}>
          <EmptyState
            icon="barbell-outline"
            title="אין עדיין יעדים"
            body="הוסף יעד ראשון, קבע יעד סופי וימי אימון — והיעד יעלה בהדרגה."
            actionLabel="הוספת היעד הראשון"
            onAction={handleAddGoal}
          />
        </View>
      ) : (
        <View style={styles.list}>
          {state.goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              todayDone={!!todayLog?.goals?.[goal.id]?.done}
              isNext={goal.id === nextId}
              onEdit={setEditGoal}
              onBump={bumpGoal}
              onLower={lowerGoal}
              onMark={mark}
              onUnmark={unmarkGoalToday}
            />
          ))}
          <Text style={[text.caption, styles.footnote]}>
            + זה "קל לי", − זה "קשה לי". כל לחיצה מזיזה את היעד היומי בצעד אחד.
          </Text>
          <Button label="הוספת יעד" icon="add" variant="secondary" onPress={handleAddGoal} />
        </View>
      )}

      <ValueSheet
        goal={valueGoal}
        onClose={() => setValueGoal(null)}
        onSubmit={(value) => { markGoalToday(valueGoal.id, value); setValueGoal(null); }}
      />
      <EditGoalSheet
        goal={editGoal}
        onClose={() => setEditGoal(null)}
        onSave={(patch, enabled) => {
          updateGoal(editGoal.id, patch);
          const cur = state.goals.find((g) => g.id === editGoal.id);
          if (cur && cur.enabled !== enabled) toggleGoalEnabled(editGoal.id);
        }}
        onDelete={deleteGoal}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: space[4] },
  card: { backgroundColor: colors.group, borderRadius: radius.card, padding: space[5], gap: space[4] },
  paused: { opacity: 0.55 },
  head: { flexDirection: 'row', alignItems: 'center', gap: space[3], marginEnd: -space[2], marginTop: -space[1] },
  headText: { flex: 1, minWidth: 0, gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: space[2], flexWrap: 'wrap' },
  pill: { borderRadius: radius.pill, paddingHorizontal: space[2] + 2, paddingVertical: 2, backgroundColor: colors.bgDeep },
  pillGold: { backgroundColor: colors.goldSoft },
  pillText: { color: colors.ink2 },
  pillGoldText: { color: colors.gold, fontFamily: 'Heebo_700Bold' },
  numbers: { flexDirection: 'row', alignItems: 'flex-end', gap: space[4] },
  flex: { flex: 1 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  chart: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.separator, paddingTop: space[4] },
  footnote: { paddingHorizontal: space[4] },
});
