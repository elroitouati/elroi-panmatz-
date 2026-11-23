import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Flow from '../../components/Flow';
import Press from '../../components/Press';
import Reveal from '../../components/Reveal';
import Page from '../components/Page';
import { useX, Bar, Tile, SectionTitle, ON_FLOW, font } from '../ui';
import { useExam } from '../ExamContext';
import { pace, PACE_LABEL, topicTable, decisions, openErrors, fmtDay, TARGET } from '../engine/brain';
import { dir } from '../../design/rtl';

// ============================================================================
//  התקדמות — כאן (ורק כאן) המוח מראה את עצמו: מוכנות, קצב מול היעד,
//  שליטה לפי נושא, ומה המערכת החליטה ולמה.
// ============================================================================

const MODE_NAME = { weekly: 'בדיקה שבועית', sim: 'סימולציה', diagnostic: 'אבחון' };

export default function ExamProgress({ navigation }) {
  const { c, t } = useX();
  const { state, today } = useExam();
  if (!state) return null;
  const p = pace(state, today);
  const table = topicTable(state.attempts);
  const dec = decisions(state, today);
  const errs = openErrors(state).length;
  const tests = state.sessions.filter((s) => MODE_NAME[s.mode] && s.complete).slice(-8).reverse();
  const pct = Math.round(p.now * 100);
  const chipColor = p.status === 'behind' ? { bg: 'rgba(229,138,130,0.25)', fg: '#FFD5D0' } : { bg: 'rgba(93,187,141,0.22)', fg: '#BDF0D5' };

  return (
    <Page title="התקדמות" over={`עוד ${p.daysLeft} ימים · מבחן ב־${fmtDay(state.settings.examDate)}`}>
      <Reveal index={0}>
        <Flow variant="exam" style={{ padding: 22 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <Text style={{ fontFamily: font.h, fontSize: 56, lineHeight: 60, color: ON_FLOW.ink, fontVariant: ['tabular-nums'] }}>
              {pct}<Text style={{ fontSize: 26, color: ON_FLOW.dim }}>%</Text>
            </Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: font.b, fontSize: 18, color: ON_FLOW.ink, textAlign: dir.start }}>מוכנות למבחן</Text>
              {state.attempts.length ? (
                <View style={{ alignSelf: 'flex-start', marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: chipColor.bg, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 }}>
                  <Ionicons name={p.status === 'behind' ? 'alert-circle' : 'checkmark-circle'} size={16} color={chipColor.fg} />
                  <Text style={{ fontFamily: font.b, fontSize: 15, color: chipColor.fg }}>{PACE_LABEL[p.status]}</Text>
                </View>
              ) : <Text style={{ fontFamily: font.r, fontSize: 15, color: ON_FLOW.dim, textAlign: dir.start }}>אחרי האבחון יופיע כאן מדד אמיתי</Text>}
            </View>
          </View>
          {/* מסלול: המילוי = איפה אתה; הסימון = איפה הקצב מצפה שתהיה היום */}
          <View style={{ height: 8, borderRadius: 99, backgroundColor: 'rgba(245,246,248,0.22)', marginTop: 18, marginBottom: 8 }}>
            <View style={{ position: 'absolute', top: 0, bottom: 0, start: 0, width: `${Math.min(100, (p.now / TARGET) * 100)}%`, borderRadius: 99, backgroundColor: ON_FLOW.ink }} />
            <View style={{ position: 'absolute', top: -5, bottom: -5, start: `${Math.min(100, (p.expected / TARGET) * 100)}%`, width: 3, borderRadius: 2, backgroundColor: '#A0B8D8' }} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontFamily: font.m, fontSize: 15, color: ON_FLOW.dim }}>הקצב מצפה היום ל־{Math.round(p.expected * 100)}%</Text>
            <Text style={{ fontFamily: font.m, fontSize: 15, color: ON_FLOW.dim }}>יעד: {Math.round(TARGET * 100)}%</Text>
          </View>
        </Flow>
      </Reveal>

      <Reveal index={1}>
        <SectionTitle>מה המערכת החליטה</SectionTitle>
        <View style={{ backgroundColor: c.surface, borderRadius: 22, paddingVertical: 6 }}>
          {dec.map((d, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 14, paddingVertical: 12, paddingHorizontal: 18, borderTopWidth: i ? 1 : 0, borderColor: c.mist }}>
              <Ionicons name={d.icon} size={22} color={c.deep} style={{ marginTop: 2 }} />
              <Text style={[t.body, { flex: 1 }]}>{d.text}</Text>
            </View>
          ))}
        </View>
      </Reveal>

      <Reveal index={2}>
        <SectionTitle>שליטה לפי נושא</SectionTitle>
        <View style={{ backgroundColor: c.surface, borderRadius: 22, paddingVertical: 6 }}>
          {table.map((tp, i) => (
            <Press key={tp.id} scaleTo={1} pressedStyle={{ backgroundColor: c.pressed }} onPress={() => navigation.navigate('TopicHub', { topic: tp.id })} accessibilityLabel={tp.name}
              style={{ paddingVertical: 13, paddingHorizontal: 18, borderTopWidth: i ? 1 : 0, borderColor: c.mist }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Text style={[t.strong, { flex: 1, fontSize: 17 }]}>{tp.name}</Text>
                <Text style={[t.sub, { fontFamily: font.b, color: tp.stats.n ? c.deep : c.steel }]}>
                  {tp.stats.n ? `${Math.round(tp.stats.mastery * 100)}%` : 'עוד לא תורגל'}
                </Text>
                {tp.stats.mastered ? <Ionicons name="ribbon" size={18} color={c.ok} style={{ marginStart: 6 }} /> : null}
              </View>
              <Bar value={tp.stats.n ? tp.stats.mastery : 0} color={tp.stats.mastery >= 0.85 ? c.ok : c.deep} />
            </Press>
          ))}
        </View>
      </Reveal>

      <Reveal index={3}>
        <View style={{ marginTop: 12 }}>
          <Tile icon="bookmark-outline" title="מחברת הטעויות" sub="כל טעות עם הסבר וסיבה" big={errs || null} onPress={() => navigation.navigate('Errors')} />
        </View>
        {tests.length ? (
          <>
            <SectionTitle>בדיקות וסימולציות</SectionTitle>
            <View style={{ backgroundColor: c.surface, borderRadius: 22, paddingVertical: 6 }}>
              {tests.map((s, i) => (
                <Press key={s.id} scaleTo={1} pressedStyle={{ backgroundColor: c.pressed }} onPress={() => navigation.navigate('Results', { sessionId: s.id })} accessibilityLabel={MODE_NAME[s.mode]}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 18, borderTopWidth: i ? 1 : 0, borderColor: c.mist }}>
                  <View style={{ flex: 1 }}>
                    <Text style={t.strong}>{MODE_NAME[s.mode]}</Text>
                    <Text style={t.sub}>{fmtDay(s.d)}</Text>
                  </View>
                  <Text style={t.num}>{Math.round((s.correct / Math.max(1, s.n)) * 100)}%</Text>
                  <Ionicons name="chevron-back" size={20} color={c.steel} />
                </Press>
              ))}
            </View>
          </>
        ) : null}
      </Reveal>
    </Page>
  );
}
