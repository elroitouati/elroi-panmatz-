import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, space, layout } from '../design/tokens';

// שלד בצורת מסך הבית בזמן שהנתונים נטענים מהמכשיר (חלקיק שנייה).
// בלי הבהוב: טעינה כל כך קצרה לא צריכה תנועה שמושכת את העין.
export default function AppSkeleton() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { paddingTop: insets.top + space[4] }]}>
      <View style={[styles.block, { width: 140, height: 14 }]} />
      <View style={[styles.block, { width: 110, height: 34, marginTop: space[2] }]} />
      <View style={[styles.card, { height: 190, marginTop: space[5] }]} />
      <View style={[styles.card, { height: 110, marginTop: space[6] }]} />
      <View style={[styles.card, { height: 220, marginTop: space[6] }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: layout.gutter },
  block: { backgroundColor: colors.group, borderRadius: 8, alignSelf: 'flex-start' },
  card: { backgroundColor: colors.group, borderRadius: radius.card },
});
