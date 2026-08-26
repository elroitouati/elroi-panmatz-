import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Tile from '../components/Tile';
import StatTile from '../components/StatTile';
import StageMap from '../components/StageMap';
import Num from '../components/Num';
import IconBadge from '../components/IconBadge';
import ProgressBar from '../components/ProgressBar';
import EmptyState from '../components/EmptyState';
import { colors, space, radius, touch } from '../design/tokens';
import { text } from '../design/typography';
import { useApp } from '../context/AppContext';
import { currentStageIndex, stageCountdown } from '../utils/stages';
import { todayKey } from '../utils/date';
import { formatValue, unitLabel, goalProgress, categoryIcon, computeStreak } from '../utils/fitness';

export default function HomeScreen({ navigation }) {
  const { state, markGoalToday, unmarkGoalToday } = useApp();
  if (!state) return null;

  const curStage = state.stages[currentStageIndex(state.stages)];
  const countdown = stageCountdown(curStage);
  const todayLog = state.logs[todayKey()];
  const weekday = new Date().getDay();

  const enabledGoals = state.goals.filter((g) => g.enabled);
  const todaysGoals = enabledGoals.filter((g) => g.trainingDays.includes(weekday));
  const doneCount = todaysGoals.filter((g) => todayLog?.goals?.[g.id]?.done).length;
  const streak = computeStreak(enabledGoals, state.logs);

  // אריח הדגש היחיד ברשת: יעד הפוקוס, ואם אין — הראשון שעדיין לא בוצע.
  const accentId =
    todaysGoals.find((g) => g.emphasis && !todayLog?.goals?.[g.id]?.done)?.id ??
    todaysGoals.find((g) => !todayLog?.goals?.[g.id]?.done)?.id ??
    null;

  const settingsBtn = (
    <Pressable
      onPress={() => navigation.navigate('Settings')}
      accessibilityRole="button"
      accessibilityLabel="הגדרות"
      hitSlop={12}
      style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
    >
      <Ionicons name="settings-outline" size={20} color={colors.text2} />
    </Pressable>
  );

  return (
    <Screen
      title="אלרואי | פנמ״צ"
      subtitle="ההכנה שלך לפנימייה הצבאית לפיקוד"
      action={settingsBtn}
    >
      {/* ---- מסלול הקבלה: הספירה והמפה, יחידה אחת בראש המסך ---- */}
      <Tile accent style={styles.hero}>
        <Text style={text.label}>השלב הנוכחי</Text>
        <Text style={[text.bodyStrong, styles.stageName]} numberOfLines={1}>
          {curStage.name}
        </Text>

        <View style={styles.heroNumber}>
          {countdown.hasDate && /^\d+$/.test(countdown.big) ? (
            <Num value={countdown.big} unit="ימים" size="stat" />
          ) : (
            <Text style={[text.title, styles.heroText]} numberOfLines={1}>
              {countdown.big}
            </Text>
          )}
          <Text style={[text.label, styles.heroCaption]}>{countdown.small}</Text>
        </View>

        <View style={styles.mapWrap}>
          <StageMap stages={state.stages} />
        </View>
      </Tile>

      {/* ---- יעדי היום ---- */}
      <View style={styles.sectionHead}>
        <Text style={text.bodyStrong}>יעדי היום</Text>
        <Pressable
          onPress={() => navigation.navigate('כושר')}
          accessibilityRole="button"
          accessibilityLabel="מעבר לכל היעדים"
          hitSlop={8}
        >
          <Text style={[text.label, styles.link]}>לכל היעדים</Text>
        </Pressable>
      </View>

      {todaysGoals.length === 0 ? (
        <Tile>
          <EmptyState
            icon="moon-outline"
            title="היום יום מנוחה"
            body="לא הוגדר אימון להיום. התאוששות היא חלק מהתוכנית — נחזור מחר."
            actionLabel="שינוי ימי האימון"
            onAction={() => navigation.navigate('כושר')}
          />
        </Tile>
      ) : (
        <View style={styles.goalList}>
          {todaysGoals.map((goal) => {
            const done = !!todayLog?.goals?.[goal.id]?.done;
            const measured = goal.tracking === 'measured';
            return (
              <Tile
                key={goal.id}
                accent={goal.id === accentId}
                style={styles.goalRow}
                onPress={() =>
                  done
                    ? unmarkGoalToday(goal.id)
                    : markGoalToday(goal.id, measured ? goal.current : null)
                }
                accessibilityLabel={`${goal.name}${done ? ', בוצע' : ', לא בוצע'}`}
              >
                <View style={styles.goalTop}>
                  <IconBadge
                    icon={categoryIcon(goal.category)}
                    size={touch.min}
                    active={done}
                  />
                  <Text style={[text.bodyStrong, styles.goalName]} numberOfLines={1}>
                    {goal.name}
                  </Text>
                  <Ionicons
                    name={done ? 'checkmark-circle' : 'ellipse-outline'}
                    size={22}
                    color={done ? colors.accent : colors.text3}
                  />
                </View>

                {measured ? (
                  <View style={styles.goalBottom}>
                    <View style={styles.goalBar}>
                      <ProgressBar
                        progress={goalProgress(goal)}
                        label={`התקדמות ב${goal.name}`}
                        height={4}
                      />
                    </View>
                    <Num
                      value={formatValue(goal, goal.current)}
                      unit={unitLabel(goal)}
                      size="statSm"
                      color={done ? colors.text2 : colors.text1}
                    />
                  </View>
                ) : null}
              </Tile>
            );
          })}
        </View>
      )}

      {/* ---- מדדים ---- */}
      <View style={styles.bento}>
        <StatTile
          label="רצף נוכחי"
          value={streak}
          unit={streak === 1 ? 'יום' : 'ימים'}
          icon="flame-outline"
          accent
        />
        <StatTile
          label="בוצעו היום"
          value={`${doneCount}/${todaysGoals.length}`}
          icon="checkmark-done-outline"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  iconBtn: {
    width: touch.min,
    height: touch.min,
    borderRadius: radius.pill,
    backgroundColor: colors.surface1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnPressed: { backgroundColor: colors.surface3 },

  hero: { paddingBottom: space[5] },
  stageName: { marginTop: 2 },
  heroNumber: { alignItems: 'center', marginTop: space[5] },
  heroText: { color: colors.accent, textAlign: 'center' },
  heroCaption: { marginTop: space[1], textAlign: 'center' },
  mapWrap: {
    marginTop: space[6],
    paddingTop: space[5],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space[4],
  },
  link: { color: colors.accent },

  // רשת בנטו לאריחי המדדים: תווית קצרה ומספר, שני אריחים בשורה.
  bento: { flexDirection: 'row', gap: space[3] },

  // יעדי היום הם רשימה ולא בנטו: שם יעד בעברית לא נכנס לחצי רוחב
  // בלי להיחתך, וקריאוּת השם חשובה כאן יותר מסימטריית הרשת.
  goalList: { gap: space[3] },
  goalRow: { gap: space[3] },
  goalTop: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  goalName: { flex: 1 },
  goalBottom: { flexDirection: 'row', alignItems: 'center', gap: space[4] },
  goalBar: { flex: 1 },
});
