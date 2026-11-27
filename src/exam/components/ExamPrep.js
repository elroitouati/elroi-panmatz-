import React from 'react';
import { View, Text, ScrollView, useWindowDimensions } from 'react-native';
import Press from '../../components/Press';
import ExamSheet from './ExamSheet';
import { useX, CheckDot, font } from '../ui';
import { useExam } from '../ExamContext';
import { ltr } from '../../design/rtl';

// ============================================================================
//  הכנה ליום המבחן — לפי ההנחיות של תיל לבחינה מהבית ב־Zoom.
//  הסימונים נשמרים בהגדרות (settings.prep), ולכן מסונכרנים בין הטלפון למחשב.
// ============================================================================

export const PREP = [
  { id: 'zoom', t: 'להתקין Zoom במחשב יום לפני, ולבדוק שהוא עובד' },
  { id: 'pc', t: 'מחשב (נייח או נייד) עם Chrome או Edge — לא טלפון ולא אייפד' },
  { id: 'cam', t: 'לבדוק מצלמה, אוזניות ומיקרופון' },
  { id: 'net', t: 'חיבור יציב לאינטרנט' },
  { id: 'id', t: 'תעודה מזהה עם תמונה' },
  { id: 'paper', t: 'שני דפי טיוטה ריקים ועט — לא יותר' },
  { id: 'room', t: 'חדר סגור בלי אנשים, טלפון כבוי ומחוץ לחדר' },
  { id: 'tabs', t: 'לסגור את כל הלשוניות והתוכנות, ומסך אחד בלבד' },
  { id: 'early', t: 'להתחבר 15 דקות לפני — באיחור לא נכנסים' },
  { id: 'help', t: `בעיה בהתחברות: SMS או וואטסאפ ל־${ltr('050-7011775')}` },
];

export function prepCount(settings) {
  const p = settings?.prep || {};
  return PREP.filter((x) => p[x.id]).length;
}

export default function PrepSheet({ visible, onClose }) {
  const { c, t } = useX();
  const { height } = useWindowDimensions();
  const { state, updateSettings } = useExam();
  const prep = state?.settings?.prep || {};
  const toggle = (id) => updateSettings({ prep: { ...prep, [id]: !prep[id] } });
  return (
    <ExamSheet visible={visible} onClose={onClose} title="הכנה ליום המבחן" secondary="סגירה"
      body="המבחן מהבית, ב־Zoom, עם בוחן שצופה כל הזמן. לסמן כל דבר כשהוא מוכן.">
      {/* הרשימה נגללת, כדי שכפתור הסגירה תמיד ייראה גם במסך קטן */}
      <ScrollView style={{ maxHeight: height * 0.5, marginBottom: 16 }} showsVerticalScrollIndicator={false}>
        {PREP.map((x, i) => (
          <Press key={x.id} onPress={() => toggle(x.id)} scaleTo={1} accessibilityLabel={x.t} accessibilityState={{ checked: !!prep[x.id] }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderTopWidth: i ? 1 : 0, borderColor: c.mist }}>
            <CheckDot done={!!prep[x.id]} />
            <Text style={[t.body, { flex: 1, fontFamily: font.m, opacity: prep[x.id] ? 0.6 : 1 }]}>{x.t}</Text>
          </Press>
        ))}
      </ScrollView>
    </ExamSheet>
  );
}
