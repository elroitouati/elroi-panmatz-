import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { colors, radius, layout, state } from '../design/tokens';

// אריח בנטו. על רקע כהה העומק בא ממשטח ומסגרת 1px — לא מצל.
// accent=true נותן לאריח יחיד את צבע הדגש; זה מה שהופך רשת לקיר
// או להיררכיה. אריח דגש אחד לכל רשת, לא יותר.
export default function Tile({ children, accent = false, onPress, style, accessibilityLabel }) {
  const body = (
    <View
      style={[
        styles.tile,
        accent ? styles.accent : styles.plain,
        style,
      ]}
    >
      {children}
    </View>
  );

  if (!onPress) return body;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => pressed && { opacity: state.pressedOpacity }}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: radius.lg,
    padding: layout.cardPadding,
    borderWidth: 1,
  },
  plain: {
    backgroundColor: colors.surface1,
    borderColor: colors.border,
  },
  accent: {
    backgroundColor: colors.accentSurface,
    borderColor: colors.accentBorder,
  },
});
