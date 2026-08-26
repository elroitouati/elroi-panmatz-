import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, radius } from '../design/tokens';

// פס התקדמות. alignItems: 'flex-start' תחת RTL מצמיד את המילוי לימין,
// כך שהפס מתמלא מתחילת השורה כמו שהעין העברית מצפה.
export default function ProgressBar({ progress = 0, height = 6, color = colors.accent, label }) {
  const pct = Math.max(0, Math.min(1, progress));
  return (
    <View
      style={[styles.track, { height, borderRadius: radius.pill }]}
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct * 100) }}
    >
      <View
        style={{
          width: `${pct * 100}%`,
          height: '100%',
          backgroundColor: color,
          borderRadius: radius.pill,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    backgroundColor: colors.bgSunken,
    overflow: 'hidden',
    alignItems: 'flex-start',
  },
});
