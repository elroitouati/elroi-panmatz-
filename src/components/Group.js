import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, layout, space } from '../design/tokens';
import { text } from '../design/typography';

// ============================================================================
//  רשימה מקובצת בסגנון הגדרות האייפון.
//  שורה לחוצה מקבלת רקע ברגע הנגיעה — שורות ב-iOS מוארות, לא מתכווצות.
//  קו ההפרדה מוזח מתחת לתוכן ולא נמתח מקצה לקצה.
// ============================================================================

export function Section({ title, footer, children, style }) {
  const rows = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={style}>
      {title ? <Text style={[text.caption, styles.header]}>{title}</Text> : null}
      <View style={styles.group}>
        {rows.map((child, i) => React.cloneElement(child, { separator: i > 0 }))}
      </View>
      {footer ? <Text style={[text.caption, styles.footer]}>{footer}</Text> : null}
    </View>
  );
}

export function Row({
  title, subtitle, value, valueStyle, leading, trailing, chevron,
  onPress, separator, separatorInset, accessibilityLabel, entering, children,
}) {
  const inset = separatorInset ?? (leading ? 58 : layout.gutter);
  const body = (pressed) => (
    <View style={[styles.row, pressed && styles.rowPressed]}>
      {separator ? <View style={[styles.sep, { start: inset }]} /> : null}
      {leading ? (typeof leading === 'function' ? leading(pressed) : leading) : null}
      <View style={styles.main}>
        {title ? <Text style={text.headline} numberOfLines={2}>{title}</Text> : null}
        {subtitle ? <Text style={[text.sub, styles.subtitle]} numberOfLines={2}>{subtitle}</Text> : null}
        {children}
      </View>
      {value != null ? <Text style={[text.value, valueStyle]} numberOfLines={1}>{value}</Text> : null}
      {trailing}
      {/* גילוי בעברית מצביע שמאלה — לכיוון ההתקדמות */}
      {chevron ? <Ionicons name="chevron-back" size={18} color={colors.ink3} /> : null}
    </View>
  );

  return (
    <Animated.View entering={entering}>
      {onPress ? (
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel ?? title}
          pressRetentionOffset={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {({ pressed }) => body(pressed)}
        </Pressable>
      ) : body(false)}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: layout.gutter, paddingTop: space[6], paddingBottom: 7 },
  footer: { paddingHorizontal: layout.gutter, paddingTop: space[2], lineHeight: 19 },
  group: { backgroundColor: colors.group, borderRadius: radius.group, overflow: 'hidden' },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: space[3],
    minHeight: layout.rowMin, paddingVertical: 10, paddingHorizontal: layout.gutter,
  },
  rowPressed: { backgroundColor: colors.groupPressed },
  sep: { position: 'absolute', top: 0, end: 0, height: 1, backgroundColor: colors.separator },
  main: { flex: 1, minWidth: 0 },
  subtitle: { marginTop: 1 },
});
