import React from 'react';
import { View, Platform } from 'react-native';

// ============================================================================
//  בדפדפן בלבד: מנגנון ההחלקה בין טאבים (react-native-tab-view) מניח כיוון
//  LTR. בתוך dir="rtl" הדפים מסודרים הפוך והוא מזיז אותם לכיוון הלא נכון —
//  וכל טאב חוץ מהראשון נשאר ריק. לכן את המנגנון עוטפים ב-LTR, ואת התוכן של
//  כל מסך (ואת סרגל הטאבים) מחזירים ל-RTL. במכשיר — לא משנה כלום.
// ============================================================================

const WEB = Platform.OS === 'web';

export function PagerLtr({ children }) {
  if (!WEB) return children;
  return <View dir="ltr" style={{ flex: 1 }}>{children}</View>;
}

export function Rtl({ children, style }) {
  if (!WEB) return children;
  return <View dir="rtl" style={style}>{children}</View>;
}

const cache = new Map();
export function rtlScreen(Component) {
  if (!WEB) return Component;
  if (!cache.has(Component)) {
    const Wrapped = (props) => <View dir="rtl" style={{ flex: 1 }}><Component {...props} /></View>;
    Wrapped.displayName = `Rtl(${Component.displayName || Component.name})`;
    cache.set(Component, Wrapped);
  }
  return cache.get(Component);
}
