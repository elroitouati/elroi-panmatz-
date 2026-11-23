import React, { useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, RadialGradient, Stop, Rect } from 'react-native-svg';

// ============================================================================
//  הרקע הזורם — אותה טכניקה בשני העולמות:
//  מעבר צבע אלכסוני + הילה בהירה בפינה העליונה + צל עמוק בפינה התחתונה.
//  exam: כחול עמוק ו"ערפל". olive: זית וזהב של פנמ"צ. task: כרטיס משימות המבחן.
//  רק בכרטיס הראשי של כל מסך — לא בכל מקום (אחרת הוא מפסיק להיות מיוחד).
// ============================================================================

const PAL = {
  exam: { stops: ['#3B5578', '#263B55', '#1C2C44'], glow: '#A0B8D8', glowO: 0.55, shade: '#111827', shadeO: 0.55 },
  olive: { stops: ['#55673A', '#3c4a28', '#2c3720'], glow: '#f0c239', glowO: 0.3, shade: '#141a0c', shadeO: 0.55 },
  oliveDeep: { stops: ['#4a5a32', '#35421f', '#262f18'], glow: '#f0c239', glowO: 0.22, shade: '#10150a', shadeO: 0.6 },
};

let counter = 0;

// הכרטיס מודד את עצמו (onLayout) והציור מקבל מידות מדויקות בפיקסלים.
// מידות באחוזים ב-SVG באנדרואיד מחושבות לפעמים מגודל ישן — ואז הצבע לא
// מכסה את כל הכרטיס ונראה פס כהה בצד ובתחתית.
export default function Flow({ variant = 'exam', radius = 24, style, children, pointerEvents }) {
  const id = useRef(`f${++counter}`).current;
  const p = PAL[variant] || PAL.exam;
  const [size, setSize] = useState(null);
  const onLayout = (e) => {
    const { width, height } = e.nativeEvent.layout;
    const w = Math.ceil(width), h = Math.ceil(height);
    if (!size || size.w !== w || size.h !== h) setSize({ w, h });
  };
  return (
    <View onLayout={onLayout} style={[{ borderRadius: radius, overflow: 'hidden', backgroundColor: p.stops[1] }, style]} pointerEvents={pointerEvents}>
      {size ? (
      <Svg style={{ position: 'absolute', top: 0, left: 0, width: size.w, height: size.h }} width={size.w} height={size.h} viewBox={`0 0 ${size.w} ${size.h}`} pointerEvents="none">
        <Defs>
          <LinearGradient id={`${id}l`} x1="0.2" y1="0" x2="0.8" y2="1">
            <Stop offset="0" stopColor={p.stops[0]} />
            <Stop offset="0.55" stopColor={p.stops[1]} />
            <Stop offset="1" stopColor={p.stops[2]} />
          </LinearGradient>
          <RadialGradient id={`${id}g`} cx="0.88" cy="0.06" rx="0.75" ry="0.7" fx="0.88" fy="0.06">
            <Stop offset="0" stopColor={p.glow} stopOpacity={p.glowO} />
            <Stop offset="1" stopColor={p.glow} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id={`${id}s`} cx="0" cy="1" rx="0.7" ry="0.65" fx="0" fy="1">
            <Stop offset="0" stopColor={p.shade} stopOpacity={p.shadeO} />
            <Stop offset="1" stopColor={p.shade} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width={size.w} height={size.h} fill={`url(#${id}l)`} />
        <Rect x="0" y="0" width={size.w} height={size.h} fill={`url(#${id}g)`} />
        <Rect x="0" y="0" width={size.w} height={size.h} fill={`url(#${id}s)`} />
      </Svg>
      ) : null}
      {children}
    </View>
  );
}
