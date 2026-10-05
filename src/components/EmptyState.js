import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from './Button';
import { colors, radius, space } from '../design/tokens';
import { text } from '../design/typography';

// מצב ריק: אומר מה קורה ומה הצעד הבא — לא רק "אין נתונים".
export default function EmptyState({ icon, title, body, actionLabel, onAction }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.icon}>
        <Ionicons name={icon} size={26} color={colors.gold} />
      </View>
      <Text style={[text.headlineStrong, styles.center]}>{title}</Text>
      {body ? <Text style={[text.sub, styles.center]}>{body}</Text> : null}
      {actionLabel ? (
        <Button label={actionLabel} variant="secondary" onPress={onAction} wrapStyle={styles.cta} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: space[2], paddingVertical: space[6], paddingHorizontal: space[4] },
  icon: {
    width: 56, height: 56, borderRadius: radius.pill, backgroundColor: colors.goldSoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: space[2],
  },
  center: { textAlign: 'center' },
  cta: { alignSelf: 'stretch', marginTop: space[3] },
});
