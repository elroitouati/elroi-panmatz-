import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Sheet from '../components/Sheet';
import Input from '../components/Input';
import Button from '../components/Button';
import DayPicker from '../components/DayPicker';
import Toggle from '../components/Toggle';
import { colors, radius, space } from '../design/tokens';
import { text } from '../design/typography';
import { haptic } from '../design/haptics';

// עריכת יעד. שדה אחד בשורה, תווית מעל, placeholder שמדגים פורמט.
// מחיקה הרסנית — אדומה ודורשת אישור שני.
export default function EditGoalSheet({ goal, onClose, onSave, onDelete }) {
  const last = useRef(goal);
  if (goal) last.current = goal;
  const g = last.current;

  const [name, setName] = useState('');
  const [finalVal, setFinalVal] = useState('');
  const [step, setStep] = useState('');
  const [days, setDays] = useState([]);
  const [measured, setMeasured] = useState(true);
  const [enabled, setEnabled] = useState(true);
  const [error, setError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isTime = g?.unit === 'זמן';

  useEffect(() => {
    if (!goal) return;
    setError(null);
    setConfirmDelete(false);
    setName(goal.name);
    setStep(String(goal.step));
    setDays([...goal.trainingDays]);
    setMeasured(goal.tracking === 'measured');
    setEnabled(goal.enabled !== false);
    setFinalVal(
      goal.unit === 'זמן'
        ? `${Math.floor(goal.final / 60)}:${String(goal.final % 60).padStart(2, '0')}`
        : String(goal.final)
    );
  }, [goal]);

  if (!g) return null;

  const parseFinal = () => {
    if (!isTime) {
      const n = parseInt(finalVal, 10);
      return isNaN(n) ? null : n;
    }
    const [mm, ss] = finalVal.split(':');
    const mi = parseInt(mm, 10);
    const se = parseInt(ss ?? '0', 10);
    if (isNaN(mi) || isNaN(se) || se > 59) return null;
    return mi * 60 + se;
  };

  const fail = (msg) => { haptic.error(); setError(msg); };

  const save = () => {
    if (!name.trim()) return fail('ליעד צריך שם.');
    const fin = parseFinal();
    if (fin === null) return fail(isTime ? 'היעד הסופי צריך להיראות כך: 8:00' : 'היעד הסופי צריך להיות מספר.');
    if (!days.length) return fail('בחר לפחות יום אימון אחד.');
    haptic.success();
    onSave({
      name: name.trim(),
      final: fin,
      step: Math.max(1, parseInt(step, 10) || g.step),
      trainingDays: [...days].sort((a, b) => a - b),
      tracking: measured ? 'measured' : 'check',
    }, enabled);
    onClose();
  };

  return (
    <Sheet visible={!!goal} onClose={onClose} scroll>
      <View style={styles.body}>
        <Text style={text.title}>עריכת יעד</Text>

        <Input label="שם היעד" value={name} onChangeText={(v) => { setName(v); setError(null); }} placeholder="מתח" />

        <Input
          label={`יעד סופי${isTime ? ' (דקות:שניות)' : ` (${g.unit || 'חזרות'})`}`}
          value={finalVal}
          onChangeText={(v) => { setFinalVal(v); setError(null); }}
          keyboardType={isTime ? 'numbers-and-punctuation' : 'number-pad'}
          placeholder={isTime ? '8:00' : '30'}
          numeric
        />

        <Input
          label={`קצב עלייה בכל "קל לי"${isTime ? ' (שניות)' : ''}`}
          value={step}
          onChangeText={setStep}
          keyboardType="number-pad"
          placeholder="1"
          numeric
          hint="בכמה יזוז היעד היומי בכל לחיצה."
        />

        <View>
          <Text style={[text.caption, styles.label]}>ימי אימון</Text>
          <DayPicker selected={days} onChange={(d) => { setDays(d); setError(null); }} />
        </View>

        <View style={styles.group}>
          <View style={styles.switchRow}>
            <View style={styles.switchText}>
              <Text style={text.headline}>מעקב מספרים</Text>
              <Text style={text.caption}>{measured ? 'מספרים, התקדמות וגרף' : 'סימון בלבד'}</Text>
            </View>
            <Toggle value={measured} onValueChange={setMeasured} label="מעקב מספרים" />
          </View>
          <View style={styles.sep} />
          <View style={styles.switchRow}>
            <View style={styles.switchText}>
              <Text style={text.headline}>יעד פעיל</Text>
              <Text style={text.caption}>{enabled ? 'מופיע ביעדי היום' : 'מושהה — לא מופיע ביעדי היום'}</Text>
            </View>
            <Toggle value={enabled} onValueChange={setEnabled} label="יעד פעיל" />
          </View>
        </View>

        {error ? <Text style={[text.sub, styles.error]} accessibilityLiveRegion="polite">{error}</Text> : null}

        <Button label="שמירת היעד" variant="primary" onPress={save} />

        {confirmDelete ? (
          <View style={styles.confirm}>
            <Text style={[text.sub, styles.center]}>המחיקה תסיר גם את היסטוריית המדידות של היעד.</Text>
            <View style={styles.confirmRow}>
              <Button label="ביטול" variant="secondary" onPress={() => setConfirmDelete(false)} wrapStyle={styles.flex} />
              <Button label="מחיקה" variant="destructive" onPress={() => { haptic.error(); onDelete(g.id); onClose(); }} wrapStyle={styles.flex} />
            </View>
          </View>
        ) : (
          <Button label="מחיקת היעד" variant="destructive" onPress={() => setConfirmDelete(true)} />
        )}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: space[5], paddingBottom: space[2] },
  label: { marginBottom: space[2] },
  group: { backgroundColor: colors.group, borderRadius: radius.group, paddingHorizontal: space[4] },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: space[3], minHeight: 64 },
  switchText: { flex: 1, gap: 2 },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: colors.separator },
  error: { color: colors.red },
  confirm: { gap: space[3] },
  confirmRow: { flexDirection: 'row', gap: space[3] },
  flex: { flex: 1 },
  center: { textAlign: 'center' },
});
