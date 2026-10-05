import React from 'react';
import { Switch } from 'react-native';
import { colors } from '../design/tokens';
import { haptic } from '../design/haptics';

// מתג מערכת בצבעי המותג. רטט קל אחד כשהמצב מתחלף.
export default function Toggle({ value, onValueChange, label }) {
  return (
    <Switch
      value={value}
      onValueChange={(v) => { haptic.light(); onValueChange(v); }}
      trackColor={{ true: colors.gold, false: colors.track }}
      thumbColor={colors.ink}
      ios_backgroundColor={colors.track}
      accessibilityLabel={label}
    />
  );
}
