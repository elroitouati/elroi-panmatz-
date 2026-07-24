import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing, font } from '../theme';
import { formatValue } from '../utils/fitness';

// גרף עמודות קומפקטי להתקדמות של תרגיל נמדד (מתח, ריצה).
// בנוי מ-Views בלבד — בלי תלות נייטיב נוספת.
export default function MiniChart({ goal }) {
  const data = (goal.history || []).slice(-12);
  if (data.length < 2) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>
          עוד אין מספיק נתונים לגרף — סמן עוד כמה אימונים כדי לראות מגמה 📊
        </Text>
      </View>
    );
  }
  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;

  // גובה יחסי; בריצה (lowerIsBetter) הופכים כך ששיפור = עמודה גבוהה
  const heightFor = (v) => {
    const norm = (v - min) / span; // 0..1
    const shown = goal.lowerIsBetter ? 1 - norm : norm;
    return 12 + shown * 56; // 12..68
  };

  const best = goal.lowerIsBetter ? min : max;

  return (
    <View>
      <View style={styles.chart}>
        {data.map((d, i) => {
          const isBest = d.value === best;
          return (
            <View key={i} style={styles.col}>
              <View
                style={[
                  styles.bar,
                  { height: heightFor(d.value), backgroundColor: isBest ? colors.gold : colors.goldDim },
                ]}
              />
            </View>
          );
        })}
      </View>
      <View style={styles.legend}>
        <Text style={styles.legendText}>אחרון: {formatValue(goal, values[values.length - 1])}</Text>
        <Text style={[styles.legendText, { color: colors.gold }]}>
          שיא: {formatValue(goal, best)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chart: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-end',
    height: 72,
    gap: 4,
  },
  col: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 4, minHeight: 12 },
  legend: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  legendText: { color: colors.creamDim, fontSize: font.tiny },
  empty: {
    paddingVertical: spacing.md,
  },
  emptyText: {
    color: colors.creamDim,
    fontSize: font.tiny,
    textAlign: 'right',
    lineHeight: 18,
  },
});
