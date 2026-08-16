import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, radius, spacing, shadow } from '../theme';

export default function Card({ children, style, highlight }) {
  return (
    <View style={[styles.card, highlight && styles.highlight, style]}>{children}</View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadow.soft,
  },
  highlight: {
    backgroundColor: colors.cardHi,
    borderColor: colors.goldDim,
    ...shadow.card,
  },
});
