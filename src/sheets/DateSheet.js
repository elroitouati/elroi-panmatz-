import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Sheet from '../components/Sheet';
import Input from '../components/Input';
import Button from '../components/Button';
import { colors, space } from '../design/tokens';
import { text } from '../design/typography';
import { haptic } from '../design/haptics';
import { dayKey, keyToDate } from '../utils/date';

// הזנת התאריך האמיתי של שלב. שגיאה אומרת בדיוק מה לא בסדר ומה הטווח.
export default function DateSheet({ stage, onClose, onSave, onClear }) {
  const last = useRef(stage);
  if (stage) last.current = stage;
  const s = last.current;
  const [d, setD] = useState('');
  const [m, setM] = useState('');
  const [y, setY] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!stage) return;
    setError(null);
    if (stage.date) {
      const dt = keyToDate(stage.date);
      setD(String(dt.getDate())); setM(String(dt.getMonth() + 1)); setY(String(dt.getFullYear()));
    } else { setD(''); setM(''); setY(''); }
  }, [stage]);

  if (!s) return null;
  const touch = (setter) => (v) => { setter(v); setError(null); };
  const fail = (msg) => { haptic.error(); setError(msg); };

  const save = () => {
    const day = parseInt(d, 10), mon = parseInt(m, 10), yr = parseInt(y, 10);
    if (isNaN(day) || isNaN(mon) || isNaN(yr)) return fail('חסר יום, חודש או שנה.');
    if (day < 1 || day > 31) return fail('היום צריך להיות בין 1 ל-31.');
    if (mon < 1 || mon > 12) return fail('החודש צריך להיות בין 1 ל-12.');
    if (yr < 2025 || yr > 2035) return fail('השנה צריכה להיות בין 2025 ל-2035.');
    const dt = new Date(yr, mon - 1, day);
    if (dt.getDate() !== day || dt.getMonth() !== mon - 1) return fail('התאריך הזה לא קיים בלוח השנה.');
    haptic.success();
    onSave(dayKey(dt));
    onClose();
  };

  return (
    <Sheet visible={!!stage} onClose={onClose}>
      <Text style={text.title}>{s.name}</Text>
      <Text style={[text.sub, styles.sub]}>הזן את התאריך ברגע שהוא נודע.</Text>

      <View style={styles.row}>
        <Input label="יום" value={d} onChangeText={touch(setD)} keyboardType="number-pad" maxLength={2} placeholder="15" numeric style={styles.field} />
        <Input label="חודש" value={m} onChangeText={touch(setM)} keyboardType="number-pad" maxLength={2} placeholder="11" numeric style={styles.field} />
        <Input label="שנה" value={y} onChangeText={touch(setY)} keyboardType="number-pad" maxLength={4} placeholder="2026" numeric style={styles.wide} />
      </View>

      {error ? <Text style={[text.sub, styles.error]} accessibilityLiveRegion="polite">{error}</Text> : null}

      <Button label="שמירת התאריך" variant="primary" onPress={save} wrapStyle={styles.cta} />
      {s.date ? (
        <Button label="הסרת התאריך" variant="plain" onPress={() => { onClear(); onClose(); }} wrapStyle={styles.clear} />
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  sub: { marginTop: space[1], marginBottom: space[5] },
  row: { flexDirection: 'row', gap: space[3] },
  field: { flex: 1 },
  wide: { flex: 1.4 },
  error: { color: colors.red, marginTop: space[3] },
  cta: { marginTop: space[6] },
  clear: { marginTop: space[2] },
});
