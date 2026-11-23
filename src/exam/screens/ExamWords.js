import React from 'react';
import { View, Text } from 'react-native';
import Flow from '../../components/Flow';
import Reveal from '../../components/Reveal';
import Page from '../components/Page';
import { useX, Btn, Tile, Bar, SectionTitle, ON_FLOW, font } from '../ui';
import { useExam, useToday } from '../ExamContext';
import { WORDS, TIERS, wordsOfTier } from '../data/words';
import { wordStats, todaysDeck, MASTERED_BOX } from '../engine/srs';
import { wordDeck } from '../engine/brain';
import { dir } from '../../design/rtl';

// ============================================================================
//  מילים — חבילת היום (חזרה מרווחת) ואז חבילות לפי שכבה.
// ============================================================================

export default function ExamWords({ navigation }) {
  const { c, t } = useX();
  const { state, today } = useExam();
  const day = useToday();
  if (!state || !day) return null;
  const task = day.plan.tasks.find((x) => x.kind === 'cards');
  const taskDone = task && day.done[task.id];
  const deck = task && !taskDone ? task.words : wordDeck(state, today).map((w) => w.id);
  const all = wordStats(WORDS, state.cards, today);
  const hard = WORDS.filter((w) => (state.cards[w.id]?.lapses || 0) >= 2);

  return (
    <Page title="מילים" over={`${all.mastered} נשלטות · ${all.learning} בלמידה · ${all.fresh} חדשות`}>
      <Reveal index={0}>
        <Flow variant="exam" style={{ padding: 22 }}>
          <Text style={{ fontFamily: font.m, fontSize: 15, color: ON_FLOW.dim, textAlign: dir.start }}>{taskDone ? 'החבילה של היום הושלמה' : 'חזרה מרווחת'}</Text>
          <Text style={{ fontFamily: font.h, fontSize: 28, lineHeight: 34, color: ON_FLOW.ink, marginTop: 4, textAlign: dir.start }}>
            {deck.length ? `החבילה של היום · ${deck.length} מילים` : 'אין מילים לחזרה עכשיו'}
          </Text>
          <Text style={{ fontFamily: font.r, fontSize: 17, lineHeight: 25, color: ON_FLOW.dim, marginTop: 6, textAlign: dir.start }}>
            מילה שידעת חוזרת אחרי יותר ויותר ימים. מילה שלא ידעת — חוזרת מחר.
          </Text>
          {deck.length ? (
            <Btn variant="flow" label="התחל כרטיסיות" icon="albums" onPress={() => navigation.navigate('Cards', { taskId: taskDone ? null : task?.id, words: deck })} style={{ marginTop: 20 }} />
          ) : null}
        </Flow>
      </Reveal>

      <Reveal index={1}>
        <SectionTitle>חבילות</SectionTitle>
        <View style={{ gap: 10 }}>
          {TIERS.map((tier) => {
            const words = wordsOfTier(tier.id);
            const st = wordStats(words, state.cards, today);
            const pack = todaysDeck(words, state.cards, today, { newLimit: 15, max: 20 });
            const free = pack.length ? pack : words.slice().sort(() => Math.random() - 0.5).slice(0, 15);
            return (
              <Tile key={tier.id} icon={tier.id === 'P' ? 'chatbubbles-outline' : tier.id === 'A' ? 'text-outline' : 'diamond-outline'}
                title={tier.name} sub={`${st.mastered} מתוך ${st.total} נשלטות${st.due ? ` · ${st.due} לחזרה` : ''}`}
                onPress={() => navigation.navigate('Cards', { words: free.map((w) => w.id), title: tier.name })}>
                <View style={{ marginTop: 8 }}><Bar value={st.total ? st.mastered / st.total : 0} /></View>
              </Tile>
            );
          })}
          {hard.length ? (
            <Tile icon="flame-outline" title="מילים קשות" sub={`${hard.length} מילים שנשכחו פעמיים או יותר`}
              onPress={() => navigation.navigate('Cards', { words: hard.slice(0, 20).map((w) => w.id), title: 'מילים קשות' })} />
          ) : null}
        </View>
        <Text style={[t.sub, { marginTop: 14, marginHorizontal: 4 }]}>מילה "נשלטת" אחרי {MASTERED_BOX} חזרות מוצלחות ברצף, במרווחים שגדלים עד חודש.</Text>
      </Reveal>
    </Page>
  );
}
