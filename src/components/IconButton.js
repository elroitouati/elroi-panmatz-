import React from 'react';
import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Press from './Press';
import { colors, press } from '../design/tokens';

// כפתור אייקון עגול, 40px גלוי ו-44px מגע (hitSlop).
export default function IconButton({ icon, label, onPress, tone = 'default' }) {
  return (
    <Press
      onPress={onPress}
      accessibilityLabel={label}
      scaleTo={press.scaleSmall}
      hitSlop={4}
      style={[styles.btn, tone === 'plain' && styles.plain]}
    >
      <Ionicons name={icon} size={20} color={colors.ink2} />
    </Press>
  );
}

const styles = StyleSheet.create({
  btn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.group, alignItems: 'center', justifyContent: 'center' },
  plain: { backgroundColor: 'transparent' },
});
