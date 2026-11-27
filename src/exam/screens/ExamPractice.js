import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Flow from '../../components/Flow';
import Press from '../../components/Press';
import Reveal from '../../components/Reveal';
import Page from '../components/Page';
import { useX, Btn, Tile, MiniRing, SectionTitle, ON_FLOW, font } from '../ui';
import { useExam } from '../ExamContext';
import { TOPICS } from '../topics';
import { statsFor, strengthOf, nextSimDate, fmtDay, buildErrors, openErrors } from '../engine/brain';
import { dir } from '../../design/rtl';
import PrepSheet, { PREP, prepCount } from '../components/ExamPrep';

// ============================================================================
//  תרגול — כל מה שאפשר לבחור ידנית: סימולציה, בדיקה, נושא, טעויות.
//  רשת הנושאים מציגה טבעת שליטה קטנה — חזותית, בלי מספרים (המספרים בהתקדמות).
// ============================================================================

export default function ExamPractice({ navigation }) {
  const { c, t } = useX();
  const { state, today } = useExam();
  const [prepOpen, setPrepOpen] = useState(false);
  if (!state) return null;
  const sim = nextSimDate(state, today);
  const errs = openErrors(state).length;

  return (
    <Page title="תרגול">
      <Reveal index={0}>
        <Flow variant="exam" style={{ padding: 22 }}>
          <Text style={{ fontFamily: font.m, fontSize: 15, color: ON_FLOW.dim, textAlign: dir.start }}>{sim ? `הבאה בתוכנית: ${fmtDay(sim)}` : '3 שעות · 8 פרקים'}</Text>
          <Text style={{ fontFamily: font.h, fontSize: 28, lineHeight: 34, color: ON_FLOW.ink, marginTop: 4, textAlign: dir.start }}>סימולציה מלאה</Text>
          <Text style={{ fontFamily: font.r, fontSize: 17, lineHeight: 25, color: ON_FLOW.dim, marginTop: 6, textAlign: dir.start }}>180 שאלות, זמן נפרד לכל פרק, בלי מחשבון ובלי משוב עד הסוף. כמו ביום המבחן.</Text>
          <Btn variant="flow" label={state.activeSim ? 'להמשיך את הסימולציה' : 'התחל סימולציה'} icon="stopwatch-outline"
            onPress={() => navigation.navigate('Sim', { resume: !!state.activeSim })} style={{ marginTop: 20 }} />
        </Flow>
      </Reveal>

      <Reveal index={1}>
        <View style={{ gap: 10, marginTop: 12 }}>
          <Tile icon="clipboard-outline" title="בדיקה שבועית" sub="32 שאלות · 30 דקות בזמן אמת" onPress={() => navigation.navigate('Quiz', { mode: 'weekly' })} />
          <Tile icon="bookmark-outline" title="מחברת הטעויות" sub={errs ? 'כל שאלה חוזרת עד שעונים נכון פעמיים' : 'ריקה כרגע'} big={errs || null} onPress={() => navigation.navigate('Errors')} />
          <Tile icon="videocam-outline" title="הכנה ליום המבחן" sub={`Zoom, מחשב, 2 דפי טיוטה · ${prepCount(state.settings)} מתוך ${PREP.length} מוכנים`} onPress={() => setPrepOpen(true)} />
        </View>
        <PrepSheet visible={prepOpen} onClose={() => setPrepOpen(false)} />
      </Reveal>

      <Reveal index={2}>
        <SectionTitle>לפי נושא</SectionTitle>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {TOPICS.map((tp) => {
            const s = { ...statsFor(state.attempts, tp.id), ...strengthOf(state.attempts, tp.id) };
            return (
              <Press key={tp.id} wrapStyle={{ width: '48.5%' }} onPress={() => navigation.navigate('TopicHub', { topic: tp.id })} accessibilityLabel={tp.name}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: c.surface, borderRadius: 20, padding: 14, minHeight: 76 }}>
                <View style={{ width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }}>
                  <View style={{ position: 'absolute' }}><MiniRing value={s.n ? s.strength : 0} /></View>
                  <Ionicons name={tp.icon} size={18} color={c.deep} />
                </View>
                <Text style={[t.strong, { flex: 1, fontSize: 16, lineHeight: 21 }]} numberOfLines={2}>{tp.name}</Text>
              </Press>
            );
          })}
        </View>
      </Reveal>
    </Page>
  );
}
