import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { colors, radius, layout, state } from '../design/tokens';

// אריח בנטו. על רקע כהה העומק בא ממשטח ומסגרת 1px — לא מצל.
// accent=true נותן לאריח יחיד את צבע הדגש; זה מה שהופך רשת לקיר
// או להיררכיה. אריח דגש אחד לכל רשת, לא יותר.
//
// חשוב: האריח הוא אלמנט אחד ויחיד, גם כשהוא לחיץ. עטיפה של View
// בתוך Pressable הפילה את סגנון הרוחב על הילד הפנימי בזמן שההורה
// התכווץ לרוחב התוכן — ורשת האריחים קרסה לעמודות של אות אחת.
export default function Tile({ children, accent = false, onPress, style, accessibilityLabel }) {
  const base = [styles.tile, accent ? styles.accent : styles.plain, style];

  if (!onPress) return <View style={base}>{children}</View>;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [...base, pressed && { opacity: state.pressedOpacity }]}
    >
      {children}
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
