import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, radius } from '../theme';

// פס התקדמות אופקי. RTL: המילוי מתחיל מימין.
export default function ProgressBar({ progress = 0, color = colors.gold, height = 10, track = colors.bgDeep }) {
  const pct = Math.max(0, Math.min(1, progress)) * 100;
  return (
    <View style={[styles.track, { height, backgroundColor: track, borderRadius: height }]}>
      <View
        style={{
          width: `${pct}%`,
          height: '100%',
          backgroundColor: color,
          borderRadius: height,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
});
