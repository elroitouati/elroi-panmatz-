import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Flow from './Flow';
import Press from './Press';
import { dir, ltr } from '../design/rtl';
import { useToday } from '../exam/ExamContext';
import { useGate } from '../exam/Gate';

// ============================================================================
//  משימות המבחן בתוך "היום" של פנמ"צ — בצבעי עולם המבחן (כחול זורם),
//  כדי שיהיה ברור שזה עולם אחר. הכפתור פותח את גיליון הכניסה.
// ============================================================================

const INK = '#F5F6F8';
const DIM = 'rgba(245,246,248,0.75)';
const F = { m: 'Heebo_500Medium', b: 'Heebo_700Bold', h: 'Heebo_900Black' };

export default function ExamTasksCard({ style }) {
  const day = useToday();
  const gate = useGate();
  if (!day) return null;
  const { plan, done, off, finished, total } = day;
  const next = plan.tasks.find((t) => !done[t.id]);
  const allDone = total > 0 && !next;
  const title = plan.notStarted ? 'מתחילים מחר' : off ? 'היום חופש מהמבחן' : allDone ? 'סיימת את המשימות' : plan.sim ? 'יום סימולציה' : plan.weekly ? 'בדיקה שבועית' : 'משימות המבחן';

  return (
    <Flow variant="exam" radius={20} style={[{ padding: 18 }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Ionicons name="reader" size={18} color={DIM} />
        <Text style={{ fontFamily: F.m, fontSize: 15, color: DIM, flex: 1, textAlign: dir.start }}>פסיכוטכני · היום</Text>
        {!off && total ? (
          <View style={{ backgroundColor: 'rgba(245,246,248,0.16)', borderRadius: 999, paddingHorizontal: 11, paddingVertical: 5 }}>
            <Text style={{ fontFamily: F.b, fontSize: 15, color: INK, fontVariant: ['tabular-nums'] }}>{ltr(`${finished} / ${total}`)}</Text>
          </View>
        ) : null}
      </View>
      <Text style={{ fontFamily: F.h, fontSize: 24, lineHeight: 30, color: INK, marginTop: 4, marginBottom: 8, textAlign: dir.start }}>{title}</Text>
      {!off ? plan.tasks.map((t, i) => {
        const isDone = !!done[t.id];
        return (
          <View key={t.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderTopWidth: i ? 1 : 0, borderColor: 'rgba(245,246,248,0.14)' }}>
            <View style={{ width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: isDone ? INK : 'rgba(245,246,248,0.55)', backgroundColor: isDone ? INK : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
              {isDone ? <Ionicons name="checkmark" size={16} color="#263B55" /> : null}
            </View>
            <Text style={{ flex: 1, fontFamily: F.m, fontSize: 17, color: INK, opacity: isDone ? 0.6 : 1, textDecorationLine: isDone ? 'line-through' : 'none', textAlign: dir.start }} numberOfLines={1}>{t.title}</Text>
            <Text style={{ fontFamily: F.m, fontSize: 14, color: DIM }}>{t.minutes} דק׳</Text>
          </View>
        );
      }) : null}
      <Press onPress={gate.open} accessibilityLabel="מעבר למשימות המבחן"
        style={{ marginTop: 12, height: 52, borderRadius: 14, backgroundColor: INK, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <Text style={{ fontFamily: F.b, fontSize: 18, color: '#263B55' }}>{off || allDone || plan.notStarted ? 'לעולם המבחן' : finished ? 'להמשיך במשימות' : 'לעבור למשימות'}</Text>
        <Ionicons name="arrow-back" size={18} color="#263B55" />
      </Press>
    </Flow>
  );
}
