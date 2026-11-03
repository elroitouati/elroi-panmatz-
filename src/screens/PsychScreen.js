import React, { useState } from 'react';
import { View, Text, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Ring from '../components/Ring';
import Button from '../components/Button';
import Stepper from '../components/Stepper';
import Fraction from '../components/Fraction';
import Reveal from '../components/Reveal';
import Segmented from '../components/Segmented';
import EmptyState from '../components/EmptyState';
import { Section, Row } from '../components/Group';
import { colors, radius, space } from '../design/tokens';
import { text } from '../design/typography';
import { ltr } from '../design/rtl';
import { haptic } from '../design/haptics';
import { useApp } from '../context/AppContext';
import { todayKey, isInThisWeek } from '../utils/date';

// ============================================================================
//  מבחן מקוון: פסיכוטכני · מתמטיקה · אנגלית · עברית.
//  בורר מקטעים למעלה. בפסיכוטכני — טבעת שבועית, פעולה אחת ואתרי תרגול.
//  שאר המקצועות ריקים עד שיהיה חומר מדויק למבחן.
// ============================================================================

const SUBJECTS = [
  { value: 'psych', label: 'פסיכוטכני' },
  { value: 'math', label: 'מתמטיקה' },
  { value: 'english', label: 'אנגלית' },
  { value: 'hebrew', label: 'עברית' },
];
const EMPTY_ICON = { math: 'calculator-outline', english: 'language-outline', hebrew: 'book-outline' };

export default function PsychScreen() {
  const { state, markPsychToday, unmarkPsychToday, setPsychWeeklyTarget } = useApp();
  const [subject, setSubject] = useState('psych');
  if (!state) return null;

  const doneToday = state.psych.practiceDays.includes(todayKey());
  const week = state.psych.practiceDays.filter(isInThisWeek).length;
  const target = state.psych.weeklyTarget;

  const toggle = () => {
    if (doneToday) { unmarkPsychToday(); return; }
    haptic.light();
    markPsychToday();
  };

  return (
    <Screen title="מבחן מקוון" overline="פסיכוטכני · מתמטיקה · אנגלית · עברית">
      <Reveal index={0}>
        <Segmented options={SUBJECTS} value={subject} onChange={setSubject} />
      </Reveal>

      {subject !== 'psych' ? (
        <View style={styles.hero}>
          <EmptyState
            icon={EMPTY_ICON[subject]}
            title={`עדיין אין חומר ל${SUBJECTS.find((s) => s.value === subject).label}`}
            body="כשיהיה חומר מדויק למבחן, נוסיף כאן אתרי תרגול ויעד שבועי."
          />
        </View>
      ) : (
      <>
      <Reveal index={1}>
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <Ring progress={target ? week / target : 0} size={112} stroke={10}>
            <Fraction value={week} total={target} />
            <Text style={[text.caption, styles.center]}>השבוע</Text>
          </Ring>

          <View style={styles.side}>
            <Text style={text.caption}>יעד שבועי · פסיכוטכני</Text>
            <Text style={text.title} numberOfLines={1}>{ltr(target)} תרגולים</Text>
            <View style={styles.targetRow}>
              <Stepper
                size="sm"
                onPlus={() => setPsychWeeklyTarget(target + 1)}
                onMinus={() => setPsychWeeklyTarget(target - 1)}
                minusDisabled={target <= 1}
                plusLabel="הגדלת היעד השבועי"
                minusLabel="הפחתת היעד השבועי"
              />
            </View>
          </View>
        </View>
        <Button
          label={doneToday ? 'תרגלת היום' : 'תרגלתי היום'}
          icon={doneToday ? 'checkmark' : undefined}
          variant={doneToday ? 'done' : 'primary'}
          onPress={toggle}
          accessibilityHint={doneToday ? 'לחיצה מבטלת את הסימון' : undefined}
          wrapStyle={styles.cta}
        />
      </View>

      </Reveal>

      <Reveal index={2}>
      <Section title="אתרי תרגול" footer="הקישורים נפתחים בדפדפן.">
        {state.psych.links.map((link) => (
          <Row
            key={link.id}
            title={link.title}
            subtitle={link.subtitle}
            onPress={() => Linking.openURL(link.url).catch(() => {})}
            accessibilityLabel={`${link.title} — נפתח בדפדפן`}
            trailing={<Ionicons name="open-outline" size={18} color={colors.ink3} />}
          />
        ))}
      </Section>
      </Reveal>
      </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.group, borderRadius: radius.card, padding: space[4] },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: space[4] },
  center: { textAlign: 'center' },
  side: { flex: 1, minWidth: 0, gap: 4 },
  targetRow: { flexDirection: 'row', marginTop: space[2] },
  cta: { marginTop: space[4] },
});
