import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Sheet from '../components/Sheet';
import Num from '../components/Num';
import Stepper from '../components/Stepper';
import Button from '../components/Button';
import { space } from '../design/tokens';
import { text } from '../design/typography';
import { haptic } from '../design/haptics';
import { formatValue, unitLabel } from '../utils/fitness';

// כמה עשית היום? המספר הגדול הוא הממשק: ± בצעדים (חזרה אחת / 5 שניות),
// מתחיל מהיעד היומי — ברוב הימים פשוט לוחצים "שמירת התוצאה".
export default function ValueSheet({ goal, onClose, onSubmit }) {
  const last = useRef(goal);
  if (goal) last.current = goal;
  const g = last.current;
  const [value, setValue] = useState(goal?.current ?? 0);

  useEffect(() => { if (goal) setValue(goal.current); }, [goal]);

  if (!g) return null;
  const step = g.unit === 'זמן' ? 5 : 1;

  return (
    <Sheet visible={!!goal} onClose={onClose}>
      <Text style={[text.title, styles.center]}>{g.name}</Text>
      <Text style={[text.sub, styles.center]}>כמה עשית היום?</Text>

      <View style={styles.valueRow}>
        <Num value={formatValue(g, value)} unit={unitLabel(g)} size="stat" />
      </View>
      <View style={styles.stepper}>
        <Stepper
          onPlus={() => setValue((v) => v + step)}
          onMinus={() => setValue((v) => Math.max(0, v - step))}
          minusDisabled={value <= 0}
          plusLabel={g.unit === 'זמן' ? 'הוספת 5 שניות' : 'חזרה נוספת'}
          minusLabel={g.unit === 'זמן' ? 'הפחתת 5 שניות' : 'חזרה אחת פחות'}
        />
      </View>

      <Button
        label="שמירת התוצאה"
        variant="primary"
        onPress={() => { haptic.success(); onSubmit(value); }}
        wrapStyle={styles.cta}
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  center: { textAlign: 'center' },
  valueRow: { alignItems: 'center', marginTop: space[6] },
  stepper: { alignItems: 'center', marginTop: space[4] },
  cta: { marginTop: space[8] },
});
