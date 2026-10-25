import React from 'react';
import Animated, { withDelay, withTiming, useReducedMotion, LinearTransition } from 'react-native-reanimated';
import { ease, keep } from '../design/tokens';

// ============================================================================
//  כניסה מדורגת בפעם הראשונה שמסך נפתח (emil: stagger 30–80ms, רק בטעינה).
//  פותחים מסך כמה פעמים ביום — לכן עדין: 10px ושקיפות, 260ms ease-out,
//  45ms בין בלוק לבלוק, ולא יותר מ-6 צעדים (המשתמש לא מחכה לתוכן).
//  רק בעלייה הראשונה של הרכיב; מעבר טאבים לא מפעיל את זה שוב.
//  הפחתת תנועה: העמעמה בלבד, בלי תזוזה.
// ============================================================================

const DURATION = 260;
const STEP = 45;

// הפחתת תנועה: רק העמעמה פנימה, בלי תזוזה
function fadeIn(index) {
  const delay = Math.min(index, 6) * STEP;
  return () => {
    'worklet';
    return {
      initialValues: { opacity: 0 },
      animations: { opacity: withDelay(delay, withTiming(1, { duration: 200, ...keep })) },
    };
  };
}

function riseIn(index) {
  const delay = Math.min(index, 6) * STEP;
  return () => {
    'worklet';
    return {
      initialValues: { opacity: 0, transform: [{ translateY: 10 }] },
      animations: {
        opacity: withDelay(delay, withTiming(1, { duration: DURATION, easing: ease.out })),
        transform: [{ translateY: withDelay(delay, withTiming(0, { duration: DURATION, easing: ease.out })) }],
      },
    };
  };
}

// כשבלוק מעליו נעלם (למשל "הצל את הרצף"), הבלוק עולה למקומו בתנועה
// על המסך: 250ms ease-in-out. layout transition — transform בלבד, לא height.
const shift = LinearTransition.duration(250).easing(ease.inOut);

export default function Reveal({ index = 0, style, children, follow }) {
  const reduced = useReducedMotion();
  return (
    <Animated.View
      style={style}
      entering={reduced ? fadeIn(index) : riseIn(index)}
      layout={follow && !reduced ? shift : undefined}
    >
      {children}
    </Animated.View>
  );
}
