import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Flow from '../../components/Flow';
import Press from '../../components/Press';
import Reveal from '../../components/Reveal';
import Page from '../components/Page';
import { useX, Btn, Tile, CheckDot, SectionTitle, ON_FLOW, font } from '../ui';
import { useExam, useToday } from '../ExamContext';
import { startTask, TASK_ICON } from '../actions';
import { dayDiff, weekdayOf } from '../engine/time';
import { wordStats } from '../engine/srs';
import { WORDS } from '../data/words';
import { fmtDay, startOf } from '../engine/brain';
import { HEB_WEEKDAYS_FULL } from '../../utils/date';
import { dir } from '../../design/rtl';

// ============================================================================
//  היום — שאלה אחת: מה עושים עכשיו. כרטיס זורם עם האימון, רשימת המשימות,
//  ואריחים קטנים. בלי ניתוחים ומספרי מוכנות (הם במסך ההתקדמות).
// ============================================================================

export default function ExamToday({ navigation }) {
  const { c, t } = useX();
  const { state, today, setOffToday, setExcused } = useExam();
  const day = useToday();
  if (!state || !day) return null;
  const { plan, done, off, excused } = day;
  const next = plan.tasks.find((x) => !done[x.id]);
  const allDone = plan.tasks.length > 0 && !next;
  // המונים בכרטיס — רק מה שעוד נשאר היום
  const left = plan.tasks.filter((x) => !done[x.id]);
  const totalMin = left.reduce((s, x) => s + (x.minutes || 0), 0);
  const qCount = left.filter((x) => x.kind === 'quiz' || x.kind === 'sim').reduce((s, x) => s + (x.count || 0), 0);
  const wCount = left.find((x) => x.kind === 'cards')?.count || 0;
  const dayMin = plan.tasks.reduce((s, x) => s + (x.minutes || 0), 0);
  const daysLeft = dayDiff(today, state.settings.examDate);
  const ws = wordStats(WORDS, state.cards, today);
  const wd = weekdayOf(today);
  const toFriday = (5 - wd + 7) % 7;

  const notStarted = !!plan.notStarted;
  const startIn = notStarted ? dayDiff(today, startOf(state)) : 0;
  const heroTitle = notStarted ? (startIn === 1 ? 'מתחילים מחר' : `מתחילים ב־${fmtDay(startOf(state))}`) : off ? 'היום חופש' : allDone ? 'סיימת את היום' : plan.sim ? 'יום סימולציה' : plan.weekly ? 'בדיקה שבועית' : !state.diagnosticDone ? 'נתחיל באבחון' : 'האימון של היום';
  const heroNote = excused && !off && !notStarted && !allDone ? 'יום מוצדק — לא נחשב פספוס. מה שלא תספיק היום יתפזר על הימים הבאים.' : null;
  const heroText = notStarted ? 'התוכנית היומית מתחילה אז, באבחון פתיחה קצר. עד אז אפשר להציץ בשיעורים ולתרגל חופשי — זה לא חובה.' : off ? 'מנוחה היא חלק מהתוכנית. מחר ממשיכים.'
    : allDone ? 'כל המשימות הושלמו. המערכת כבר עדכנה את התוכנית למחר.'
    : plan.sim ? '180 שאלות בשמונה פרקים מתוזמנים — בדיוק כמו ביום המבחן.'
    : plan.weekly ? '30 דקות בזמן אמת, מכל הנושאים. התוצאה קובעת את השבוע הבא.'
    : !state.diagnosticDone ? '3 שאלות מכל נושא, כדי שהמערכת תדע מאיפה להתחיל.'
    : next ? `עכשיו: ${next.title}` : '';

  return (
    <Page title="היום" over={`יום ${HEB_WEEKDAYS_FULL[wd]} · עוד ${daysLeft} ימים למבחן`}
      action={<Press onPress={() => navigation.navigate('ExamSettings')} accessibilityLabel="הגדרות" scaleTo={0.94} style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="settings-outline" size={24} color={c.ink} /></Press>}>
      {state.activeSim ? (
        <Reveal index={0}>
          <View style={{ marginBottom: 12 }}>
            <Tile icon="play-circle-outline" title="סימולציה באמצע" sub={`פרק ${state.activeSim.section + 1} מתוך 8 · אפשר להמשיך מאיפה שעצרת`} onPress={() => navigation.navigate('Sim', { resume: true })} />
          </View>
        </Reveal>
      ) : null}

      <Reveal index={1}>
        <Flow variant="exam" style={{ padding: 22 }}>
          <Text style={{ fontFamily: font.m, fontSize: 15, color: ON_FLOW.dim, textAlign: dir.start }}>{notStarted ? `התוכנית · ${fmtDay(startOf(state))}` : off ? 'מנוחה' : allDone ? `${dayMin} דקות היום` : left.length < plan.tasks.length ? `נשארו ${totalMin} דקות` : `${totalMin} דקות`}</Text>
          <Text style={{ fontFamily: font.h, fontSize: 30, lineHeight: 36, color: ON_FLOW.ink, marginTop: 4, textAlign: dir.start }}>{heroTitle}</Text>
          <Text style={{ fontFamily: font.r, fontSize: 17, lineHeight: 25, color: ON_FLOW.dim, marginTop: 6, textAlign: dir.start }}>{heroText}</Text>
          {!off && !allDone && !notStarted ? (
            <View style={{ flexDirection: 'row', gap: 22, marginTop: 16 }}>
              <Meta big={totalMin} label="דקות" />
              {qCount ? <Meta big={qCount} label="שאלות" /> : null}
              {wCount ? <Meta big={wCount} label="מילים" /> : null}
            </View>
          ) : null}
          {heroNote ? <Text style={{ fontFamily: font.m, fontSize: 16, lineHeight: 23, color: ON_FLOW.ink, marginTop: 10, textAlign: dir.start }}>{heroNote}</Text> : null}
          {heroNote ? <Btn variant="flowLine" label="ביטול ההצדקה" onPress={() => setExcused(today, false)} style={{ marginTop: 14 }} /> : null}
          {!off && next ? <Btn variant="flow" label={plan.sim && state.activeSim ? 'להמשיך את הסימולציה' : left.length < plan.tasks.length ? 'להמשיך' : 'התחל'} icon="play" onPress={() => startTask(navigation, next, state)} style={{ marginTop: 20 }} /> : null}
          {off ? <Btn variant="flowLine" label="בכל זאת להתאמן היום" onPress={() => setOffToday(false)} style={{ marginTop: 20 }} /> : null}
          {notStarted ? <Btn variant="flowLine" label="להציץ בתרגול" icon="grid-outline" onPress={() => navigation.navigate('תרגול')} style={{ marginTop: 20 }} /> : null}
        </Flow>
      </Reveal>

      {!off && !notStarted && plan.tasks.length ? (
        <Reveal index={2}>
          <SectionTitle>המשימות של היום</SectionTitle>
          <View style={{ backgroundColor: c.surface, borderRadius: 22, overflow: 'hidden' }}>
            {plan.tasks.map((task, i) => {
              const isDone = !!done[task.id];
              return (
                <Press key={task.id} onPress={() => startTask(navigation, task, state)} scaleTo={1} pressedStyle={{ backgroundColor: c.pressed }}
                  accessibilityLabel={`${task.title}, ${isDone ? 'הושלם' : 'לא הושלם'}`}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 15, paddingHorizontal: 18, borderTopWidth: i ? 1 : 0, borderColor: c.mist }}>
                  <CheckDot done={isDone} />
                  <View style={{ flex: 1, minWidth: 0, opacity: isDone ? 0.55 : 1 }}>
                    <Text style={t.strong} numberOfLines={1}>{task.title}</Text>
                    <Text style={t.sub} numberOfLines={1}>{task.sub}</Text>
                  </View>
                  <Text style={[t.sub, { fontFamily: font.b }]}>{task.minutes} דק׳</Text>
                  <Ionicons name={TASK_ICON[task.kind]} size={20} color={c.steel} />
                </Press>
              );
            })}
          </View>
        </Reveal>
      ) : null}

      <Reveal index={3}>
        <View style={{ gap: 10, marginTop: 12 }}>
          <Tile icon="albums-outline" title="מילים לחזרה" sub={`${ws.mastered} נשלטות מתוך ${ws.total}`} big={ws.due} onPress={() => navigation.navigate('מילים')} />
          <Tile icon="clipboard-outline" title="בדיקה שבועית" sub={toFriday === 0 ? (plan.sim ? 'השבוע הסימולציה המלאה מחליפה אותה' : 'היום') : toFriday === 1 ? 'מחר, ביום שישי' : `ביום שישי, בעוד ${toFriday} ימים`} big={toFriday === 0 ? null : toFriday} />

        </View>
      </Reveal>
    </Page>
  );
}

function Meta({ big, label }) {
  return (
    <View>
      <Text style={{ fontFamily: font.h, fontSize: 24, lineHeight: 28, color: '#fff', fontVariant: ['tabular-nums'], textAlign: dir.start }}>{big}</Text>
      <Text style={{ fontFamily: font.r, fontSize: 15, color: ON_FLOW.dim, textAlign: dir.start }}>{label}</Text>
    </View>
  );
}

export { fmtDay };
