import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

// רמז עדין לזהות פנמ"צ — ענף עלה קטן. לא שכפול של הלוגו הרשמי.
export default function LeafMark({ size = 22, color = colors.goldDim, style }) {
  return (
    <View style={[{ opacity: 0.9 }, style]}>
      <Ionicons name="leaf-outline" size={size} color={color} />
    </View>
  );
}
