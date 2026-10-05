import React from 'react';
import { View, Text, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Ring from '../components/Ring';
import Button from '../components/Button';
import Stepper from '../components/Stepper';
import Fraction from '../components/Fraction';
import { Section, Row } from '../components/Group';
import { colors, radius, space } from '../design/tokens';
import { text } from '../design/typography';
import { ltr } from '../design/rtl';
import { haptic } from '../design/haptics';
import { useApp } from '../context/AppContext';
import { todayKey, isInThisWeek } from '../utils/date';

// ============================================================================
//  פסיכוטכני. אותה שפה כמו "היום": טבעת שבועית, פעולה אחת, ורשימת אתרים.
// ============================================================================

export default function PsychScreen() {
  const { state, markPsychToday, unmarkPsychToday, setPsychWeeklyTarget } = useApp();
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
    <Screen title="פסיכוטכני" overline="הכנה קוגניטיבית">
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <Ring progress={target ? week / target : 0} size={112} stroke={10}>
            <Fraction value={week} total={target} />
            <Text style={[text.caption, styles.center]}>השבוע</Text>
          </Ring>

          <View style={styles.side}>
            <Text style={text.caption}>יעד שבועי</Text>
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
