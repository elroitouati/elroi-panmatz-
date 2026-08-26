import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

// האם המשתמש ביקש להפחית תנועה במערכת ההפעלה.
// כל אנימציה באפליקציה חייבת לכבד את זה — לא רק החגיגה.
export default function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (alive) setReduced(!!v);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      alive = false;
      sub?.remove?.();
    };
  }, []);

  return reduced;
}
