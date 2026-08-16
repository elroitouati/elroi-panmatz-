import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

// תג-אייקון עגול — רקע זהב שקוף עדין (לא פעיל) או זהב מלא (פעיל).
export default function IconBadge({
  icon,
  size = 44,
  iconSize,
  iconColor = colors.gold,
  bgTint = 'rgba(240,194,57,0.14)',
  active = false,
}) {
  const iSize = iconSize || Math.round(size * 0.46);
  const bg = active ? colors.gold : bgTint;
  const fg = active ? colors.bg : iconColor;
  return (
    <View style={[styles.badge, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <Ionicons name={icon} size={iSize} color={fg} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignItems: 'center', justifyContent: 'center' },
});
