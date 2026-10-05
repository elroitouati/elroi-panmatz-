import React from 'react';
import { Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { duration, ease, press } from '../design/tokens';

// ============================================================================
//  Press — כל דבר לחיץ באפליקציה.
//  משוב ברגע הנגיעה (press-in), לא כשמרימים את האצבע — זו ההשהיה שהמשתמש
//  באמת מרגיש. כיווץ ל-0.97 ב-120ms, על ה-UI thread.
//  pressRetentionOffset: אצבע שזזה כמה פיקסלים לא מבטלת לחיצה שהתכוונו אליה.
// ============================================================================

const RETENTION = { top: 20, bottom: 20, left: 20, right: 20 };

export default function Press({
  children,
  onPress,
  onLongPress,
  style,            // סגנון חזותי — על השכבה שמתכווצת
  wrapStyle,        // סגנון פריסה (flex וכו') — על העטיפה
  pressedStyle,     // שינוי חזותי בזמן לחיצה (למשל רקע שורה)
  scaleTo = press.scale,
  disabled,
  hitSlop,
  accessibilityLabel,
  accessibilityRole = 'button',
  accessibilityState,
  accessibilityHint,
}) {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const to = (v) => { scale.value = withTiming(v, { duration: duration.press, easing: ease.out }); };

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={() => scaleTo !== 1 && to(scaleTo)}
      onPressOut={() => scaleTo !== 1 && to(1)}
      disabled={disabled}
      hitSlop={hitSlop}
      pressRetentionOffset={RETENTION}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled, ...accessibilityState }}
      style={wrapStyle}
    >
      {({ pressed }) => (
        <Animated.View style={[style, pressed && pressedStyle, animated]}>
          {typeof children === 'function' ? children({ pressed }) : children}
        </Animated.View>
      )}
    </Pressable>
  );
}
