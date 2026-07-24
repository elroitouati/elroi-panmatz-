import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../theme';

export default function Card({ children, style, highlight }) {
  return (
    <View style={[styles.card, highlight && styles.highlight, style]}>{children}</View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
  },
  highlight: {
    backgroundColor: colors.cardHi,
    borderColor: colors.goldDim,
  },
});
