import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from './Button';
import { colors, space, radius } from '../design/tokens';
import { text } from '../design/typography';

// מצב ריק: משפט הסבר אחד ופעולה אחת. מסך ריק הוא הזמנה, לא מבוי סתום.
// מרכוז מותר כאן — זהו בלוק קצר ועצמאי, בדיוק המקרה שבו מרכוז נכון בעברית.
export default function EmptyState({ icon = 'ellipse-outline', title, body, actionLabel, onAction }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.icon}>
        <Ionicons name={icon} size={26} color={colors.text3} />
      </View>
      <Text style={[text.bodyStrong, styles.center]}>{title}</Text>
      {body ? <Text style={[text.bodyDim, styles.center, styles.body]}>{body}</Text> : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} variant="secondary" fullWidth={false} style={styles.action} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: space[8],
    paddingHorizontal: space[5],
    gap: space[2],
  },
  icon: {
    width: 56, height: 56, borderRadius: radius.pill,
    backgroundColor: colors.surface1,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: space[2],
  },
  center: { textAlign: 'center' },
  body: { maxWidth: 280 },
  action: { marginTop: space[3], paddingHorizontal: space[5] },
});
