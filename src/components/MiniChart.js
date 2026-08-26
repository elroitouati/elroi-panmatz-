import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, space } from '../design/tokens';
import { text } from '../design/typography';
import { ltr } from '../design/rtl';
import { formatValue } from '../utils/fitness';

// ============================================================================
//  גרף מגמה קומפקטי — 12 המדידות האחרונות.
//  קו בסיס עמום נותן לעמודות על מה לשבת, והמדידה האחרונה מודגשת:
//  היא התשובה לשאלה "איפה אני עכשיו", וזו השאלה שבשבילה פותחים את הגרף.
//  ביעדי זמן הכיוון מתהפך — שיפור הוא עמודה גבוהה, גם כשהמספר קטן.
// ============================================================================

const H = 56;

export default function MiniChart({ goal }) {
  const data = (goal.history || []).slice(-12);

  if (data.length < 2) {
    return (
      <Text style={text.label}>
        אחרי שתי מדידות תופיע כאן מגמת ההתקדמות שלך.
      </Text>
    );
  }

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const best = goal.lowerIsBetter ? min : max;
  const lastIndex = data.length - 1;

  const heightFor = (v) => {
    const norm = (v - min) / span;
    return 8 + (goal.lowerIsBetter ? 1 - norm : norm) * (H - 8);
  };

  return (
    <View>
      <View style={styles.plot}>
        <View style={styles.baseline} />
        {data.map((d, i) => {
          const isLast = i === lastIndex;
          return (
            <View key={i} style={styles.col}>
              <View
                style={[
                  styles.bar,
                  {
                    height: heightFor(d.value),
                    backgroundColor: isLast ? colors.accent : colors.surface3,
                  },
                ]}
              />
            </View>
          );
        })}
      </View>

      <View style={styles.legend}>
        <Text style={text.label}>
          אחרון {ltr(formatValue(goal, values[lastIndex]))}
        </Text>
        <Text style={[text.label, styles.best]}>
          שיא {ltr(formatValue(goal, best))}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // 'row' — תחת RTL המדידה הישנה ביותר מימין והחדשה משמאל,
  // בהתאם לכיוון הקריאה.
  plot: { flexDirection: 'row', alignItems: 'flex-end', height: H, gap: 3 },
  baseline: {
    position: 'absolute',
    start: 0,
    end: 0,
    bottom: 0,
    height: 1,
    backgroundColor: colors.border,
  },
  col: { flex: 1, justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: radius.sm, minHeight: 8 },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: space[2],
  },
  best: { color: colors.accent },
});
