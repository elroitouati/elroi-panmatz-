import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { colors, radius, spacing, font } from '../theme';
import { dayKey, keyToDate } from '../utils/date';

// הזנת תאריך אמיתי לשלב (יום/חודש/שנה). בלי תלות נייטיב חיצונית.
export default function DateEntryModal({ visible, stage, onClose, onSave, onClear }) {
  const [d, setD] = useState('');
  const [m, setM] = useState('');
  const [y, setY] = useState('');

  useEffect(() => {
    if (visible && stage) {
      if (stage.date) {
        const dt = keyToDate(stage.date);
        setD(String(dt.getDate()));
        setM(String(dt.getMonth() + 1));
        setY(String(dt.getFullYear()));
      } else {
        setD(''); setM(''); setY('');
      }
    }
  }, [visible, stage]);

  if (!stage) return null;

  const save = () => {
    const day = parseInt(d, 10);
    const mon = parseInt(m, 10);
    const yr = parseInt(y, 10);
    if (!day || !mon || !yr || day < 1 || day > 31 || mon < 1 || mon > 12 || yr < 2025 || yr > 2035) {
      return; // קלט לא תקין — לא שומרים
    }
    const dt = new Date(yr, mon - 1, day);
    onSave(dayKey(dt));
    onClose();
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>תאריך עבור: {stage.name}</Text>
          <Text style={styles.sub}>הזן את התאריך האמיתי כשהוא נודע</Text>

          <View style={styles.row}>
            <Field label="יום" value={d} onChange={setD} max={2} placeholder="15" />
            <Field label="חודש" value={m} onChange={setM} max={2} placeholder="11" />
            <Field label="שנה" value={y} onChange={setY} max={4} placeholder="2026" wide />
          </View>

          <Pressable style={styles.saveBtn} onPress={save}>
            <Text style={styles.saveText}>שמירת תאריך</Text>
          </Pressable>

          {stage.date && (
            <Pressable style={styles.clearBtn} onPress={() => { onClear(); onClose(); }}>
              <Text style={styles.clearText}>איפוס לתצוגת חודש בלבד</Text>
            </Pressable>
          )}
          <Pressable style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>ביטול</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Field({ label, value, onChange, max, placeholder, wide }) {
  return (
    <View style={[styles.field, wide && { flex: 1.4 }]}>
      <TextInput
        style={styles.input}
        keyboardType="number-pad"
        value={value}
        onChangeText={onChange}
        maxLength={max}
        placeholder={placeholder}
        placeholderTextColor={colors.creamDim}
      />
      <Text style={styles.fieldLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.xl, width: '100%', maxWidth: 360, borderWidth: 1, borderColor: colors.line },
  title: { color: colors.cream, fontSize: font.h3, fontWeight: '800', textAlign: 'center' },
  sub: { color: colors.creamDim, fontSize: font.small, textAlign: 'center', marginTop: 4, marginBottom: spacing.lg },
  row: { flexDirection: 'row-reverse', gap: spacing.sm, justifyContent: 'center' },
  field: { flex: 1, alignItems: 'center' },
  input: {
    backgroundColor: colors.bgDeep, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.line,
    color: colors.gold, fontSize: font.h2, fontWeight: '900', textAlign: 'center', width: '100%', paddingVertical: spacing.sm,
  },
  fieldLabel: { color: colors.creamDim, fontSize: font.tiny, marginTop: 4 },
  saveBtn: { backgroundColor: colors.gold, borderRadius: radius.pill, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.xl },
  saveText: { color: colors.bg, fontWeight: '800', fontSize: font.body },
  clearBtn: { paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.xs },
  clearText: { color: colors.creamDim, fontSize: font.small, textDecorationLine: 'underline' },
  cancelBtn: { paddingVertical: spacing.sm, alignItems: 'center' },
  cancelText: { color: colors.creamDim, fontSize: font.small },
});
