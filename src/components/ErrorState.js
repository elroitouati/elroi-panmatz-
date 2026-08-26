import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from './Button';
import { colors, space, radius } from '../design/tokens';
import { text } from '../design/typography';

// מצב שגיאה: מה קרה ומה לעשות עכשיו. בלי קוד שגיאה, בלי התנצלות,
// ועם ניסיון חוזר שבאמת מנסה שוב.
export default function ErrorState({ title, body, onRetry, retryLabel = 'נסה שוב' }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.icon}>
        <Ionicons name="alert-circle-outline" size={26} color={colors.danger} />
      </View>
      <Text style={[text.bodyStrong, styles.center]}>{title}</Text>
      {body ? <Text style={[text.bodyDim, styles.center, styles.body]}>{body}</Text> : null}
      {onRetry ? (
        <Button label={retryLabel} onPress={onRetry} variant="secondary" fullWidth={false} style={styles.action} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: space[8], paddingHorizontal: space[5], gap: space[2] },
  icon: {
    width: 56, height: 56, borderRadius: radius.pill,
    backgroundColor: colors.dangerSurface,
    alignItems: 'center', justifyContent: 'center', marginBottom: space[2],
  },
  center: { textAlign: 'center' },
  body: { maxWidth: 280 },
  action: { marginTop: space[3], paddingHorizontal: space[5] },
});
