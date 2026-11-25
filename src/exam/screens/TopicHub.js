import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Press from '../../components/Press';
import Reveal from '../../components/Reveal';
import { FocusBar } from '../components/Page';
import { useX, Btn, Bar, SectionTitle, MiniRing, font } from '../ui';
import { useExam } from '../ExamContext';
import { TOPIC } from '../topics';
import { LESSONS } from '../data/lessons';
import { statsFor, strengthOf } from '../engine/brain';

// ============================================================================
//  מרכז נושא: לפני הלימוד — "לימוד" ראשי ו"ישר לתרגול" משני. אחרי — הפוך.
//  החוקים ברשימה: לחיצה קופצת ישר לשלב בלימוד (מקום קבוע לחזור אליו).
// ============================================================================

export default function TopicHub({ navigation, route }) {
  const { c, t } = useX();
  const insets = useSafeAreaInsets();
  const { state } = useExam();
  const topic = route.params?.topic;
  const tp = TOPIC[topic];
  const L = LESSONS[topic] || [];
  const lesson = state.lessons[topic] || {};
  const s = { ...statsFor(state.attempts, topic), ...strengthOf(state.attempts, topic) };
  const learned = !!lesson.done;

  return (
    <View style={{ flex: 1, backgroundColor: c.paper }}>
      <FocusBar onClose={() => navigation.goBack()} closeIcon="arrow-forward" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: insets.bottom + 30 }} showsVerticalScrollIndicator={false}>
        <Reveal index={0}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 4, marginBottom: 20 }}>
            <View style={{ width: 64, height: 64, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ position: 'absolute' }}><MiniRing value={s.n ? s.strength : 0} size={64} stroke={5} /></View>
              <Ionicons name={tp.icon} size={26} color={c.deep} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={t.over}>{s.n ? `חוזק ${Math.round(s.strength * 100)}% · ${s.n} שאלות · ${s.covered}/${s.subsTotal} סוגים` : 'עוד לא תורגל'}</Text>
              <Text style={t.title}>{tp.name}</Text>
            </View>
          </View>
          <View style={{ gap: 10 }}>
            {learned ? (
              <>
                <Btn label="תרגול" icon="play" sub="10 שאלות עם משוב" onPress={() => navigation.navigate('Quiz', { mode: 'topic', topic })} />
                <Btn label="חזרה על הלימוד" variant="line" icon="book-outline" onPress={() => navigation.navigate('Lesson', { topic })} />
              </>
            ) : (
              <>
                <Btn label={`לימוד · ${L.length} שלבים`} icon="book" sub="קודם מבינים את החוקים, אחר כך מתרגלים" onPress={() => navigation.navigate('Lesson', { topic, start: lesson.step || 0 })} />
                <Btn label="ישר לתרגול" variant="line" icon="play-outline" onPress={() => navigation.navigate('Quiz', { mode: 'topic', topic })} />
              </>
            )}
          </View>
        </Reveal>

        <Reveal index={1}>
          <SectionTitle>הלימוד</SectionTitle>
          <View style={{ gap: 8 }}>
            {L.map((slide, i) => {
              const seen = learned || (lesson.step || 0) > i;
              return (
                <Press key={i} onPress={() => navigation.navigate('Lesson', { topic, start: i })} accessibilityLabel={slide.title}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: c.surface, borderRadius: 18, paddingVertical: 14, paddingHorizontal: 16 }}>
                  <View style={{ width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: seen ? c.okSoft : c.deepSoft }}>
                    {seen ? <Ionicons name="checkmark" size={17} color={c.ok} /> : <Text style={{ fontFamily: font.b, fontSize: 14, color: c.slate }}>{i + 1}</Text>}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[t.strong, { fontSize: 17 }]} numberOfLines={1}>{slide.title}</Text>
                    <Text style={t.sub} numberOfLines={1}>{slide.tag}</Text>
                  </View>
                  <Ionicons name="chevron-back" size={18} color={c.steel} />
                </Press>
              );
            })}
          </View>
        </Reveal>

        <Reveal index={2}>
          <SectionTitle>תרגול לפי סוג</SectionTitle>
          <View style={{ backgroundColor: c.surface, borderRadius: 22, paddingVertical: 6 }}>
            {tp.subs.map(([id, name], i) => {
              const ss = statsFor(state.attempts, topic, id);
              return (
                <Press key={id} scaleTo={1} pressedStyle={{ backgroundColor: c.pressed }} accessibilityLabel={name}
                  onPress={() => navigation.navigate('Quiz', { mode: 'topic', topic, sub: id })}
                  style={{ paddingVertical: 13, paddingHorizontal: 18, borderTopWidth: i ? 1 : 0, borderColor: c.mist }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={[t.strong, { flex: 1, fontSize: 17 }]}>{name}</Text>
                    <Text style={[t.sub, { fontFamily: font.b }]}>{ss.n ? `${Math.round(ss.recentAcc * 100)}% · ${ss.n}` : '—'}</Text>
                  </View>
                  <Bar value={ss.n ? ss.mastery : 0} />
                </Press>
              );
            })}
          </View>
        </Reveal>
      </ScrollView>
    </View>
  );
}
