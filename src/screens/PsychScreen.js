import React from 'react';
import { View, Text, Pressable, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Card from '../components/Card';
import ProgressBar from '../components/ProgressBar';
import { colors, spacing, radius, font } from '../theme';
import { useApp } from '../context/AppContext';
import { todayKey, isInThisWeek } from '../utils/date';

export default function PsychScreen() {
  const { state, markPsychToday, unmarkPsychToday, setPsychWeeklyTarget } = useApp();
  if (!state) return null;

  const today = todayKey();
  const doneToday = state.psych.practiceDays.includes(today);
  const weekCount = state.psych.practiceDays.filter(isInThisWeek).length;
  const target = state.psych.weeklyTarget;
  const progress = target === 0 ? 0 : weekCount / target;

  const openLink = (url) => {
    Linking.openURL(url).catch(() => {});
  };

  return (
    <Screen title="פסיכוטכני" subtitle="הכנה קוגניטיבית — תרגול חיצוני">
      {/* יעד שבועי */}
      <Card highlight>
        <View style={styles.weekHeader}>
          <Text style={styles.weekTitle}>יעד שבועי</Text>
          <View style={styles.targetAdjust}>
            <Pressable onPress={() => setPsychWeeklyTarget(target - 1)} hitSlop={8} style={styles.adjBtn}>
              <Ionicons name="remove" size={18} color={colors.bg} />
            </Pressable>
            <Text style={styles.targetNum}>{target}</Text>
            <Pressable onPress={() => setPsychWeeklyTarget(target + 1)} hitSlop={8} style={styles.adjBtn}>
              <Ionicons name="add" size={18} color={colors.bg} />
            </Pressable>
          </View>
        </View>
        <Text style={styles.weekCount}>
          <Text style={styles.weekCountBig}>{weekCount}</Text> מתוך {target} תרגולים השבוע
        </Text>
        <ProgressBar progress={progress} height={10} />

        <Pressable
          style={[styles.markBtn, doneToday && styles.markBtnDone]}
          onPress={() => (doneToday ? unmarkPsychToday() : markPsychToday())}
        >
          <Ionicons
            name={doneToday ? 'checkmark-circle' : 'add-circle-outline'}
            size={22}
            color={doneToday ? colors.bg : colors.bg}
          />
          <Text style={styles.markText}>{doneToday ? 'תרגלת היום — כל הכבוד!' : 'תרגלתי היום'}</Text>
        </Pressable>
      </Card>

      {/* קישורי תרגול חיצוניים */}
      <Text style={styles.sectionTitle}>אתרי תרגול מומלצים</Text>
      <Text style={styles.sectionSub}>
        תרגול ברמה קוגניטיבית גבוהה: סדרות, צורות, לוגיקה וזריזות. הקישורים נפתחים באתר החיצוני.
      </Text>

      {state.psych.links.map((link) => (
        <Pressable key={link.id} onPress={() => openLink(link.url)}>
          <Card style={styles.linkCard}>
            <View style={styles.linkIcon}>
              <Ionicons name="school-outline" size={22} color={colors.gold} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.linkTitle}>{link.title}</Text>
              <Text style={styles.linkSub}>{link.subtitle}</Text>
            </View>
            <Ionicons name="open-outline" size={20} color={colors.creamDim} />
          </Card>
        </Pressable>
      ))}

      <Text style={styles.footnote}>
        טיפ: קבע לעצמך שעה קבועה לתרגול, וסמן "תרגלתי היום" מיד בסיום כדי לשמור על רצף.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  weekHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  weekTitle: { color: colors.cream, fontSize: font.h3, fontWeight: '800' },
  targetAdjust: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm },
  adjBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  targetNum: { color: colors.cream, fontSize: font.h3, fontWeight: '900', minWidth: 26, textAlign: 'center' },
  weekCount: { color: colors.creamDim, fontSize: font.small, textAlign: 'right', marginTop: spacing.md, marginBottom: spacing.sm },
  weekCountBig: { color: colors.gold, fontSize: font.h3, fontWeight: '900' },
  markBtn: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    backgroundColor: colors.gold, borderRadius: radius.pill, paddingVertical: spacing.md, marginTop: spacing.lg,
  },
  markBtnDone: { backgroundColor: colors.success },
  markText: { color: colors.bg, fontWeight: '800', fontSize: font.body },
  sectionTitle: { color: colors.cream, fontSize: font.h3, fontWeight: '700', marginTop: spacing.lg, textAlign: 'right' },
  sectionSub: { color: colors.creamDim, fontSize: font.small, textAlign: 'right', marginBottom: spacing.md, marginTop: 4, lineHeight: 20 },
  linkCard: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.md },
  linkIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.bgDeep, alignItems: 'center', justifyContent: 'center' },
  linkTitle: { color: colors.cream, fontSize: font.body, fontWeight: '700', textAlign: 'right' },
  linkSub: { color: colors.creamDim, fontSize: font.tiny, textAlign: 'right', marginTop: 2 },
  footnote: { color: colors.creamDim, fontSize: font.tiny, textAlign: 'center', marginTop: spacing.lg, lineHeight: 18 },
});
