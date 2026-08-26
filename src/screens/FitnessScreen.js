import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Screen from '../components/Screen';
import Tile from '../components/Tile';
import Button from '../components/Button';
import GoalCard from '../components/GoalCard';
import EmptyState from '../components/EmptyState';
import ValueEntryModal from '../components/ValueEntryModal';
import EditGoalModal from '../components/EditGoalModal';
import { space } from '../design/tokens';
import { useApp } from '../context/AppContext';
import { todayKey } from '../utils/date';

export default function FitnessScreen() {
  const {
    state, toggleGoalEnabled, updateGoal, deleteGoal,
    bumpGoal, lowerGoal, markGoalToday, unmarkGoalToday, addGoal,
  } = useApp();
  const [valueGoal, setValueGoal] = useState(null);
  const [editGoal, setEditGoal] = useState(null);

  if (!state) return null;
  const todayLog = state.logs[todayKey()];
  const enabled = state.goals.filter((g) => g.enabled).length;

  // יעד נמדד פותח הזנת תוצאה; יעד וי מסומן ישירות.
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
      start: 5, current: 5, final: 20, step: 2,
    });
    setTimeout(() => {
      setEditGoal({
        id, name: 'יעד חדש', unit: 'חזרות', tracking: 'measured',
        final: 20, step: 2, current: 5, trainingDays: [0, 1, 2, 3, 4],
      });
    }, 60);
  };

  return (
    <Screen title="כושר" subtitle={`${enabled} יעדים במעקב`}>
      {state.goals.length === 0 ? (
        <Tile>
          <EmptyState
            icon="barbell-outline"
            title="אין עדיין יעדים"
            body="הוסף יעד ראשון, קבע לו יעד סופי וימי אימון, והאפליקציה תעלה אותו בהדרגה."
            actionLabel="הוספת היעד הראשון"
            onAction={handleAddGoal}
          />
        </Tile>
      ) : (
        <View style={styles.list}>
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

          <Button
            label="הוספת יעד"
            icon="add"
            variant="secondary"
            onPress={handleAddGoal}
          />
        </View>
      )}

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
  list: { gap: space[3] },
});
