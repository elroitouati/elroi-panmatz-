import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../design/tokens';

// תג-אייקון עגול. active = מילוי זהב מלא, אחרת מילוי זהב שקוף.
export default function IconBadge({ icon, size = 40, iconSize, active = false, tone = 'accent' }) {
  const iSize = iconSize || Math.round(size * 0.48);
  const palette = tone === 'neutral'
    ? { on: colors.surface3, off: colors.surface1, fgOn: colors.text1, fgOff: colors.text2 }
    : { on: colors.accent, off: colors.accentSurface, fgOn: colors.onAccent, fgOff: colors.accent };

  return (
    <View
      style={[
        styles.badge,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: active ? palette.on : palette.off,
        },
      ]}
    >
      <Ionicons name={icon} size={iSize} color={active ? palette.fgOn : palette.fgOff} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignItems: 'center', justifyContent: 'center' },
});
