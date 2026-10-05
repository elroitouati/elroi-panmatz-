import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, space } from '../design/tokens';
import { text } from '../design/typography';
import { ltr } from '../design/rtl';
import { formatValue } from '../utils/fitness';

// גרף מגמה קומפקטי — 12 המדידות האחרונות. המדידה האחרונה בזהב:
// היא התשובה ל"איפה אני עכשיו". ביעדי זמן שיפור = עמודה גבוהה.
// מוצג רק מ-2 מדידות ומעלה — עד אז אין מגמה, ואין טעם בטקסט מסביר.
const H = 44;

export default function MiniChart({ goal }) {
  const data = (goal.history || []).slice(-12);
  if (data.length < 2) return null;

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const best = goal.lowerIsBetter ? min : max;
  const last = data.length - 1;
  const h = (v) => {
    const n = (v - min) / span;
    return 6 + (goal.lowerIsBetter ? 1 - n : n) * (H - 6);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.plot}>
        {data.map((d, i) => (
          <View key={i} style={styles.col}>
            <View style={[styles.bar, { height: h(d.value), backgroundColor: i === last ? colors.gold : colors.track }]} />
          </View>
        ))}
      </View>
      <View style={styles.legend}>
        <Text style={text.caption}>אחרון {ltr(formatValue(goal, values[last]))}</Text>
        <Text style={[text.caption, styles.best]}>שיא {ltr(formatValue(goal, best))}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space[2] },
  plot: { flexDirection: 'row', alignItems: 'flex-end', height: H, gap: 3 },
  col: { flex: 1, justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 3 },
  legend: { flexDirection: 'row', justifyContent: 'space-between' },
  best: { color: colors.gold },
});
