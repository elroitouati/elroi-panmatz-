import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, font } from '../theme';
import LeafMark from './LeafMark';

// מעטפת מסך אחידה: רקע כהה, כותרת עם רמז לוגו, וגלילה.
export default function Screen({ title, subtitle, children, scroll = true, headerRight }) {
  const insets = useSafeAreaInsets();
  const Container = scroll ? ScrollView : View;
  const containerProps = scroll
    ? {
        contentContainerStyle: { padding: spacing.lg, paddingBottom: 120 },
        showsVerticalScrollIndicator: false,
      }
    : { style: { flex: 1, padding: spacing.lg } };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {headerRight ? headerRight : <LeafMark size={24} />}
      </View>
      <Container {...containerProps}>{children}</Container>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerText: { flex: 1 },
  title: { color: colors.cream, fontSize: font.h1, fontWeight: '900', textAlign: 'right', letterSpacing: -0.5 },
  subtitle: { color: colors.creamDim, fontSize: font.small, textAlign: 'right', marginTop: 2 },
});
