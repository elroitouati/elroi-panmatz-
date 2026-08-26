import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, layout, space } from '../design/tokens';
import { text } from '../design/typography';

// מעטפת מסך אחידה. הכותרת נשארת בראש, התוכן נגלל מתחתיה.
// הריפוד התחתון מפנה מקום לפס הניווט הצף.
export default function Screen({ title, subtitle, children, action }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={text.title} numberOfLines={1}>{title}</Text>
          {subtitle ? (
            <Text style={[text.labelStrong, styles.subtitle]} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {action}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[3],
    paddingHorizontal: layout.gutter,
    paddingTop: space[3],
    paddingBottom: space[4],
  },
  headerText: { flex: 1 },
  subtitle: { marginTop: 2 },
  content: {
    paddingHorizontal: layout.gutter,
    paddingBottom: 128,     // פינוי לפס הניווט הצף
    gap: layout.cardGap,
  },
});
