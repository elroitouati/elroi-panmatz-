import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Ring from '../components/Ring';
import StagePath from '../components/StagePath';
import CheckCircle from '../components/CheckCircle';
import IconButton from '../components/IconButton';
import EmptyState from '../components/EmptyState';
import { Section, Row } from '../components/Group';
import { colors, radius, space, type } from '../design/tokens';
import { text } from '../design/typography';
import { ltr } from '../design/rtl';
import { haptic } from '../design/haptics';
import { useApp } from '../context/AppContext';
import { currentStageIndex, stageCountdown } from '../utils/stages';
import { todayKey, HEB_WEEKDAYS_FULL, HEB_MONTHS } from '../utils/date';
import { formatValue, unitLabel, computeStreak } from '../utils/fitness';

// ============================================================================
//  היום. שאלה אחת: מה עושים היום, וכמה נשאר עד השלב הבא.
//  הטבעת היא הגיבור; הרשימה מתחת היא הפעולה.
// ============================================================================

function todayOverline() {
  const d = new Date();
  return `יום ${HEB_WEEKDAYS_FULL[d.getDay()]}, ${d.getDate()} ב${HEB_MONTHS[d.getMonth()]}`;
}

export default function HomeScreen({ navigation }) {
  const { state, markGoalToday, unmarkGoalToday } = useApp();
  if (!state) return null;

  const stage = state.stages[currentStageIndex(state.stages)];
  const countdown = stageCountdown(stage);
  const todayLog = state.logs[todayKey()];
  const weekday = new Date().getDay();

  const enabledGoals = state.goals.filter((g) => g.enabled);
  const todays = enabledGoals.filter((g) => g.trainingDays.includes(weekday));
  const doneCount = todays.filter((g) => todayLog?.goals?.[g.id]?.done).length;
  const streak = computeStreak(enabledGoals, state.logs);

  const countdownBig = countdown.hasDate && /^\d+$/.test(countdown.big)
    ? `${countdown.big} ימים`
    : countdown.big;

  const toggle = (goal, done) => {
    if (done) { unmarkGoalToday(goal.id); return; }
    haptic.light();
    markGoalToday(goal.id, goal.tracking === 'measured' ? goal.current : null);
  };

  return (
    <Screen
      title="היום"
      overline={todayOverline()}
      action={<IconButton icon="settings-outline" label="הגדרות" onPress={() => navigation.navigate('Settings')} />}
    >
      {/* ---- גיבור: טבעת יעדי היום + השלב הבא ---- */}
      <View style={styles.hero}>
        <Ring progress={todays.length ? doneCount / todays.length : 0} size={124} stroke={11}>
          {todays.length ? (
            <View style={styles.ringNum} accessibilityLabel={`${doneCount} מתוך ${todays.length} יעדים בוצעו`}>
              <Text style={styles.ringBig}>{ltr(doneCount)}</Text>
              <Text style={styles.ringSmall}>{ltr(`/${todays.length}`)}</Text>
            </View>
          ) : (
            <Ionicons name="moon" size={30} color={colors.ink2} />
          )}
          <Text style={[text.caption, styles.ringLabel]}>{todays.length ? 'יעדי היום' : 'מנוחה'}</Text>
        </Ring>

        <View style={styles.side}>
          <Text style={text.caption} numberOfLines={1}>השלב הבא · {stage.name}</Text>
          <Text style={styles.countdown} numberOfLines={2}>
            {ltr(countdownBig)}
          </Text>
          <Text style={text.sub} numberOfLines={2}>{countdown.small}</Text>
          <View style={styles.pill}>
            <Ionicons name="flame" size={14} color={colors.gold} />
            <Text style={[text.captionStrong]}>
              רצף {ltr(streak)} {streak === 1 ? 'יום' : 'ימים'}
            </Text>
          </View>
        </View>
      </View>

      {/* ---- מסלול הקבלה ---- */}
      <Text style={[text.caption, styles.header]}>מסלול הקבלה</Text>
      <View style={styles.pathCard}>
        <StagePath stages={state.stages} />
      </View>

      {/* ---- האימון של היום ---- */}
      {todays.length === 0 ? (
        <>
          <Text style={[text.caption, styles.header]}>האימון של היום</Text>
          <View style={styles.pathCard}>
            <EmptyState
              icon="moon-outline"
              title="היום יום מנוחה"
              body="התאוששות היא חלק מהתוכנית. נחזור מחר."
              actionLabel="שינוי ימי האימון"
              onAction={() => navigation.navigate('כושר')}
            />
          </View>
        </>
      ) : (
        <Section
          title="האימון של היום"
          footer="לחיצה על שורה מסמנת ביצוע. ביעד עם מספרים נרשם היעד היומי — את התוצאה המדויקת רושמים במסך כושר."
        >
          {todays.map((goal) => {
            const done = !!todayLog?.goals?.[goal.id]?.done;
            const measured = goal.tracking === 'measured';
            return (
              <Row
                key={goal.id}
                title={goal.name}
                subtitle={measured ? null : 'סימון בלבד'}
                value={measured ? `${ltr(formatValue(goal, goal.current))} ${unitLabel(goal)}` : null}
                leading={(pressed) => <CheckCircle done={done} pressed={pressed} />}
                onPress={() => toggle(goal, done)}
                accessibilityLabel={`${goal.name}, ${done ? 'בוצע' : 'לא בוצע'}`}
              />
            );
          })}
        </Section>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: 'row', alignItems: 'center', gap: space[5],
    backgroundColor: colors.group, borderRadius: radius.card, padding: space[5],
  },
  ringNum: { flexDirection: 'row', alignItems: 'baseline', direction: 'ltr' },
  ringBig: { fontFamily: type.family.heavy, fontSize: type.ring[0], lineHeight: type.ring[1], color: colors.ink, includeFontPadding: false, ...type.tabular },
  ringSmall: { fontFamily: type.family.bold, fontSize: 18, color: colors.ink, opacity: type.unitOpacity, includeFontPadding: false, ...type.tabular },
  ringLabel: { textAlign: 'center' },
  side: { flex: 1, minWidth: 0, gap: 3 },
  countdown: { fontFamily: type.family.heavy, fontSize: 26, lineHeight: 32, color: colors.gold, textAlign: 'right', includeFontPadding: false },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start',
    backgroundColor: colors.goldSoft, borderRadius: radius.pill,
    paddingHorizontal: space[3], paddingVertical: 5, marginTop: space[2],
  },
  header: { paddingHorizontal: space[4], paddingTop: space[6], paddingBottom: 7 },
  pathCard: { backgroundColor: colors.group, borderRadius: radius.card, paddingVertical: space[4], paddingHorizontal: space[2] },
});
