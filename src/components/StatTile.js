import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing, font, shadow } from '../theme';
import IconBadge from './IconBadge';

// אריח סטטיסטיקה קומפקטי: תג-אייקון + מספר גדול + תווית — לשורות סיכום מהירות.
export default function StatTile({ icon, value, label, emphasis }) {
  return (
    <View style={styles.tile}>
      <IconBadge icon={icon} size={36} iconSize={17} active={emphasis} />
      <Text style={[styles.value, emphasis && { color: colors.gold }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.label} numberOfLines={1}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    gap: 6,
    ...shadow.soft,
  },
  value: { color: colors.cream, fontSize: font.h2, fontWeight: '900' },
  label: { color: colors.creamDim, fontSize: font.tiny, textAlign: 'center' },
});
