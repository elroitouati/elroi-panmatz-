import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, font, shadow } from '../theme';
import { stageStatus } from '../utils/stages';

// מפת המסלול — חמשת השלבים בשורה, עם חיבור ביניהם וסימון השלב הנוכחי.
// RTL: השלב הראשון מימין.
export default function StageMap({ stages }) {
  return (
    <View style={styles.wrap}>
      {stages.map((stage, i) => {
        const status = stageStatus(stages, i);
        const isDone = status === 'done';
        const isCurrent = status === 'current';
        const dotColor = isCurrent ? colors.gold : isDone ? colors.success : colors.line;
        const iconColor = isCurrent ? colors.bg : isDone ? colors.bg : colors.creamDim;
        return (
          <View key={stage.id} style={styles.item}>
            <View style={styles.rowLine}>
              {/* קו מחבר לשלב הבא (משמאל, כי RTL) */}
              {i < stages.length - 1 && (
                <View
                  style={[
                    styles.connector,
                    { backgroundColor: isDone ? colors.success : colors.line },
                  ]}
                />
              )}
              <View
                style={[
                  styles.dot,
                  { backgroundColor: dotColor, borderColor: isCurrent ? colors.gold : 'transparent' },
                  isCurrent && styles.dotCurrent,
                ]}
              >
                <Ionicons
                  name={isDone ? 'checkmark' : stage.icon}
                  size={18}
                  color={iconColor}
                />
              </View>
            </View>
            <Text
              style={[
                styles.label,
                isCurrent && styles.labelCurrent,
                isDone && styles.labelDone,
              ]}
              numberOfLines={2}
            >
              {stage.name}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const DOT = 44;
const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  item: {
    flex: 1,
    alignItems: 'center',
  },
  rowLine: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    height: DOT,
  },
  connector: {
    position: 'absolute',
    height: 3,
    // מחבר את מרכז הנקודה הנוכחית לזו שמשמאלה
    left: 0,
    right: '50%',
    top: DOT / 2 - 1.5,
  },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    zIndex: 2,
    ...shadow.soft,
  },
  dotCurrent: {
    transform: [{ scale: 1.14 }],
  },
  label: {
    color: colors.creamDim,
    fontSize: font.tiny,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 15,
  },
  labelCurrent: {
    color: colors.gold,
    fontWeight: '700',
  },
  labelDone: {
    color: colors.cream,
  },
});
