import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Switch, Platform, ActivityIndicator } from 'react-native';
import { supabase, supabaseConfigured } from '../../sync/supabase';
import { getExamSyncStatus, onExamSyncStatus, syncExamNow } from '../examSync';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Press from '../../components/Press';
import { FocusBar } from '../components/Page';
import ExamSheet from '../components/ExamSheet';
import { useX, SectionTitle, font } from '../ui';
import { useExam } from '../ExamContext';
import { addDays, weekdayOf } from '../engine/time';
import { fmtDay } from '../engine/brain';
import { HEB_WEEKDAYS_FULL, HEB_WEEKDAYS_SHORT } from '../../utils/date';
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
  const [dateOpen, setDateOpen] = useState(null); // 'examDate' | 'startDate'
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

        <SyncBlock />

        <SectionTitle>המבחן</SectionTitle>
        <View style={{ backgroundColor: c.surface, borderRadius: 20, overflow: 'hidden' }}>
          <Row first title="המבחן — הכי מוקדם" value={`${fmtDay(st.examDate)} · ${HEB_WEEKDAYS_FULL[weekdayOf(st.examDate)]}`} onPress={() => { setDraftDate(st.examDate); setDateOpen('examDate'); }} />
          <Row title="המבחן — הכי מאוחר" value={`${fmtDay(st.examDateLast || st.examDate)} · ${HEB_WEEKDAYS_FULL[weekdayOf(st.examDateLast || st.examDate)]}`} onPress={() => { setDraftDate(st.examDateLast || st.examDate); setDateOpen('examDateLast'); }} />
          <Row title="התחלת התוכנית היומית" value={st.startDate ? fmtDay(st.startDate) : '—'} onPress={() => { setDraftDate(st.startDate || st.examDate); setDateOpen('startDate'); }} />
          <View style={{ paddingVertical: 14, paddingHorizontal: 18, borderTopWidth: 1, borderColor: c.mist }}>
            <Text style={[t.body, { fontFamily: font.m }]}>סימולציות מלאות</Text>
            <Text style={t.sub}>{st.simDates.map(fmtDay).join(' · ')}</Text>
          </View>
        </View>

        <SectionTitle>יום חופש קבוע</SectionTitle>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {[0, 1, 2, 3, 4, 5, 6].map((d) => {
            const on = (st.weeklyOff || []).includes(d);
            return (
              <Press key={d} wrapStyle={{ flex: 1 }} scaleTo={0.94} accessibilityLabel={`יום ${HEB_WEEKDAYS_FULL[d]}${on ? ', יום חופש' : ''}`} accessibilityState={{ selected: on }}
                onPress={() => {
                  haptic.selection();
                  const set = new Set(st.weeklyOff || []);
                  if (on) set.delete(d); else set.add(d);
                  updateSettings({ weeklyOff: [...set].sort() });
                }}
                style={{ height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? c.deep : c.surface, borderWidth: 1, borderColor: on ? c.deep : c.mist }}>
                <Text style={{ fontFamily: font.b, fontSize: 17, color: on ? c.onDeep : c.ink }}>{HEB_WEEKDAYS_SHORT[d]}</Text>
              </Press>
            );
          })}
        </View>
        <Text style={[t.sub, { marginTop: 8, marginHorizontal: 4 }]}>ביום הזה אין משימות ואין תזכורות לפסיכוטכני, והוא לא נחשב פספוס. אפשר בכל זאת להתאמן בו ממסך היום.</Text>

        <SectionTitle>זמן לימוד יומי</SectionTitle>
        <Seg value={st.dailyMinutes} options={[[20, '20'], [30, '30'], [40, '40'], [45, '45']]} onChange={(v) => updateSettings({ dailyMinutes: v })} />
        <Text style={[t.sub, { marginTop: 8, marginHorizontal: 4 }]}>בדקות. אם תהיה מאחורי הקצב, המערכת תוסיף עד 15 דקות ותגיד לך למה.</Text>

        {Platform.OS !== 'web' ? <SectionTitle>תזכורות</SectionTitle> : null}
        {Platform.OS !== 'web' ? <>
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
        </> : null}

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

      <ExamSheet visible={!!dateOpen} onClose={() => setDateOpen(null)}
        title={dateOpen === 'startDate' ? 'התחלת התוכנית היומית' : dateOpen === 'examDateLast' ? 'המבחן — הכי מאוחר' : 'המבחן — הכי מוקדם'}
        body={dateOpen === 'startDate' ? 'מהיום הזה המערכת בונה לך משימות יומיות (מתחילים באבחון). לפני — אפשר לתרגל חופשי.'
          : dateOpen === 'examDateLast' ? 'היום האחרון שבו המבחן יכול להתקיים. כשיגיע תאריך מדויק — קבע את שני התאריכים לאותו יום.'
          : 'היום הראשון שבו המבחן יכול להתקיים. התוכנית מכוונת להיות מוכנים עד אליו — כך לא תופתע אם המבחן יוקדם.'}
        primary="שמירה" onPrimary={() => {
          // שומרים על חלון תקין: המוקדם לא אחרי המאוחר
          if (dateOpen === 'examDate') updateSettings({ examDate: draftDate, ...((st.examDateLast || draftDate) < draftDate ? { examDateLast: draftDate } : null) });
          else if (dateOpen === 'examDateLast') updateSettings({ examDateLast: draftDate < st.examDate ? st.examDate : draftDate });
          else updateSettings({ [dateOpen]: draftDate });
          setDateOpen(null);
        }}>
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

// ---------------------------------------------------------------------------
//  חשבון וסנכרון טלפון ↔ מחשב
// ---------------------------------------------------------------------------
function SyncBlock() {
  const { c, t } = useX();
  const [st, setSt] = useState(getExamSyncStatus());
  useEffect(() => onExamSyncStatus(setSt), []);
  if (!supabaseConfigured) return null;
  const web = Platform.OS === 'web';
  const when = st.lastSync ? new Date(st.lastSync) : null;
  const hm = when ? `${pad(when.getHours())}:${pad(when.getMinutes())}` : null;
  let line;
  if (!st.user) line = web ? 'לא מחובר' : 'כדי לסנכרן עם המחשב — התחבר בהגדרות של פנמ״צ (סנכרון עם My Day).';
  else if (st.missingTable) line = 'חסרה טבלת exam_state ב-Supabase. צריך להריץ פעם אחת את הקובץ supabase/exam_state.sql.';
  else if (st.error) line = 'אין חיבור כרגע — השינויים נשמרים ויישלחו כשיחזור החיבור.';
  else line = hm ? `סונכרן לאחרונה ב־${hm}` : 'מתחבר…';
  return (
    <>
      <SectionTitle>חשבון וסנכרון</SectionTitle>
      <View style={{ backgroundColor: c.surface, borderRadius: 20, overflow: 'hidden' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 }}>
          <Ionicons name={st.user && !st.error ? 'cloud-done-outline' : 'cloud-offline-outline'} size={24} color={st.user && !st.error ? c.ok : c.steel} />
          <View style={{ flex: 1 }}>
            <Text style={[t.body, { fontFamily: font.b }]}>{st.user ? st.user.email : 'טלפון ↔ מחשב'}</Text>
            <Text style={t.sub}>{line}</Text>
          </View>
          {st.syncing ? <ActivityIndicator color={c.deep} /> : null}
        </View>
        {st.user ? <Row title="סנכרון עכשיו" onPress={() => syncExamNow()} /> : null}
        {st.user && web ? <Row title="התנתקות" onPress={() => supabase.auth.signOut()} /> : null}
      </View>
    </>
  );
}
