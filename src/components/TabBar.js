import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, space, touch, layout, type } from '../design/tokens';
import { text } from '../design/typography';

// ============================================================================
//  פס ניווט תחתון צף.
//  ארבעה פריטים, אייקון + תווית (אייקון לבדו חוצה את הזיהוי).
//  המצב הפעיל מסומן בשני אותות ולא רק בצבע: גלולת רקע + אייקון מלא
//  + תווית במשקל כבד יותר.
//  יושב בשליש התחתון — קרוב לאגודל, לפי חוק פיטס.
// ============================================================================

const ICONS = {
  'הכנה לשלב': ['home', 'home-outline'],
  'כושר': ['barbell', 'barbell-outline'],
  'הלוח שלי': ['calendar', 'calendar-outline'],
  'פסיכוטכני': ['bulb', 'bulb-outline'],
};

export default function TabBar({ state: navState, descriptors, navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, space[3]) }]}>
      <View style={styles.bar}>
        {navState.routes.map((route, index) => {
          const focused = navState.index === index;
          const [on, off] = ICONS[route.name] || ['ellipse', 'ellipse-outline'];

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="tab"
              accessibilityLabel={route.name}
              accessibilityState={{ selected: focused }}
              style={styles.item}
            >
              <View style={[styles.pill, focused && styles.pillActive]}>
                <Ionicons
                  name={focused ? on : off}
                  size={20}
                  color={focused ? colors.onAccent : colors.text2}
                />
              </View>
              <Text
                style={[text.label, focused ? styles.labelActive : styles.labelIdle]}
                numberOfLines={1}
              >
                {route.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    start: 0,
    end: 0,
    bottom: 0,
    paddingHorizontal: layout.gutter,
    backgroundColor: 'transparent',
  },
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.bgSunken,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: space[2],
    paddingHorizontal: space[2],
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: touch.min,
    gap: 2,
  },
  pill: {
    width: 44,
    height: 28,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActive: { backgroundColor: colors.accent },
  labelActive: { color: colors.accent, fontFamily: type.family.bold },
  labelIdle: { color: colors.text3 },
});
