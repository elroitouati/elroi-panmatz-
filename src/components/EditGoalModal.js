import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Switch, StyleSheet } from 'react-native';
import Sheet from './Sheet';
import Input from './Input';
import Button from './Button';
import DayPicker from './DayPicker';
import { space, colors } from '../design/tokens';
import { text } from '../design/typography';

// עריכת יעד. שדה יחיד בכל שורה, תווית מעל, ו-placeholder שמדגים פורמט.
export default function EditGoalModal({ visible, goal, onClose, onSave, onDelete }) {
  const [name, setName] = useState('');
  const [finalVal, setFinalVal] = useState('');
  const [step, setStep] = useState('');
  const [days, setDays] = useState([]);
  const [measured, setMeasured] = useState(true);
  const [error, setError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isTime = goal?.unit === 'זמן';

  useEffect(() => {
    if (!visible || !goal) return;
    setError(null);
    setConfirmDelete(false);
    setName(goal.name);
    setStep(String(goal.step));
    setDays([...goal.trainingDays]);
    setMeasured(goal.tracking === 'measured');
    setFinalVal(
      isTime
        ? `${Math.floor(goal.final / 60)}:${String(goal.final % 60).padStart(2, '0')}`
        : String(goal.final)
    );
  }, [visible, goal]);

  if (!goal) return null;

  const parseFinal = () => {
    if (!isTime) {
      const n = parseInt(finalVal, 10);
      return isNaN(n) ? null : n;
    }
    const [mm, ss] = finalVal.split(':');
    const m = parseInt(mm, 10);
    const s = parseInt(ss ?? '0', 10);
    if (isNaN(m) || isNaN(s) || s > 59) return null;
    return m * 60 + s;
  };

  const save = () => {
    if (!name.trim()) { setError('ליעד צריך שם.'); return; }
    const fin = parseFinal();
    if (fin === null) {
      setError(isTime ? 'היעד הסופי צריך להיראות כך: 8:00' : 'היעד הסופי צריך להיות מספר.');
      return;
    }
    if (!days.length) { setError('בחר לפחות יום אימון אחד.'); return; }

    onSave({
      name: name.trim(),
      final: fin,
      step: Math.max(1, parseInt(step, 10) || goal.step),
      trainingDays: [...days].sort((a, b) => a - b),
      tracking: measured ? 'measured' : 'check',
    });
    onClose();
  };

  return (
    <Sheet visible={visible} onClose={onClose} variant="bottom">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
        <Text style={text.title}>עריכת יעד</Text>

        <Input
          label="שם היעד"
          value={name}
          onChangeText={(v) => { setName(v); setError(null); }}
          placeholder="מתח"
        />

        <Input
          label={`יעד סופי${isTime ? ' (דקות:שניות)' : ` (${goal.unit || 'חזרות'})`}`}
          value={finalVal}
          onChangeText={(v) => { setFinalVal(v); setError(null); }}
          keyboardType={isTime ? 'default' : 'number-pad'}
          placeholder={isTime ? '8:00' : '30'}
          numeric={!isTime}
        />

        <Input
          label={`קצב עלייה בכל "קל לי"${isTime ? ' (שניות)' : ''}`}
          value={step}
          onChangeText={setStep}
          keyboardType="number-pad"
          placeholder="1"
          numeric
          hint="בכמה יעלה היעד היומי בכל פעם שתסמן שקל לך."
        />

        <View>
          <Text style={[text.labelStrong, styles.label]}>ימי אימון</Text>
          <DayPicker selected={days} onChange={(d) => { setDays(d); setError(null); }} />
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchText}>
            <Text style={text.bodyStrong}>מעקב מספרים</Text>
            <Text style={text.label}>
              {measured ? 'תרגיל עיקרי — מספרים וגרף מגמה' : 'תרגיל משלים — סימון בלבד'}
            </Text>
          </View>
          <Switch
            value={measured}
            onValueChange={setMeasured}
            trackColor={{ true: colors.accentBorder, false: colors.surface3 }}
            thumbColor={measured ? colors.accent : colors.text3}
            accessibilityLabel="מעקב מספרים"
          />
        </View>

        {error ? <Text style={[text.label, styles.error]}>{error}</Text> : null}

        <Button label="שמירת היעד" variant="primary" onPress={save} />

        {/* מחיקה היא פעולה הרסנית: אדומה, ודורשת אישור שני */}
        {confirmDelete ? (
          <View style={styles.confirm}>
            <Text style={[text.label, styles.confirmText]}>
              המחיקה תסיר גם את היסטוריית המדידות של היעד.
            </Text>
            <View style={styles.confirmRow}>
              <Button label="ביטול" variant="tertiary" onPress={() => setConfirmDelete(false)} />
              <Button
                label="מחיקה"
                variant="danger"
                onPress={() => { onDelete(goal.id); onClose(); }}
              />
            </View>
          </View>
        ) : (
          <Button label="מחיקת היעד" variant="tertiary" onPress={() => setConfirmDelete(true)} />
        )}
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: space[4], paddingBottom: space[4] },
  label: { marginBottom: space[2] },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  switchText: { flex: 1, gap: 2 },
  error: { color: colors.danger },
  confirm: { gap: space[3] },
  confirmText: { textAlign: 'center' },
  confirmRow: { flexDirection: 'row', gap: space[3] },
});
