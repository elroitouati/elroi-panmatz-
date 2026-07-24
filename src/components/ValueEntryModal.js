import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { colors, radius, spacing, font } from '../theme';

// הזנת ערך אמיתי שבוצע: חזרות (מספר) או זמן ריצה (דקות:שניות).
export default function ValueEntryModal({ visible, goal, onClose, onSubmit }) {
  const isTime = goal?.unit === 'זמן';
  const [reps, setReps] = useState('');
  const [min, setMin] = useState('');
  const [sec, setSec] = useState('');

  useEffect(() => {
    if (visible && goal) {
      if (isTime) {
        setMin(String(Math.floor(goal.current / 60)));
        setSec(String(goal.current % 60).padStart(2, '0'));
      } else {
        setReps(String(goal.current));
      }
    }
  }, [visible, goal]);

  if (!goal) return null;

  const submit = () => {
    let value;
    if (isTime) {
      const m = parseInt(min, 10) || 0;
      const s = parseInt(sec, 10) || 0;
      value = m * 60 + s;
    } else {
      value = parseInt(reps, 10);
      if (isNaN(value)) value = goal.current;
    }
    onSubmit(Math.max(0, value));
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>{goal.name}</Text>
          <Text style={styles.sub}>מה התוצאה שביצעת היום?</Text>

          {isTime ? (
            <View style={styles.timeRow}>
              <View style={styles.timeField}>
                <TextInput
                  style={styles.input}
                  keyboardType="number-pad"
                  value={sec}
                  onChangeText={setSec}
                  maxLength={2}
                  placeholder="00"
                  placeholderTextColor={colors.creamDim}
                />
                <Text style={styles.timeLabel}>שניות</Text>
              </View>
              <Text style={styles.colon}>:</Text>
              <View style={styles.timeField}>
                <TextInput
                  style={styles.input}
                  keyboardType="number-pad"
                  value={min}
                  onChangeText={setMin}
                  maxLength={2}
                  placeholder="0"
                  placeholderTextColor={colors.creamDim}
                />
                <Text style={styles.timeLabel}>דקות</Text>
              </View>
            </View>
          ) : (
            <View style={styles.repsWrap}>
              <TextInput
                style={styles.input}
                keyboardType="number-pad"
                value={reps}
                onChangeText={setReps}
                maxLength={4}
                placeholder="0"
                placeholderTextColor={colors.creamDim}
              />
              <Text style={styles.timeLabel}>{goal.unit || 'חזרות'}</Text>
            </View>
          )}

          <View style={styles.actions}>
            <Pressable style={[styles.btn, styles.btnGhost]} onPress={onClose}>
              <Text style={styles.btnGhostText}>ביטול</Text>
            </Pressable>
            <Pressable style={[styles.btn, styles.btnGold]} onPress={submit}>
              <Text style={styles.btnGoldText}>שמירה</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.xl, width: '100%', maxWidth: 340, borderWidth: 1, borderColor: colors.line },
  title: { color: colors.cream, fontSize: font.h3, fontWeight: '800', textAlign: 'center' },
  sub: { color: colors.creamDim, fontSize: font.small, textAlign: 'center', marginTop: 4, marginBottom: spacing.lg },
  timeRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  timeField: { alignItems: 'center' },
  colon: { color: colors.cream, fontSize: 34, fontWeight: '800', marginBottom: 18 },
  repsWrap: { alignItems: 'center' },
  input: {
    backgroundColor: colors.bgDeep, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.line,
    color: colors.gold, fontSize: 34, fontWeight: '900', textAlign: 'center', width: 96, paddingVertical: spacing.sm,
  },
  timeLabel: { color: colors.creamDim, fontSize: font.tiny, marginTop: 4 },
  actions: { flexDirection: 'row-reverse', gap: spacing.md, marginTop: spacing.xl },
  btn: { flex: 1, paddingVertical: spacing.md, borderRadius: radius.pill, alignItems: 'center' },
  btnGhost: { backgroundColor: colors.bgDeep, borderWidth: 1, borderColor: colors.line },
  btnGhostText: { color: colors.creamDim, fontWeight: '700' },
  btnGold: { backgroundColor: colors.gold },
  btnGoldText: { color: colors.bg, fontWeight: '800' },
});
