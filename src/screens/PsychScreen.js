import React from 'react';
import { View, Text, Pressable, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Tile from '../components/Tile';
import Num from '../components/Num';
import Button from '../components/Button';
import ProgressBar from '../components/ProgressBar';
import IconBadge from '../components/IconBadge';
import { colors, space, radius, touch, state as st } from '../design/tokens';
import { text } from '../design/typography';
import { useApp } from '../context/AppContext';
import { todayKey, isInThisWeek } from '../utils/date';

export default function PsychScreen() {
  const { state, markPsychToday, unmarkPsychToday, setPsychWeeklyTarget } = useApp();
  if (!state) return null;

  const doneToday = state.psych.practiceDays.includes(todayKey());
  const weekCount = state.psych.practiceDays.filter(isInThisWeek).length;
  const target = state.psych.weeklyTarget;

  const openLink = (url) => Linking.openURL(url).catch(() => {});

  return (
    <Screen title="פסיכוטכני" subtitle="הכנה קוגניטיבית">
      {/* יעד שבועי — המספר הוא הגיבור, התווית מעליו */}
      <Tile accent style={styles.hero}>
        <View style={styles.headRow}>
          <Text style={text.label}>תרגולים השבוע</Text>
          <View style={styles.stepper}>
            <Step
              icon="remove"
              label="הפחתת היעד השבועי"
              onPress={() => setPsychWeeklyTarget(target - 1)}
              disabled={target <= 1}
            />
            <Text style={[text.labelStrong, styles.targetNum]}>{target}</Text>
            <Step
              icon="add"
              label="הגדלת היעד השבועי"
              onPress={() => setPsychWeeklyTarget(target + 1)}
            />
          </View>
        </View>

        <Num value={weekCount} unit={`מתוך ${target}`} size="stat" style={styles.num} />

        <ProgressBar
          progress={target === 0 ? 0 : weekCount / target}
          label="התקדמות שבועית בתרגול"
          height={8}
        />

        <Button
          label={doneToday ? 'תרגלת היום' : 'תרגלתי היום'}
          icon={doneToday ? 'checkmark' : undefined}
          variant={doneToday ? 'secondary' : 'primary'}
          onPress={() => (doneToday ? unmarkPsychToday() : markPsychToday())}
          style={styles.cta}
        />
      </Tile>

      <Text style={[text.bodyStrong, styles.sectionTitle]}>אתרי תרגול</Text>
      <Text style={text.label}>
        סדרות, צורות, לוגיקה וזריזות. הקישורים נפתחים בדפדפן.
      </Text>

      <View style={styles.list}>
        {state.psych.links.map((link) => (
          <Tile
            key={link.id}
            onPress={() => openLink(link.url)}
            accessibilityLabel={`${link.title} — נפתח בדפדפן`}
            style={styles.linkTile}
          >
            <IconBadge icon="school-outline" size={touch.min} />
            <View style={styles.linkText}>
              <Text style={text.bodyStrong} numberOfLines={1}>{link.title}</Text>
              <Text style={text.label} numberOfLines={1}>{link.subtitle}</Text>
            </View>
            <Ionicons name="open-outline" size={18} color={colors.text3} />
          </Tile>
        ))}
      </View>
    </Screen>
  );
}

function Step({ icon, label, onPress, disabled }) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      hitSlop={8}
      style={({ pressed }) => [
        styles.step,
        pressed && !disabled && styles.stepPressed,
        disabled && { opacity: st.disabledOpacity },
      ]}
    >
      <Ionicons name={icon} size={16} color={colors.text1} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hero: { gap: space[4] },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  step: {
    width: 32, height: 32, borderRadius: radius.sm,
    backgroundColor: colors.surface1,
    borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  stepPressed: { backgroundColor: colors.surface3 },
  targetNum: { minWidth: 20, textAlign: 'center' },
  num: { justifyContent: 'flex-start' },
  cta: { marginTop: space[1] },

  sectionTitle: { marginTop: space[4] },
  list: { gap: space[3] },
  linkTile: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  linkText: { flex: 1, gap: 2 },
});
