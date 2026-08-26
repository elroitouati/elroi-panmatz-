import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, space } from '../design/tokens';
import { text } from '../design/typography';
import { stageStatus } from '../utils/stages';

// ============================================================================
//  מפת המסלול — חמשת שלבי הקבלה.
//  שלושת המצבים נבדלים בשלושה אותות ולא רק בצבע:
//    הושלם  — מתאר בלבד + סימן וי
//    נוכחי  — מילוי מלא + אייקון השלב + עיגול גדול יותר
//    נעול   — משטח עמום + אייקון מנעול
//  כך המפה קריאה גם בלי הבחנת צבע.
// ============================================================================

const DOT = 40;
const DOT_CURRENT = 48;

export default function StageMap({ stages }) {
  return (
    <View style={styles.row} accessibilityLabel="מפת שלבי הקבלה">
      {stages.map((stage, i) => {
        const status = stageStatus(stages, i);
        const isDone = status === 'done';
        const isCurrent = status === 'current';
        const size = isCurrent ? DOT_CURRENT : DOT;

        const iconName = isDone ? 'checkmark' : isCurrent ? stage.icon : 'lock-closed';
        const iconColor = isCurrent ? colors.onAccent : isDone ? colors.accent : colors.text3;

        return (
          <View key={stage.id} style={styles.item}>
            <View style={styles.dotRow}>
              {/* מחבר לשלב הבא. תחת RTL הצד ההתחלתי הוא ימין,
                  ולכן הקו נמתח מהנקודה שמאלה — אל השלב הבא. */}
              {i < stages.length - 1 && (
                <View
                  style={[
                    styles.connector,
                    { backgroundColor: isDone ? colors.accentBorder : colors.border },
                  ]}
                />
              )}
              <View
                style={[
                  styles.dot,
                  { width: size, height: size, borderRadius: size / 2 },
                  isCurrent && styles.dotCurrent,
                  isDone && styles.dotDone,
                  !isCurrent && !isDone && styles.dotLocked,
                ]}
              >
                <Ionicons name={iconName} size={isCurrent ? 20 : 16} color={iconColor} />
              </View>
            </View>

            <Text
              style={[
                text.label,
                styles.label,
                isCurrent && styles.labelCurrent,
                isDone && styles.labelDone,
              ]}
              numberOfLines={3}
            >
              {stage.name}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  item: { flex: 1, alignItems: 'center' },
  dotRow: {
    width: '100%',
    height: DOT_CURRENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connector: {
    position: 'absolute',
    height: 2,
    start: '50%',
    width: '100%',
    top: DOT_CURRENT / 2 - 1,
  },
  dot: { alignItems: 'center', justifyContent: 'center', borderWidth: 2, zIndex: 2 },
  dotCurrent: { backgroundColor: colors.accent, borderColor: colors.accent },
  dotDone: { backgroundColor: 'transparent', borderColor: colors.accentBorder },
  dotLocked: { backgroundColor: colors.surface1, borderColor: colors.border },
  label: { textAlign: 'center', marginTop: space[2] },
  labelCurrent: { color: colors.accent },
  labelDone: { color: colors.text2 },
});
