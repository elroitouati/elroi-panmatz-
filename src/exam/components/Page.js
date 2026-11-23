import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Platform } from 'react-native';
import { getExamSyncStatus, onExamSyncStatus } from '../examSync';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Press from '../../components/Press';
import { useX, font } from '../ui';
import { haptic } from '../../design/haptics';

// ============================================================================
//  עמוד של טאב בעולם המבחן: שורת כותרת עם כפתור "פנמ״צ" (חזרה לעולם הזית),
//  כותרת גדולה, ותוכן נגלל. הנקודה הירוקה-זית בכפתור = "לשם חוזרים".
// ============================================================================

// בדפדפן: מצב החשבון והסנכרון (לחיצה → הגדרות)
function AccountPill() {
  const { c } = useX();
  const nav = useNavigation();
  const [st, setSt] = useState(getExamSyncStatus());
  useEffect(() => onExamSyncStatus(setSt), []);
  const okSync = st.user && !st.error;
  return (
    <Press onPress={() => nav.navigate('ExamSettings')} accessibilityLabel="חשבון וסנכרון" scaleTo={0.96}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 8, height: 40, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: c.mist, backgroundColor: c.surface }}>
      <Ionicons name={okSync ? 'cloud-done-outline' : 'cloud-offline-outline'} size={18} color={okSync ? c.ok : c.steel} />
      <Text style={{ fontFamily: font.b, fontSize: 15, color: c.ink }}>{st.user ? (okSync ? 'מסונכרן עם הטלפון' : 'הסנכרון לא פעיל') : 'מקומי בלבד'}</Text>
    </Press>
  );
}

export function BackToPanmatz() {
  const { c } = useX();
  const nav = useNavigation();
  if (Platform.OS === 'web') return <AccountPill />;
  return (
    <Press
      onPress={() => { haptic.light(); nav.navigate('Tabs'); }}
      accessibilityLabel="חזרה לפנמ״צ"
      scaleTo={0.96}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 8, height: 40, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: c.mist, backgroundColor: c.surface }}
    >
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#3c4a28' }} />
      <Text style={{ fontFamily: font.b, fontSize: 15, color: c.ink }}>פנמ״צ</Text>
      <Ionicons name="arrow-back" size={16} color={c.ink} />
    </Press>
  );
}

export default function Page({ title, over, children, action }) {
  const { c, t } = useX();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: c.paper }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 120, paddingHorizontal: 18 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 }}>
          {action || null}
          <View style={{ flex: 1 }} />
          <BackToPanmatz />
        </View>
        {over ? <Text style={[t.over, { marginTop: 10 }]}>{over}</Text> : null}
        <Text style={[t.title, { marginTop: over ? 2 : 10, marginBottom: 18 }]} accessibilityRole="header">{title}</Text>
        {children}
      </ScrollView>
    </View>
  );
}

// עמוד ממוקד (שאלה, כרטיסיות, שיעור): בלי טאבים, עם X ליציאה
export function FocusBar({ onClose, title, right, closeIcon = 'close' }) {
  const { c, t } = useX();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: insets.top + 6, paddingHorizontal: 16, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Press onPress={onClose} accessibilityLabel="יציאה" scaleTo={0.94} hitSlop={6}
        style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: c.mist, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={closeIcon} size={22} color={c.ink} />
      </Press>
      {title ? <Text style={[t.strong, { flex: 1 }]} numberOfLines={1}>{title}</Text> : <View style={{ flex: 1 }} />}
      {right}
    </View>
  );
}
