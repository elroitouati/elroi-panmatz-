import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Sheet from './Sheet';
import Input from './Input';
import Button from './Button';
import { space, colors } from '../design/tokens';
import { text } from '../design/typography';
import { dayKey, keyToDate } from '../utils/date';

// הזנת תאריך אמיתי לשלב.
// קלט לא תקין אומר בדיוק מה לא בסדר ומה הטווח המותר — הגרסה הקודמת
// פשוט לא הגיבה, וזה נראה כאילו הכפתור שבור.
export default function DateEntryModal({ visible, stage, onClose, onSave, onClear }) {
  const [d, setD] = useState('');
  const [m, setM] = useState('');
  const [y, setY] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!visible || !stage) return;
    setError(null);
    if (stage.date) {
      const dt = keyToDate(stage.date);
      setD(String(dt.getDate()));
      setM(String(dt.getMonth() + 1));
      setY(String(dt.getFullYear()));
    } else {
      setD(''); setM(''); setY('');
    }
  }, [visible, stage]);

  if (!stage) return null;

  const touch = (setter) => (v) => { setter(v); setError(null); };

  const save = () => {
    const day = parseInt(d, 10);
    const mon = parseInt(m, 10);
    const yr = parseInt(y, 10);

    if (isNaN(day) || isNaN(mon) || isNaN(yr)) {
      setError('חסר יום, חודש או שנה.');
      return;
    }
    if (day < 1 || day > 31) { setError('היום צריך להיות בין 1 ל-31.'); return; }
    if (mon < 1 || mon > 12) { setError('החודש צריך להיות בין 1 ל-12.'); return; }
    if (yr < 2025 || yr > 2035) { setError('השנה צריכה להיות בין 2025 ל-2035.'); return; }

    const dt = new Date(yr, mon - 1, day);
    if (dt.getDate() !== day || dt.getMonth() !== mon - 1) {
      setError('התאריך הזה לא קיים בלוח השנה.');
      return;
    }

    onSave(dayKey(dt));
    onClose();
  };

  return (
    <Sheet visible={visible} onClose={onClose}>
      <Text style={text.title}>{stage.name}</Text>
      <Text style={[text.bodyDim, styles.sub]}>הזן את התאריך ברגע שהוא נודע.</Text>

      <View style={styles.row}>
        <Input label="יום" value={d} onChangeText={touch(setD)} keyboardType="number-pad" maxLength={2} placeholder="15" numeric style={styles.field} />
        <Input label="חודש" value={m} onChangeText={touch(setM)} keyboardType="number-pad" maxLength={2} placeholder="11" numeric style={styles.field} />
        <Input label="שנה" value={y} onChangeText={touch(setY)} keyboardType="number-pad" maxLength={4} placeholder="2026" numeric style={styles.fieldWide} />
      </View>

      {error ? <Text style={[text.label, styles.error]}>{error}</Text> : null}

      <View style={styles.actions}>
        <Button label="ביטול" variant="tertiary" onPress={onClose} />
        <Button label="שמירת התאריך" variant="primary" onPress={save} />
      </View>

      {stage.date ? (
        <Button
          label="הסרת התאריך"
          variant="tertiary"
          onPress={() => { onClear(); onClose(); }}
          style={styles.clear}
        />
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  sub: { marginTop: space[1], marginBottom: space[5] },
  row: { flexDirection: 'row', gap: space[3] },
  field: { flex: 1 },
  fieldWide: { flex: 1.4 },
  error: { color: colors.danger, marginTop: space[3] },
  actions: { flexDirection: 'row', gap: space[3], marginTop: space[6] },
  clear: { marginTop: space[2] },
});
