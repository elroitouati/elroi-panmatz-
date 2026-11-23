import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Press from '../../components/Press';
import { useX, font } from '../ui';
import { TOPIC } from '../topics';
import { Matrix, FigureCell, Sequence, ChartView, TechDiagram } from './Visuals';
import { haptic } from '../../design/haptics';

// ============================================================================
//  שאלה אחת: גוף לפי סוג (סדרה / מילה / זוג / מטריצה / תרשים / טקסט)
//  ו־4 תשובות א–ד. reveal = מצב משוב (נכון בירוק, הבחירה השגויה באדום).
//  שם תת־הנושא לא מוצג בזמן שאלה — הוא היה מסגיר את החוק.
// ============================================================================

export const LETTERS = ['א', 'ב', 'ג', 'ד'];

export default function QuestionView({ q, chosen, onChoose, reveal, width = 340 }) {
  const { c, t } = useX();
  const choose = (i) => { if (reveal) return; haptic.selection(); onChoose(i); };

  const body = (() => {
    switch (q.kind) {
      case 'series':
        return <Sequence items={[...q.seq.map(String), '?']} />;
      case 'word':
        return (
          <View style={{ backgroundColor: c.surface, borderRadius: 22, paddingVertical: 30, alignItems: 'center' }}>
            <Text style={{ fontFamily: font.h, fontSize: 40, lineHeight: 48, color: c.ink, textAlign: 'center' }}>{q.word}</Text>
          </View>
        );
      case 'analogy':
        return (
          <View style={{ backgroundColor: c.surface, borderRadius: 22, paddingVertical: 28, alignItems: 'center' }}>
            <Text style={{ fontFamily: font.h, fontSize: 32, lineHeight: 40, color: c.ink, textAlign: 'center' }}>{q.pair}</Text>
          </View>
        );
      case 'figures':
        return <Matrix cells={q.matrix} width={Math.min(width, 320)} />;
      case 'chart':
        return <ChartView chart={q.chart} width={Math.min(width - 24, 340)} />;
      case 'tech':
        return <TechDiagram d={q.diagram} width={Math.min(width - 24, 340)} />;
      default:
        return null;
    }
  })();

  const longText = q.kind === 'text' || q.kind === 'chart' || q.kind === 'tech';
  const stateOf = (i) => {
    if (!reveal) return chosen === i ? 'sel' : 'idle';
    if (i === q.answer) return 'ok';
    if (i === chosen) return 'bad';
    return 'idle';
  };
  const look = (st) => ({
    idle: { border: c.mist, bg: c.surface, kbg: c.deepSoft, kfg: c.slate },
    sel: { border: c.deep, bg: c.deepSoft, kbg: c.deep, kfg: c.onDeep },
    ok: { border: c.ok, bg: c.okSoft, kbg: c.ok, kfg: '#fff' },
    bad: { border: c.bad, bg: c.badSoft, kbg: c.bad, kfg: '#fff' },
  }[st]);

  return (
    <View>
      <Text style={[t.sub, { fontFamily: font.m, fontSize: 16, marginBottom: 10 }]}>{TOPIC[q.topic].name}</Text>
      {longText ? <Text style={[t.lead, { fontFamily: font.b, fontSize: 20, lineHeight: 30, marginBottom: 16 }]}>{q.prompt}</Text> : (
        <Text style={[t.lead, { fontFamily: font.b, fontSize: 22, lineHeight: 30, marginBottom: 16 }]}>{q.prompt}</Text>
      )}
      {body ? <View style={{ marginBottom: 20 }}>{body}</View> : null}

      {q.kind === 'figures' ? (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {q.options.map((o, i) => {
            const L = look(stateOf(i));
            return (
              <Press key={i} wrapStyle={{ flex: 1 }} onPress={() => choose(i)} accessibilityLabel={`תשובה ${LETTERS[i]}`} accessibilityState={{ selected: chosen === i }}
                style={{ borderWidth: 1.5, borderColor: L.border, backgroundColor: L.bg, borderRadius: 16, alignItems: 'center', paddingTop: 8, paddingBottom: 6 }}>
                <FigureCell cell={o} size={62} />
                <Text style={{ fontFamily: font.b, fontSize: 16, color: c.slate, marginTop: 2 }}>{LETTERS[i]}</Text>
              </Press>
            );
          })}
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {q.options.map((o, i) => {
            const st = stateOf(i);
            const L = look(st);
            return (
              <Press key={i} onPress={() => choose(i)} accessibilityLabel={`תשובה ${LETTERS[i]}: ${o}`} accessibilityState={{ selected: chosen === i }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 60, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 16, borderWidth: 1.5, borderColor: L.border, backgroundColor: L.bg }}>
                <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: L.kbg, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontFamily: font.b, fontSize: 16, color: L.kfg }}>{LETTERS[i]}</Text>
                </View>
                <Text style={[t.body, { flex: 1, fontFamily: font.m, fontSize: 19, lineHeight: 26, fontVariant: ['tabular-nums'] }]}>{String(o)}</Text>
                {st === 'ok' ? <Ionicons name="checkmark-circle" size={24} color={c.ok} /> : st === 'bad' ? <Ionicons name="close-circle" size={24} color={c.bad} /> : null}
              </Press>
            );
          })}
        </View>
      )}
    </View>
  );
}

export function Explain({ q, ok }) {
  const { c, t } = useX();
  return (
    <View style={{ marginTop: 16, borderRadius: 18, padding: 16, backgroundColor: ok ? c.okSoft : c.badSoft }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <Ionicons name={ok ? 'checkmark-circle' : 'information-circle'} size={22} color={ok ? c.ok : c.bad} />
        <Text style={[t.strong, { color: ok ? c.ok : c.bad }]}>{ok ? 'נכון' : `התשובה הנכונה: ${LETTERS[q.answer]}`}</Text>
      </View>
      <Text style={t.body}>{q.explain}</Text>
    </View>
  );
}
