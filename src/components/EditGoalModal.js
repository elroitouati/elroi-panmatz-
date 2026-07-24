import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, Pressable, ScrollView, StyleSheet, Switch } from 'react-native';
import { colors, radius, spacing, font } from '../theme';
import DayPicker from './DayPicker';

// עריכה מלאה של יעד: שם, יעד סופי, קצב עלייה, ימי אימון, סוג מדידה, מחיקה.
export default function EditGoalModal({ visible, goal, onClose, onSave, onDelete }) {
  const [name, setName] = useState('');
  const [finalVal, setFinalVal] = useState('');
  const [step, setStep] = useState('');
  const [days, setDays] = useState([]);
  const [measured, setMeasured] = useState(true);

  const isTime = goal?.unit === 'זמן';

  useEffect(() => {
    if (visible && goal) {
      setName(goal.name);
      setStep(String(goal.step));
      setDays([...goal.trainingDays]);
      setMeasured(goal.tracking === 'measured');
      if (isTime) {
        setFinalVal(`${Math.floor(goal.final / 60)}:${String(goal.final % 60).padStart(2, '0')}`);
      } else {
        setFinalVal(String(goal.final));
      }
    }
  }, [visible, goal]);

  if (!goal) return null;

  const parseFinal = () => {
    if (isTime) {
      const parts = finalVal.split(':');
      const m = parseInt(parts[0], 10) || 0;
      const s = parseInt(parts[1], 10) || 0;
      return m * 60 + s;
    }
    const n = parseInt(finalVal, 10);
    return isNaN(n) ? goal.final : n;
  };

  const save = () => {
    onSave({
      name: name.trim() || goal.name,
      final: parseFinal(),
      step: Math.max(1, parseInt(step, 10) || goal.step),
      trainingDays: days.length ? [...days].sort((a, b) => a - b) : goal.trainingDays,
      tracking: measured ? 'measured' : 'check',
    });
    onClose();
  };

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>עריכת יעד</Text>

            <Text style={styles.label}>שם היעד</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="למשל: מתח"
              placeholderTextColor={colors.creamDim}
            />

            <Text style={styles.label}>
              יעד סופי {isTime ? '(דקות:שניות)' : `(${goal.unit || 'חזרות'})`}
            </Text>
            <TextInput
              style={styles.input}
              value={finalVal}
              onChangeText={setFinalVal}
              keyboardType={isTime ? 'default' : 'number-pad'}
              placeholder={isTime ? '8:00' : '30'}
              placeholderTextColor={colors.creamDim}
            />

            <Text style={styles.label}>
              קצב עלייה בכל "קל לי" {isTime ? '(שניות)' : `(${goal.unit || 'חזרות'})`}
            </Text>
            <TextInput
              style={styles.input}
              value={step}
              onChangeText={setStep}
              keyboardType="number-pad"
              placeholder="1"
              placeholderTextColor={colors.creamDim}
            />

            <Text style={styles.label}>ימי אימון</Text>
            <DayPicker selected={days} onChange={setDays} />

            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchTitle}>מעקב מספרים + גרף</Text>
                <Text style={styles.switchSub}>
                  {measured ? 'תרגיל עיקרי — מספרים מדויקים וגרף' : 'תרגיל משלים — וי פשוט בלי מספרים'}
                </Text>
              </View>
              <Switch
                value={measured}
                onValueChange={setMeasured}
                trackColor={{ true: colors.goldDim, false: colors.line }}
                thumbColor={measured ? colors.gold : colors.creamDim}
              />
            </View>

            <Pressable style={styles.saveBtn} onPress={save}>
              <Text style={styles.saveText}>שמירה</Text>
            </Pressable>

            <Pressable style={styles.deleteBtn} onPress={() => { onDelete(goal.id); onClose(); }}>
              <Text style={styles.deleteText}>מחיקת היעד</Text>
            </Pressable>

            <Pressable style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>ביטול</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.card, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg,
    padding: spacing.xl, maxHeight: '90%',
  },
  handle: { width: 44, height: 5, borderRadius: 3, backgroundColor: colors.line, alignSelf: 'center', marginBottom: spacing.md },
  title: { color: colors.cream, fontSize: font.h3, fontWeight: '800', textAlign: 'right', marginBottom: spacing.md },
  label: { color: colors.creamDim, fontSize: font.small, textAlign: 'right', marginTop: spacing.md, marginBottom: 6 },
  input: {
    backgroundColor: colors.bgDeep, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.line,
    color: colors.cream, fontSize: font.body, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, textAlign: 'right',
  },
  switchRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.md, marginTop: spacing.lg },
  switchTitle: { color: colors.cream, fontSize: font.body, fontWeight: '700', textAlign: 'right' },
  switchSub: { color: colors.creamDim, fontSize: font.tiny, textAlign: 'right', marginTop: 2 },
  saveBtn: { backgroundColor: colors.gold, borderRadius: radius.pill, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.xl },
  saveText: { color: colors.bg, fontWeight: '800', fontSize: font.body },
  deleteBtn: { paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.sm },
  deleteText: { color: colors.danger, fontWeight: '700', fontSize: font.small },
  cancelBtn: { paddingVertical: spacing.sm, alignItems: 'center' },
  cancelText: { color: colors.creamDim, fontSize: font.small },
});
