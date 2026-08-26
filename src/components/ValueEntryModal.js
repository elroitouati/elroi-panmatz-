import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Sheet from './Sheet';
import Input from './Input';
import Button from './Button';
import { space, colors } from '../design/tokens';
import { text } from '../design/typography';

// הזנת התוצאה שבוצעה בפועל. שדה זמן מפוצל לשתי תיבות (דקות · שניות),
// כי צורת השדה מלמדת את הפורמט לפני שנעשית טעות.
export default function ValueEntryModal({ visible, goal, onClose, onSubmit }) {
  const isTime = goal?.unit === 'זמן';
  const [reps, setReps] = useState('');
  const [min, setMin] = useState('');
  const [sec, setSec] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!visible || !goal) return;
    setError(null);
    if (isTime) {
      setMin(String(Math.floor(goal.current / 60)));
      setSec(String(goal.current % 60).padStart(2, '0'));
    } else {
      setReps(String(goal.current));
    }
  }, [visible, goal]);

  if (!goal) return null;

  const submit = () => {
    if (isTime) {
      const m = parseInt(min, 10);
      const s = parseInt(sec, 10);
      if (isNaN(m) || isNaN(s) || s > 59) {
        setError('הזן דקות ושניות, כששניות הן בין 0 ל-59.');
        return;
      }
      onSubmit(Math.max(0, m * 60 + s));
    } else {
      const v = parseInt(reps, 10);
      if (isNaN(v) || v < 0) {
        setError('הזן מספר חזרות — מספר שלם מ-0 ומעלה.');
        return;
      }
      onSubmit(v);
    }
  };

  return (
    <Sheet visible={visible} onClose={onClose}>
      <Text style={text.title}>{goal.name}</Text>
      <Text style={[text.bodyDim, styles.sub]}>מה התוצאה שביצעת היום?</Text>

      {isTime ? (
        <View style={styles.timeRow}>
          <Input
            label="דקות"
            value={min}
            onChangeText={(v) => { setMin(v); setError(null); }}
            keyboardType="number-pad"
            maxLength={2}
            placeholder="8"
            numeric
            style={styles.timeField}
          />
          <Input
            label="שניות"
            value={sec}
            onChangeText={(v) => { setSec(v); setError(null); }}
            keyboardType="number-pad"
            maxLength={2}
            placeholder="30"
            numeric
            style={styles.timeField}
          />
        </View>
      ) : (
        <Input
          label={goal.unit || 'חזרות'}
          value={reps}
          onChangeText={(v) => { setReps(v); setError(null); }}
          keyboardType="number-pad"
          maxLength={4}
          placeholder="12"
          numeric
        />
      )}

      {error ? <Text style={[text.label, styles.error]}>{error}</Text> : null}

      <View style={styles.actions}>
        <Button label="ביטול" variant="tertiary" onPress={onClose} />
        <Button label="שמירת התוצאה" variant="primary" onPress={submit} />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  sub: { marginTop: space[1], marginBottom: space[5] },
  timeRow: { flexDirection: 'row', gap: space[3] },
  timeField: { flex: 1 },
  error: { color: colors.danger, marginTop: space[2] },
  actions: { flexDirection: 'row', gap: space[3], marginTop: space[6] },
});
