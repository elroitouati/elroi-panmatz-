import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Sheet from '../components/Sheet';
import Stepper from '../components/Stepper';
import Button from '../components/Button';
import { colors, space, type } from '../design/tokens';
import { text } from '../design/typography';
import { ltr } from '../design/rtl';
import { haptic } from '../design/haptics';
import { shiftTime, formatTime } from '../utils/reminders';

// בחירת שעת תזכורת. השעה הגדולה היא הממשק; שני סטפרים — שעות ורבעי שעה.
// target = { title, subtitle, time, custom } — custom: יש ליום שעה מיוחדת.
export default function TimeSheet({ target, onClose, onSave, onReset }) {
  const last = useRef(target);
  if (target) last.current = target;
  const t = last.current;
  const [time, setTime] = useState(target?.time ?? { hour: 18, minute: 0 });

  useEffect(() => { if (target) setTime(target.time); }, [target]);

  if (!t) return null;
  const shift = (d) => setTime((v) => shiftTime(v, d));

  return (
    <Sheet visible={!!target} onClose={onClose}>
      <Text style={[text.title, styles.center]}>{t.title}</Text>
      {t.subtitle ? <Text style={[text.sub, styles.center]}>{t.subtitle}</Text> : null}

      <Text style={styles.time} allowFontScaling={false} accessibilityLabel={`השעה ${formatTime(time)}`}>
        {ltr(formatTime(time))}
      </Text>

      <View style={styles.steppers}>
        <View style={styles.col}>
          <Stepper
            onPlus={() => shift(60)}
            onMinus={() => shift(-60)}
            plusLabel="שעה מאוחרת יותר"
            minusLabel="שעה מוקדמת יותר"
          />
          <Text style={[text.caption, styles.center]}>שעה</Text>
        </View>
        <View style={styles.col}>
          <Stepper
            onPlus={() => shift(15)}
            onMinus={() => shift(-15)}
            plusLabel="רבע שעה מאוחר יותר"
            minusLabel="רבע שעה מוקדם יותר"
          />
          <Text style={[text.caption, styles.center]}>דקות</Text>
        </View>
      </View>

      <Button
        label="שמירת השעה"
        variant="primary"
        onPress={() => { haptic.success(); onSave(time); onClose(); }}
        wrapStyle={styles.cta}
      />
      {t.custom && onReset ? (
        <Button label="חזרה לשעה הרגילה" variant="plain" onPress={() => { onReset(); onClose(); }} wrapStyle={styles.reset} />
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  center: { textAlign: 'center' },
  time: {
    fontFamily: type.family.heavy, fontSize: 56, lineHeight: 64, color: colors.ink,
    textAlign: 'center', marginTop: space[6], includeFontPadding: false, ...type.tabular,
  },
  steppers: { flexDirection: 'row', justifyContent: 'center', gap: space[6], marginTop: space[4] },
  col: { alignItems: 'center', gap: space[2] },
  cta: { marginTop: space[8] },
  reset: { marginTop: space[2] },
});
