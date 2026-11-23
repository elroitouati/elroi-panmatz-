import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useAnimatedStyle, withTiming, useSharedValue } from 'react-native-reanimated';
import Press from '../components/Press';
import { dir } from '../design/rtl';
import { ease, keep } from '../design/tokens';
import { useExam } from './ExamContext';
import { useExamColors, textStyles, ON_FLOW, font } from './theme';

// ============================================================================
//  אבני הבניין של עולם המבחן. פינות מעוגלות (20–24), טקסט גדול, משטחים לבנים
//  על רקע "נייר". הכפתור הראשי — כחול עמוק; על רקע זורם — לבן.
// ============================================================================

export function useX() {
  const ex = useExam();
  const c = useExamColors(ex?.state?.settings?.theme || 'light');
  return useMemo(() => ({ c, t: textStyles(c, dir.start), s: makeShared(c) }), [c]);
}

function makeShared(c) {
  return StyleSheet.create({
    page: { flex: 1, backgroundColor: c.paper },
    card: { backgroundColor: c.surface, borderRadius: 22, padding: 18 },
    row: { flexDirection: 'row', alignItems: 'center' },
    hair: { height: StyleSheet.hairlineWidth, backgroundColor: c.mist },
  });
}

export function Btn({ label, onPress, variant = 'primary', icon, disabled, sub, style, wrapStyle }) {
  const { c } = useX();
  const v = {
    primary: { bg: c.deep, fg: c.onDeep, border: c.deep },
    line: { bg: c.surface, fg: c.ink, border: c.mist },
    flow: { bg: ON_FLOW.btnBg, fg: ON_FLOW.btnFg, border: ON_FLOW.btnBg },
    flowLine: { bg: 'transparent', fg: ON_FLOW.ink, border: 'rgba(245,246,248,0.35)' },
    ok: { bg: c.okSoft, fg: c.ok, border: 'transparent' },
    bad: { bg: c.badSoft, fg: c.bad, border: 'transparent' },
  }[variant];
  return (
    <Press onPress={onPress} disabled={disabled} accessibilityLabel={label} wrapStyle={wrapStyle}
      style={[{ minHeight: 56, borderRadius: 16, backgroundColor: v.bg, borderWidth: 1, borderColor: v.border, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 8, opacity: disabled ? 0.35 : 1 }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {icon ? <Ionicons name={icon} size={20} color={v.fg} /> : null}
        <Text style={{ fontFamily: font.b, fontSize: 18, lineHeight: 24, color: v.fg, textAlign: 'center' }} numberOfLines={1}>{label}</Text>
      </View>
      {sub ? <Text style={{ fontFamily: font.m, fontSize: 15, lineHeight: 20, color: v.fg, opacity: 0.75, textAlign: 'center' }} numberOfLines={1}>{sub}</Text> : null}
    </Press>
  );
}

export function Pill({ label, icon, onPress, active, style }) {
  const { c } = useX();
  return (
    <Press onPress={onPress} accessibilityLabel={label} scaleTo={0.96}
      style={[{ flexDirection: 'row', alignItems: 'center', gap: 6, height: 42, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1,
        borderColor: active ? c.deep : c.mist, backgroundColor: active ? c.deep : c.surface }, style]}>
      {icon ? <Ionicons name={icon} size={18} color={active ? c.onDeep : c.deep} /> : null}
      {label ? <Text style={{ fontFamily: font.b, fontSize: 15, color: active ? c.onDeep : c.deep }}>{label}</Text> : null}
    </Press>
  );
}

export function IconCircle({ icon, onPress, label, size = 44 }) {
  const { c } = useX();
  return (
    <Press onPress={onPress} accessibilityLabel={label} scaleTo={0.94} hitSlop={6}
      style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 1, borderColor: c.mist, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={icon} size={22} color={c.ink} />
    </Press>
  );
}

export function Tile({ icon, title, sub, big, onPress, children }) {
  const { c, t } = useX();
  return (
    <Press onPress={onPress} accessibilityLabel={title} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: c.surface, borderRadius: 22, paddingVertical: 16, paddingHorizontal: 18 }}>
      {icon ? (
        <View style={{ width: 48, height: 48, borderRadius: 15, backgroundColor: c.deepSoft, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={icon} size={23} color={c.deep} />
        </View>
      ) : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={t.strong} numberOfLines={1}>{title}</Text>
        {sub ? <Text style={t.sub} numberOfLines={2}>{sub}</Text> : null}
        {children}
      </View>
      {big != null ? <Text style={t.num}>{big}</Text> : null}
      {onPress ? <Ionicons name="chevron-back" size={20} color={c.steel} /> : null}
    </Press>
  );
}

export function Bar({ value, color, track, height = 8 }) {
  const { c } = useX();
  const w = useSharedValue(0);
  React.useEffect(() => { w.value = withTiming(Math.max(0, Math.min(1, value)), { duration: 300, easing: ease.inOut, ...keep }); }, [value]);
  const st = useAnimatedStyle(() => ({ width: `${w.value * 100}%` }));
  return (
    <View style={{ height, borderRadius: 99, backgroundColor: track || c.mist, overflow: 'hidden' }}>
      <Animated.View style={[{ position: 'absolute', top: 0, bottom: 0, start: 0, borderRadius: 99, backgroundColor: color || c.deep }, st]} />
    </View>
  );
}

export function MiniRing({ value, size = 42, stroke = 4 }) {
  const { c } = useX();
  const r = (size - stroke) / 2, C = 2 * Math.PI * r;
  return (
    <Svg width={size} height={size}>
      <Circle cx={size / 2} cy={size / 2} r={r} stroke={c.mist} strokeWidth={stroke} fill="none" />
      <Circle cx={size / 2} cy={size / 2} r={r} stroke={value >= 0.8 ? c.deep : c.steel} strokeWidth={stroke} fill="none" strokeLinecap="round"
        strokeDasharray={`${C} ${C}`} strokeDashoffset={C * (1 - Math.max(0, Math.min(1, value)))} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
    </Svg>
  );
}

export function SectionTitle({ children, style }) {
  const { t } = useX();
  return <Text style={[t.h2, { marginTop: 26, marginBottom: 10, marginHorizontal: 4 }, style]}>{children}</Text>;
}

export function CheckDot({ done, onFlow }) {
  const { c } = useX();
  const border = onFlow ? 'rgba(245,246,248,0.55)' : c.mist;
  const fill = onFlow ? ON_FLOW.ink : c.ok;
  return (
    <View style={{ width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: done ? fill : border, backgroundColor: done ? fill : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
      {done ? <Ionicons name="checkmark" size={17} color={onFlow ? '#263B55' : '#fff'} /> : null}
    </View>
  );
}

export { ON_FLOW, font };
