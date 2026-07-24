import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Card from '../components/Card';
import StageMap from '../components/StageMap';
import ProgressBar from '../components/ProgressBar';
import LeafMark from '../components/LeafMark';
import { colors, spacing, radius, font } from '../theme';
import { useApp } from '../context/AppContext';
import { currentStageIndex, stageCountdown } from '../utils/stages';
import { todayKey } from '../utils/date';
import { formatValue, unitLabel, goalProgress } from '../utils/fitness';

export default function HomeScreen({ navigation }) {
  const { state, markGoalToday, unmarkGoalToday } = useApp();
  if (!state) return null;

  const curIdx = currentStageIndex(state.stages);
  const curStage = state.stages[curIdx];
  const countdown = stageCountdown(curStage);
  const today = todayKey();
  const todayWeekday = new Date().getDay();
  const todayLog = state.logs[today];

  // יעדי הכושר של היום — יעדים פעילים שהיום הוא יום אימון שלהם
  const todaysGoals = state.goals.filter(
    (g) => g.enabled && g.trainingDays.includes(todayWeekday)
  );

  const settingsBtn = (
    <Pressable onPress={() => navigation.navigate('Settings')} hitSlop={12}>
      <Ionicons name="settings-outline" size={24} color={colors.creamDim} />
    </Pressable>
  );

  return (
    <Screen title="אלרואי | פנמ״צ" subtitle="ההכנה שלך לפנימייה הצבאית לפיקוד" headerRight={settingsBtn}>
      {/* כרטיס השלב הנוכחי */}
      <Card highlight style={styles.stageCard}>
        <View style={styles.stageTop}>
          <View style={styles.stageBadge}>
            <Ionicons name={curStage.icon} size={22} color={colors.bg} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.stageLabel}>השלב הנוכחי</Text>
            <Text style={styles.stageName}>{curStage.name}</Text>
          </View>
          <LeafMark size={26} color={colors.gold} />
        </View>

        <View style={styles.countdown}>
          <Text style={styles.countBig}>{countdown.big}</Text>
          <Text style={styles.countSmall}>{countdown.small}</Text>
        </View>
        {curStage.note ? <Text style={styles.stageNote}>{curStage.note}</Text> : null}
      </Card>

      {/* מפת המסלול */}
      <Text style={styles.sectionTitle}>מפת המסלול</Text>
      <Card>
        <StageMap stages={state.stages} />
      </Card>

      {/* יעדי הכושר של היום */}
      <View style={styles.rowBetween}>
        <Text style={styles.sectionTitle}>יעדי הכושר של היום</Text>
        <Pressable onPress={() => navigation.navigate('כושר')}>
          <Text style={styles.link}>לכל היעדים ›</Text>
        </Pressable>
      </View>

      {todaysGoals.length === 0 ? (
        <Card>
          <Text style={styles.restText}>
            היום יום מנוחה מתוכנן 🌙{'\n'}תן לגוף להתאושש — נחזור מחר בכוח.
          </Text>
        </Card>
      ) : (
        todaysGoals.map((goal) => {
          const done = todayLog?.goals?.[goal.id]?.done;
          const showNumber = goal.tracking === 'measured';
          return (
            <Card key={goal.id} style={styles.goalRow}>
              <Pressable
                style={styles.checkBtn}
                onPress={() => (done ? unmarkGoalToday(goal.id) : markGoalToday(goal.id, showNumber ? goal.current : null))}
                hitSlop={8}
              >
                <View style={[styles.checkCircle, done && styles.checkCircleDone]}>
                  {done && <Ionicons name="checkmark" size={20} color={colors.bg} />}
                </View>
              </Pressable>

              <View style={{ flex: 1 }}>
                <View style={styles.goalTitleRow}>
                  <Text style={styles.goalName}>{goal.name}</Text>
                  {goal.emphasis && (
                    <View style={styles.focusTag}>
                      <Text style={styles.focusTagText}>פוקוס</Text>
                    </View>
                  )}
                  {goal.maintenance && (
                    <View style={styles.maintTag}>
                      <Text style={styles.maintTagText}>תחזוקה</Text>
                    </View>
                  )}
                </View>
                {showNumber ? (
                  <Text style={styles.goalTarget}>
                    יעד היום: <Text style={styles.goalTargetNum}>{formatValue(goal, goal.current)}</Text>{' '}
                    {unitLabel(goal)}
                  </Text>
                ) : (
                  <Text style={styles.goalTarget}>סמן בסיום התרגיל</Text>
                )}
                {showNumber && <ProgressBar progress={goalProgress(goal)} height={6} />}
              </View>
            </Card>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  stageCard: { paddingBottom: spacing.lg },
  stageTop: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.md },
  stageBadge: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: colors.gold,
    alignItems: 'center', justifyContent: 'center',
  },
  stageLabel: { color: colors.creamDim, fontSize: font.tiny, textAlign: 'right' },
  stageName: { color: colors.cream, fontSize: font.h3, fontWeight: '800', textAlign: 'right' },
  countdown: { alignItems: 'center', marginTop: spacing.lg },
  countBig: { color: colors.gold, fontSize: 46, fontWeight: '900', textAlign: 'center' },
  countSmall: { color: colors.creamDim, fontSize: font.small, marginTop: 2 },
  stageNote: { color: colors.creamDim, fontSize: font.tiny, textAlign: 'center', marginTop: spacing.sm },
  sectionTitle: {
    color: colors.cream, fontSize: font.h3, fontWeight: '700',
    marginTop: spacing.md, marginBottom: spacing.sm, textAlign: 'right',
  },
  rowBetween: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
  },
  link: { color: colors.gold, fontSize: font.small, fontWeight: '600' },
  restText: { color: colors.creamDim, fontSize: font.body, textAlign: 'center', lineHeight: 26 },
  goalRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.md },
  checkBtn: { padding: 2 },
  checkCircle: {
    width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: colors.goldDim,
    alignItems: 'center', justifyContent: 'center',
  },
  checkCircleDone: { backgroundColor: colors.gold, borderColor: colors.gold },
  goalTitleRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm, marginBottom: 4 },
  goalName: { color: colors.cream, fontSize: font.body, fontWeight: '700' },
  focusTag: { backgroundColor: colors.goldDim, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 1 },
  focusTagText: { color: colors.bg, fontSize: 10, fontWeight: '800' },
  maintTag: { backgroundColor: colors.rest, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 1 },
  maintTagText: { color: colors.cream, fontSize: 10, fontWeight: '700' },
  goalTarget: { color: colors.creamDim, fontSize: font.small, textAlign: 'right', marginBottom: 6 },
  goalTargetNum: { color: colors.gold, fontWeight: '800' },
});
