import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Card from '../components/Card';
import GoalCard from '../components/GoalCard';
import ValueEntryModal from '../components/ValueEntryModal';
import EditGoalModal from '../components/EditGoalModal';
import { colors, spacing, radius, font } from '../theme';
import { useApp } from '../context/AppContext';
import { todayKey } from '../utils/date';

export default function FitnessScreen() {
  const { state, toggleGoalEnabled, updateGoal, deleteGoal, bumpGoal, lowerGoal, markGoalToday, unmarkGoalToday, addGoal } = useApp();
  const [valueGoal, setValueGoal] = useState(null);
  const [editGoal, setEditGoal] = useState(null);

  if (!state) return null;
  const today = todayKey();
  const todayLog = state.logs[today];

  const enabledCount = state.goals.filter((g) => g.enabled).length;

  // סימון ביצוע: תרגיל נמדד פותח הזנת ערך, תרגיל משלים מסמן ישירות
  const handleMarkDone = (goal) => {
    if (goal.tracking === 'measured') setValueGoal(goal);
    else markGoalToday(goal.id, null);
  };

  const handleAddGoal = () => {
    const id = addGoal({
      name: 'יעד חדש',
      category: 'calisthenics',
      tracking: 'measured',
      unit: 'חזרות',
      start: 5,
      current: 5,
      final: 20,
      step: 2,
    });
    // פתיחת עריכה מיד על היעד החדש
    setTimeout(() => {
      const g = { id, name: 'יעד חדש', unit: 'חזרות', tracking: 'measured', final: 20, step: 2, trainingDays: [0, 1, 2, 3, 4], current: 5 };
      setEditGoal(g);
    }, 60);
  };

  return (
    <Screen title="כושר" subtitle={`${enabledCount} יעדים במעקב · נגיש בכל שלב`}>
      <Card style={styles.tip}>
        <Ionicons name="information-circle-outline" size={20} color={colors.gold} />
        <Text style={styles.tipText}>
          כל יעד מתקדם בנפרד. סמן "קל לי" כדי להעלות את היעד היומי בהדרגה עד היעד הסופי — ואז הוא עובר למצב תחזוקה אוטומטי.
        </Text>
      </Card>

      {state.goals.map((goal) => (
        <GoalCard
          key={goal.id}
          goal={goal}
          todayDone={!!todayLog?.goals?.[goal.id]?.done}
          onToggleEnabled={toggleGoalEnabled}
          onEdit={setEditGoal}
          onBump={bumpGoal}
          onLower={lowerGoal}
          onMarkDone={handleMarkDone}
          onUnmark={unmarkGoalToday}
        />
      ))}

      <Pressable style={styles.addBtn} onPress={handleAddGoal}>
        <Ionicons name="add-circle-outline" size={22} color={colors.gold} />
        <Text style={styles.addText}>הוספת יעד חדש</Text>
      </Pressable>

      <ValueEntryModal
        visible={!!valueGoal}
        goal={valueGoal}
        onClose={() => setValueGoal(null)}
        onSubmit={(value) => {
          markGoalToday(valueGoal.id, value);
          setValueGoal(null);
        }}
      />

      <EditGoalModal
        visible={!!editGoal}
        goal={editGoal}
        onClose={() => setEditGoal(null)}
        onSave={(patch) => updateGoal(editGoal.id, patch)}
        onDelete={deleteGoal}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  tip: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: spacing.sm },
  tipText: { flex: 1, color: colors.creamDim, fontSize: font.small, textAlign: 'right', lineHeight: 20 },
  addBtn: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    borderWidth: 1, borderColor: colors.goldDim, borderStyle: 'dashed', borderRadius: radius.md,
    paddingVertical: spacing.lg, marginTop: spacing.sm,
  },
  addText: { color: colors.gold, fontWeight: '700', fontSize: font.body },
});
