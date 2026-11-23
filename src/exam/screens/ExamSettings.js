import React, { useState } from 'react';
import { View, Text, ScrollView, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Press from '../../components/Press';
import { FocusBar } from '../components/Page';
import ExamSheet from '../components/ExamSheet';
import { useX, SectionTitle, font } from '../ui';
import { useExam } from '../ExamContext';
import { addDays, weekdayOf } from '../engine/time';
import { fmtDay } from '../engine/brain';
import { HEB_WEEKDAYS_FULL } from '../../utils/date';
import { haptic } from '../../design/haptics';

// ============================================================================
//  הגדרות עולם המבחן: מראה, תאריך המבחן, זמן יומי, ותזכורות לפי יום.
// ============================================================================

const pad = (n) => String(n).padStart(2, '0');
const fmtT = (x) => (x ? `${pad(x.hour)}:${pad(x.minute)}` : 'בלי');

function Seg({ value, options, onChange }) {
  const { c } = useX();
  return (
    <View style={{ flexDirection: 'row', backgroundColor: c.deepSoft, borderRadius: 14, padding: 4, gap: 4 }}>
      {options.map(([v, label]) => {
        const on = v === value;
        return (
          <Press key={String(v)} wrapStyle={{ flex: 1 }} scaleTo={0.97} onPress={() => { haptic.selection(); onChange(v); }} accessibilityLabel={label} accessibilityState={{ selected: on }}
            style={{ height: 42, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? c.surface : 'transparent' }}>
            <Text style={{ fontFamily: on ? font.b : font.m, fontSize: 16, color: on ? c.deep : c.slate }}>{label}</Text>
          </Press>
        );
      })}
    </View>
  );
}

function Row({ title, value, onPress, children, first }) {
  const { c, t } = useX();
  return (
    <Press scaleTo={1} onPress={onPress} disabled={!onPress} pressedStyle={{ backgroundColor: c.pressed }} accessibilityLabel={title}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 58, paddingHorizontal: 18, borderTopWidth: first ? 0 : 1, borderColor: c.mist }}>
      <Text style={[t.body, { flex: 1, fontFamily: font.m }]}>{title}</Text>
      {value != null ? <Text style={[t.body, { color: c.slate, fontVariant: ['tabular-nums'] }]}>{value}</Text> : null}
      {children}
      {onPress ? <Ionicons name="chevron-back" size={18} color={c.steel} /> : null}
    </Press>
  );
}

function Stepper({ label, onMinus, onPlus }) {
  const { c, t } = useX();
  const b = { width: 54, height: 54, borderRadius: 16, backgroundColor: c.deepSoft, alignItems: 'center', justifyContent: 'center' };
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, justifyContent: 'center' }}>
      <Press onPress={onPlus} accessibilityLabel="יותר" style={b}><Ionicons name="add" size={26} color={c.deep} /></Press>
      <Text style={[t.title, { minWidth: 90, textAlign: 'center', fontVariant: ['tabular-nums'] }]}>{label}</Text>
      <Press onPress={onMinus} accessibilityLabel="פחות" style={b}><Ionicons name="remove" size={26} color={c.deep} /></Press>
    </View>
  );
}

export default function ExamSettings({ navigation }) {
  const { c, t } = useX();
  const insets = useSafeAreaInsets();
  const { state, updateSettings, resetExam } = useExam();
  const st = state.settings;
  const [timeEdit, setTimeEdit] = useState(null); // { key: 0..6 | 'evening', val }
  const [dateOpen, setDateOpen] = useState(false);
  const [draftDate, setDraftDate] = useState(st.examDate);
  const [resetOpen, setResetOpen] = useState(false);

  const saveTime = (val) => {
    if (timeEdit.key === 'evening') updateSettings({ evening: val });
    else updateSettings({ studyByDay: { ...st.studyByDay, [timeEdit.key]: val } });
    setTimeEdit(null);
  };
  const shift = (mins) => {
    const v = timeEdit.val || { hour: 17, minute: 0 };
    let total = (v.hour * 60 + v.minute + mins + 1440) % 1440;
    setTimeEdit({ ...timeEdit, val: { hour: Math.floor(total / 60), minute: total % 60 } });
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.paper }}>
      <FocusBar onClose={() => navigation.goBack()} title="הגדרות המבחן" closeIcon="arrow-forward" />
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
        <SectionTitle style={{ marginTop: 6 }}>מראה</SectionTitle>
        <Seg value={st.theme} options={[['light', 'בהיר'], ['dark', 'כהה'], ['system', 'כמו המכשיר']]} onChange={(v) => updateSettings({ theme: v })} />

        <SectionTitle>המבחן</SectionTitle>
        <View style={{ backgroundColor: c.surface, borderRadius: 20, overflow: 'hidden' }}>
          <Row first title="תאריך המבחן" value={`${fmtDay(st.examDate)} · ${HEB_WEEKDAYS_FULL[weekdayOf(st.examDate)]}`} onPress={() => { setDraftDate(st.examDate); setDateOpen(true); }} />
          <Row title="סימולציות מלאות" value={st.simDates.map(fmtDay).join(' · ')} />
        </View>

        <SectionTitle>זמן לימוד יומי</SectionTitle>
        <Seg value={st.dailyMinutes} options={[[20, '20'], [30, '30'], [40, '40'], [45, '45']]} onChange={(v) => updateSettings({ dailyMinutes: v })} />
        <Text style={[t.sub, { marginTop: 8, marginHorizontal: 4 }]}>בדקות. אם תהיה מאחורי הקצב, המערכת תוסיף עד 15 דקות ותגיד לך למה.</Text>

        <SectionTitle>תזכורות</SectionTitle>
        <View style={{ backgroundColor: c.surface, borderRadius: 20, overflow: 'hidden' }}>
          <Row first title="התראות">
            <Switch value={!!st.notify} onValueChange={(v) => updateSettings({ notify: v })} trackColor={{ true: c.deep, false: c.mist }} thumbColor="#fff" />
          </Row>
          <Row title="תזכורת ערב (אם נשארו משימות)" value={fmtT(st.evening)} onPress={() => setTimeEdit({ key: 'evening', val: st.evening })} />
        </View>

        <SectionTitle>שעת לימוד לפי יום</SectionTitle>
        <View style={{ backgroundColor: c.surface, borderRadius: 20, overflow: 'hidden', opacity: st.notify ? 1 : 0.5 }}>
          {[0, 1, 2, 3, 4, 5, 6].map((d, i) => (
            <Row key={d} first={i === 0} title={`יום ${HEB_WEEKDAYS_FULL[d]}${d === 5 ? ' · בדיקה שבועית' : ''}`} value={fmtT(st.studyByDay[d])}
              onPress={() => setTimeEdit({ key: d, val: st.studyByDay[d] })} />
          ))}
        </View>

        <SectionTitle>נתונים</SectionTitle>
        <View style={{ backgroundColor: c.surface, borderRadius: 20, overflow: 'hidden' }}>
          <Row first title="איפוס כל נתוני המבחן" onPress={() => setResetOpen(true)} />
        </View>
        <Text style={[t.sub, { marginTop: 8, marginHorizontal: 4 }]}>הנתונים נשמרים על המכשיר. נתוני פנמ"צ (אימונים, לוח) לא מושפעים.</Text>
      </ScrollView>

      <ExamSheet visible={!!timeEdit} onClose={() => setTimeEdit(null)}
        title={timeEdit?.key === 'evening' ? 'תזכורת ערב' : timeEdit ? `יום ${HEB_WEEKDAYS_FULL[timeEdit.key]}` : ''}
        primary="שמירה" onPrimary={() => saveTime(timeEdit.val || { hour: 17, minute: 0 })}
        secondary={timeEdit?.val ? 'בלי תזכורת ביום הזה' : 'ביטול'} onSecondary={() => (timeEdit?.val ? saveTime(null) : setTimeEdit(null))}>
        {timeEdit ? (
          <View style={{ gap: 14, marginBottom: 22 }}>
            <Stepper label={fmtT(timeEdit.val || { hour: 17, minute: 0 })} onPlus={() => shift(60)} onMinus={() => shift(-60)} />
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10 }}>
              {[-15, 15].map((m) => (
                <Press key={m} onPress={() => shift(m)} accessibilityLabel={`${m} דקות`} style={{ paddingHorizontal: 18, height: 44, borderRadius: 999, borderWidth: 1, borderColor: c.mist, justifyContent: 'center' }}>
                  <Text style={{ fontFamily: font.b, fontSize: 16, color: c.deep }}>{m > 0 ? '+15 דק׳' : '−15 דק׳'}</Text>
                </Press>
              ))}
            </View>
          </View>
        ) : null}
      </ExamSheet>

      <ExamSheet visible={dateOpen} onClose={() => setDateOpen(false)} title="תאריך המבחן" body="עוד לא נקבע? השאר את סוף ינואר. אפשר לשנות בכל רגע — הקצב יחושב מחדש."
        primary="שמירה" onPrimary={() => { updateSettings({ examDate: draftDate }); setDateOpen(false); }}>
        <View style={{ gap: 12, marginBottom: 22 }}>
          <Stepper label={fmtDay(draftDate)} onPlus={() => setDraftDate(addDays(draftDate, 1))} onMinus={() => setDraftDate(addDays(draftDate, -1))} />
          <Text style={[t.bodyDim, { textAlign: 'center' }]}>יום {HEB_WEEKDAYS_FULL[weekdayOf(draftDate)]}</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10 }}>
            {[-7, 7].map((d) => (
              <Press key={d} onPress={() => setDraftDate(addDays(draftDate, d))} accessibilityLabel={`${d} ימים`} style={{ paddingHorizontal: 18, height: 44, borderRadius: 999, borderWidth: 1, borderColor: c.mist, justifyContent: 'center' }}>
                <Text style={{ fontFamily: font.b, fontSize: 16, color: c.deep }}>{d > 0 ? 'שבוע קדימה' : 'שבוע אחורה'}</Text>
              </Press>
            ))}
          </View>
        </View>
      </ExamSheet>

      <ExamSheet visible={resetOpen} onClose={() => setResetOpen(false)} title="לאפס את נתוני המבחן?" body="כל התשובות, המילים, הטעויות וההיסטוריה יימחקו. אי אפשר לבטל."
        primary="איפוס" destructive onPrimary={() => { resetExam(); setResetOpen(false); navigation.goBack(); }} />
    </View>
  );
}
