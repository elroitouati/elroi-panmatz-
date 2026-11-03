import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, space } from '../design/tokens';
import { text } from '../design/typography';
import { stageStatus, currentStageIndex } from '../utils/stages';

// מסלול הקבלה: נקודה לכל שלב על קו (7 שלבים — תוויות קצרות, עד שתי שורות). 'row' מתהפך ב-RTL — השלב הראשון מימין.
// שלב שעבר: מילוי זהב עם ווי. נוכחי: זהב עם הילה ואייקון. עתידי: מתאר בלבד.
const SHORT = {
  registration: 'הרשמה',
  openday: 'יום פתוח',
  psychotechnical: 'מבחן',
  fieldday: 'יום שדה',
  medical: 'רפואי',
  summercourse: 'הכנה',
  start: 'פתיחה',
};
const DOT = 28;

export default function StagePath({ stages }) {
  const cur = currentStageIndex(stages);
  const n = stages.length;
  const half = 50 / n; // מרכז העמודה הראשונה, באחוזים
  const done = n > 1 ? (cur / (n - 1)) * (100 - 2 * half) : 0;

  return (
    <View style={styles.wrap} accessibilityLabel={`השלב הנוכחי: ${stages[cur]?.name}`}>
      <View style={[styles.line, { start: `${half}%`, end: `${half}%` }]} />
      <View style={[styles.line, styles.lineDone, { start: `${half}%`, width: `${done}%` }]} />
      {stages.map((s, i) => {
        const st = stageStatus(stages, i);
        return (
          <View key={s.id} style={styles.col}>
            <View style={[styles.halo, st === 'current' && styles.haloOn]}>
              <View style={[styles.dot, st !== 'upcoming' && styles.dotOn]}>
                {st === 'done' ? <Ionicons name="checkmark" size={14} color={colors.onGold} /> : null}
                {st === 'current' ? <Ionicons name={s.icon} size={14} color={colors.onGold} /> : null}
              </View>
            </View>
            <Text
              style={[text.caption, styles.label, st === 'current' && styles.labelOn]}
              numberOfLines={2}
            >
              {SHORT[s.id] || s.name}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row' },
  line: { position: 'absolute', top: 5 + DOT / 2 - 1, height: 2, backgroundColor: colors.track },
  lineDone: { backgroundColor: colors.gold },
  col: { flex: 1, alignItems: 'center', gap: space[2] },
  halo: { width: DOT + 10, height: DOT + 10, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  haloOn: { backgroundColor: colors.goldSoft },
  dot: {
    width: DOT, height: DOT, borderRadius: DOT / 2, borderWidth: 2, borderColor: colors.ink3,
    backgroundColor: colors.group, alignItems: 'center', justifyContent: 'center',
  },
  dotOn: { backgroundColor: colors.gold, borderColor: colors.gold },
  label: { textAlign: 'center' },
  labelOn: { color: colors.gold, fontFamily: 'Heebo_700Bold' },
});
