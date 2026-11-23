// ============================================================================
//  עולם המבחן — Deep Intelligence. בהיר כברירת מחדל, כהה לבחירה.
//  כל הצבעים נבדקו לניגודיות: steel רק לאייקונים וטקסט גדול (3.6:1),
//  slate לטקסט משני (6:1).
// ============================================================================
import { useColorScheme } from 'react-native';

export const LIGHT = {
  dark: false,
  paper: '#F5F6F8', surface: '#FFFFFF', ink: '#111827', deep: '#263B55', steel: '#6C83A3', slate: '#4B5F7C', mist: '#D6DCE5',
  ok: '#2E7A57', okSoft: 'rgba(46,122,87,0.12)', bad: '#B4443C', badSoft: 'rgba(180,68,60,0.11)', deepSoft: 'rgba(38,59,85,0.08)',
  onDeep: '#F5F6F8', glass: 'rgba(245,246,248,0.86)', scrim: 'rgba(17,24,39,0.5)', pressed: '#EEF1F5', shadow: '#263B55',
};

export const DARK = {
  dark: true,
  paper: '#111827', surface: '#1A2638', ink: '#F5F6F8', deep: '#D6DCE5', steel: '#8DA2BF', slate: '#B5C1D2', mist: '#2E4058',
  ok: '#5DBB8D', okSoft: 'rgba(93,187,141,0.14)', bad: '#E58A82', badSoft: 'rgba(229,138,130,0.13)', deepSoft: 'rgba(214,220,229,0.08)',
  onDeep: '#111827', glass: 'rgba(17,24,39,0.86)', scrim: 'rgba(0,0,0,0.55)', pressed: '#22314A', shadow: '#000000',
};

// על הרקע הזורם — תמיד טקסט בהיר, בשני המצבים
export const ON_FLOW = { ink: '#F5F6F8', dim: 'rgba(245,246,248,0.78)', faint: 'rgba(245,246,248,0.16)', btnBg: '#F5F6F8', btnFg: '#263B55' };

export function useExamColors(pref) {
  const sys = useColorScheme();
  const dark = pref === 'dark' || (pref === 'system' && sys === 'dark');
  return dark ? DARK : LIGHT;
}

// טיפוגרפיה גדולה — פחות טקסט קטן (בקשה מפורשת). המינימום 15.
const F = { r: 'Heebo_400Regular', m: 'Heebo_500Medium', b: 'Heebo_700Bold', h: 'Heebo_900Black' };
export const font = F;
export function textStyles(c, start) {
  const t = (size, lh, family, color = c.ink) => ({ fontSize: size, lineHeight: lh, fontFamily: family, color, textAlign: start, letterSpacing: 0, includeFontPadding: false });
  return {
    over: t(15, 20, F.m, c.slate),
    title: t(32, 38, F.h),
    h2: t(16, 21, F.b, c.slate),
    h3: t(26, 32, F.h),
    lead: t(19, 28, F.r),
    body: t(17, 25, F.r),
    bodyDim: t(17, 25, F.r, c.slate),
    strong: t(18, 24, F.b),
    sub: t(15, 21, F.r, c.slate),
    num: { ...t(24, 28, F.h, c.deep), fontVariant: ['tabular-nums'] },
  };
}
