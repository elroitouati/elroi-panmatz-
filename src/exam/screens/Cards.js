import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSpring, withSequence, runOnJS, interpolate, Extrapolation, useReducedMotion,
} from 'react-native-reanimated';
import Press from '../../components/Press';
import { FocusBar } from '../components/Page';
import { useX, Btn, Pill, font, useContentWidth, useKeys, WEB } from '../ui';
import { useExam } from '../ExamContext';
import { WORD } from '../data/words';
import { ease, keep } from '../../design/tokens';
import { haptic } from '../../design/haptics';
import { ltr } from '../../design/rtl';

// ============================================================================
//  כרטיסיות בסגנון Quizlet.
//  • לחיצה הופכת (שני חצאים: 150ms מתכווץ, החלפת צד, 150ms נפתח).
//  • החלקה ימינה = ידעתי, שמאלה = עוד לא. הכרטיס עוקב אחרי האצבע 1:1,
//    ומהירות ההעפה מחליטה (לא רק מרחק). חותמת מופיעה בהדרגה.
//  • שני כפתורים בלבד: ידעתי (ימין, ירוק) / לא ידעתי (שמאל, אדום).
//  • "במשפט" בפינה — המילה בתוך משפט. "חזרה" מבטל את ההחלטה האחרונה.
//  • סיבוב ראשון נרשם בחזרה המרווחת; סיבובים נוספים — תרגול בלבד.
// ============================================================================

const FLY = 700;

export default function Cards({ navigation, route }) {
  const { c, t } = useX();
  const { height } = useWindowDimensions();
  const width = useContentWidth();
  const insets = useSafeAreaInsets();
  const ex = useExam();
  const reduced = useReducedMotion();
  const { taskId, words = [], title } = route.params || {};
  const ids = useMemo(() => words.filter((id) => WORD[id]), []);

  const [round, setRound] = useState(1);
  const [queue, setQueue] = useState(ids);
  const [idx, setIdx] = useState(0);
  const [know, setKnow] = useState([]);
  const [learn, setLearn] = useState([]);
  const [hist, setHist] = useState([]);
  const [flipped, setFlipped] = useState(false);
  const [ex1, setEx1] = useState(false);
  const busy = useRef(false);
  const doneMarked = useRef(false);

  const tx = useSharedValue(0);
  const flip = useSharedValue(1);   // scaleX של הכרטיס בזמן היפוך
  const appear = useSharedValue(1);
  const bumpK = useSharedValue(1);
  const bumpL = useSharedValue(1);

  const cardW = Math.min(width - 44, 440);
  const cardH = Math.min(400, height * 0.46);
  const id = queue[idx];
  const w = id ? WORD[id] : null;
  const ended = idx >= queue.length;

  useEffect(() => {
    if (ended && round === 1 && !doneMarked.current) {
      doneMarked.current = true;
      if (taskId) ex.markTask(taskId);
      haptic.success();
    }
  }, [ended]);

  const doFlip = () => {
    if (busy.current || !w) return;
    haptic.selection();
    if (reduced) { setFlipped((f) => !f); return; }
    busy.current = true;
    flip.value = withTiming(0, { duration: 150, easing: ease.inOut }, (f) => {
      if (!f) return;
      runOnJS(toggleFlip)();
      flip.value = withTiming(1, { duration: 150, easing: ease.inOut }, () => runOnJS(unbusy)());
    });
  };
  function unbusy() { busy.current = false; }
  function toggleFlip() { setFlipped((v) => !v); }

  const decide = (knew) => {
    if (!w) return;
    const prevCard = ex.state.cards[id] || null;
    const wasNew = !prevCard;
    if (round === 1) ex.reviewWord(id, knew);
    setHist((h) => [...h, { id, knew, prevCard, wasNew, round }]);
    if (knew) { setKnow((k) => [...k, id]); bumpK.value = withSequence(withTiming(1.15, { duration: 100 }), withTiming(1, { duration: 160 })); }
    else { setLearn((l) => [...l, id]); bumpL.value = withSequence(withTiming(1.15, { duration: 100 }), withTiming(1, { duration: 160 })); }
    haptic.light();
    setFlipped(false);
    setEx1(false);
    setIdx((i) => i + 1);
    tx.value = 0;
    appear.value = 0;
    appear.value = withTiming(1, { duration: 200, easing: ease.out, ...keep });
    busy.current = false;
  };

  const flyOut = (knew, velocity = 0) => {
    if (busy.current || !w) return;
    busy.current = true;
    const target = knew ? FLY : -FLY;
    if (reduced) { decide(knew); return; }
    tx.value = withTiming(target, { duration: 220, easing: ease.out }, (f) => { if (f) runOnJS(decide)(knew); });
  };

  const undo = () => {
    const last = hist[hist.length - 1];
    if (!last || busy.current) return;
    if (last.round !== round) return;
    haptic.selection();
    if (last.round === 1) ex.undoWord(last.id, last.prevCard, last.wasNew);
    setHist((h) => h.slice(0, -1));
    if (last.knew) setKnow((k) => k.slice(0, -1)); else setLearn((l) => l.slice(0, -1));
    setIdx((i) => Math.max(0, i - 1));
    setFlipped(false);
    tx.value = 0;
    appear.value = 0;
    appear.value = withTiming(1, { duration: 200, easing: ease.out, ...keep });
  };

  const pan = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .failOffsetY([-14, 14])
    .onUpdate((e) => { tx.value = e.translationX; })
    .onEnd((e) => {
      const projected = tx.value + e.velocityX * 0.18;
      if (Math.abs(projected) > cardW * 0.42) {
        const knew = projected > 0;
        tx.value = withTiming(knew ? FLY : -FLY, { duration: 200, easing: ease.out }, (f) => { if (f) runOnJS(decide)(knew); });
      } else {
        tx.value = withSpring(0, { duration: 300, dampingRatio: 0.8, velocity: e.velocityX });
      }
    });
  const tap = Gesture.Tap().maxDuration(260).onEnd((_e, ok) => { if (ok) runOnJS(doFlip)(); });
  const gesture = Gesture.Exclusive(pan, tap);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: appear.value,
    transform: [
      { translateX: tx.value },
      { rotate: `${interpolate(tx.value, [-300, 0, 300], [-10, 0, 10], Extrapolation.CLAMP)}deg` },
      { scaleX: flip.value },
      { scale: 0.96 + 0.04 * appear.value },
    ],
  }));
  const knowStamp = useAnimatedStyle(() => ({ opacity: interpolate(tx.value, [20, 110], [0, 1], Extrapolation.CLAMP) }));
  const learnStamp = useAnimatedStyle(() => ({ opacity: interpolate(tx.value, [-110, -20], [1, 0], Extrapolation.CLAMP) }));
  const kStyle = useAnimatedStyle(() => ({ transform: [{ scale: bumpK.value }] }));
  const lStyle = useAnimatedStyle(() => ({ transform: [{ scale: bumpL.value }] }));

  // מקלדת: רווח = היפוך, חץ ימינה = ידעתי, חץ שמאלה = לא ידעתי, Backspace = חזרה
  useKeys((k) => {
    if (ended) return false;
    if (k === ' ') { doFlip(); return true; }
    if (k === 'ArrowRight') { flyOut(true); return true; }
    if (k === 'ArrowLeft') { flyOut(false); return true; }
    if (k === 'Backspace') { undo(); return true; }
    return false;
  });

  const nextRound = () => {
    const again = learn.slice();
    setRound((r) => r + 1);
    setQueue(again);
    setIdx(0); setKnow([]); setLearn([]); setHist([]); setFlipped(false);
    appear.value = 0; appear.value = withTiming(1, { duration: 200, easing: ease.out, ...keep });
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.paper }}>
      <FocusBar onClose={() => navigation.goBack()} title={title || 'כרטיסיות'}
        right={<Pill label="חזרה" icon="arrow-undo" onPress={undo} style={{ opacity: hist.length && hist[hist.length - 1].round === round && !ended ? 1 : 0.35 }} />} />

      {!ended && w ? (
        <>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 4 }}>
            <Animated.View style={[{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, backgroundColor: c.okSoft }, kStyle]}>
              <Ionicons name="checkmark" size={18} color={c.ok} />
              <Text style={{ fontFamily: font.b, fontSize: 16, color: c.ok, fontVariant: ['tabular-nums'] }}>{know.length}</Text>
            </Animated.View>
            <Text style={{ fontFamily: font.m, fontSize: 15, color: c.slate, fontVariant: ['tabular-nums'] }}>{ltr(`${idx + 1} / ${queue.length}`)}{round > 1 ? ` · סיבוב ${round}` : ''}</Text>
            <Animated.View style={[{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, backgroundColor: c.badSoft }, lStyle]}>
              <Text style={{ fontFamily: font.b, fontSize: 16, color: c.bad, fontVariant: ['tabular-nums'] }}>{learn.length}</Text>
              <Ionicons name="refresh" size={17} color={c.bad} />
            </Animated.View>
          </View>

          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22 }}>
            <GestureDetector gesture={gesture}>
              <Animated.View accessible accessibilityRole="button" accessibilityLabel={flipped ? `${w.w}: ${w.m}` : `${w.w}. לחיצה להפוך`}
                style={[{ width: cardW, height: cardH, borderRadius: 26, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center', padding: 24,
                  shadowColor: c.shadow, shadowOpacity: c.dark ? 0.4 : 0.14, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 6 }, cardStyle]}>
                {flipped ? (
                  <Text style={{ fontFamily: font.h, fontSize: 34, lineHeight: 42, color: c.ink, textAlign: 'center' }}>{w.m}</Text>
                ) : (
                  <Text style={{ fontFamily: font.h, fontSize: 44, lineHeight: 52, color: c.ink, textAlign: 'center' }}>{w.w}</Text>
                )}
                {!ex1 ? <Text style={{ position: 'absolute', bottom: 20, fontFamily: font.m, fontSize: 15, color: c.steel }}>{flipped ? 'הפירוש' : WEB ? 'לחיצה או רווח להפוך · → ידעתי · ← לא ידעתי' : 'לחיצה להפוך'}</Text> : null}

                <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: 22, left: 22, transform: [{ rotate: '-8deg' }], borderWidth: 3, borderColor: c.ok, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4 }, knowStamp]}>
                  <Text style={{ fontFamily: font.h, fontSize: 20, color: c.ok }}>ידעתי</Text>
                </Animated.View>
                <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: 22, right: 22, transform: [{ rotate: '8deg' }], borderWidth: 3, borderColor: c.bad, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4 }, learnStamp]}>
                  <Text style={{ fontFamily: font.h, fontSize: 20, color: c.bad }}>עוד לא</Text>
                </Animated.View>

                {w.s ? (
                  <Press onPress={() => { haptic.selection(); setEx1((v) => !v); }} accessibilityLabel="המילה במשפט" scaleTo={0.95} hitSlop={6}
                    wrapStyle={{ position: 'absolute', top: 14, end: 14 }}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, height: 38, borderRadius: 999, borderWidth: 1,
                      borderColor: ex1 ? c.deep : c.mist, backgroundColor: ex1 ? c.deep : c.paper }}>
                    <Ionicons name="chatbox-ellipses-outline" size={16} color={ex1 ? c.onDeep : c.deep} />
                    <Text style={{ fontFamily: font.b, fontSize: 15, color: ex1 ? c.onDeep : c.deep }}>במשפט</Text>
                  </Press>
                ) : null}
                {ex1 ? (
                  <View style={{ position: 'absolute', start: 16, end: 16, bottom: 16, backgroundColor: c.paper, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 14 }}>
                    <Text style={{ fontFamily: font.b, fontSize: 13, color: c.steel, marginBottom: 2 }}>במשפט</Text>
                    <Text style={[t.body, { fontSize: 18, lineHeight: 27, color: c.slate }]}>{w.s}</Text>
                  </View>
                ) : null}
              </Animated.View>
            </GestureDetector>
          </View>

          {/* שורה בכיוון עברי: הראשון מימין — "ידעתי" בצד של ההחלקה ימינה */}
          <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingBottom: insets.bottom + 18 }}>
            <Press wrapStyle={{ flex: 1 }} onPress={() => flyOut(true)} accessibilityLabel="ידעתי"
              style={{ height: 62, borderRadius: 18, backgroundColor: c.okSoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <Ionicons name="checkmark-circle" size={22} color={c.ok} />
              <Text style={{ fontFamily: font.b, fontSize: 18, color: c.ok }}>ידעתי</Text>
            </Press>
            <Press wrapStyle={{ flex: 1 }} onPress={() => flyOut(false)} accessibilityLabel="לא ידעתי"
              style={{ height: 62, borderRadius: 18, backgroundColor: c.badSoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <Ionicons name="refresh-circle" size={22} color={c.bad} />
              <Text style={{ fontFamily: font.b, fontSize: 18, color: c.bad }}>לא ידעתי</Text>
            </Press>
          </View>
        </>
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Ionicons name={learn.length ? 'albums-outline' : 'trophy-outline'} size={56} color={c.deep} />
          <Text style={[t.title, { textAlign: 'center', marginTop: 16, marginBottom: 8 }]}>{queue.length ? (learn.length ? `סיבוב ${round} הושלם` : 'כל המילים ידועות') : 'אין מילים כאן'}</Text>
          <Text style={[t.bodyDim, { textAlign: 'center', marginBottom: 24 }]}>
            {round === 1 && queue.length ? 'ההתקדמות נשמרה בחזרה המרווחת. מילים שלא ידעת יחזרו מחר.' : 'תרגול נוסף — לא משנה את לוח החזרות.'}
          </Text>
          {queue.length ? (
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 28 }}>
              <View style={{ backgroundColor: c.surface, borderRadius: 18, paddingVertical: 14, paddingHorizontal: 22, minWidth: 120, alignItems: 'center' }}>
                <Text style={{ fontFamily: font.h, fontSize: 32, color: c.ok }}>{know.length}</Text>
                <Text style={t.sub}>ידעתי</Text>
              </View>
              <View style={{ backgroundColor: c.surface, borderRadius: 18, paddingVertical: 14, paddingHorizontal: 22, minWidth: 120, alignItems: 'center' }}>
                <Text style={{ fontFamily: font.h, fontSize: 32, color: c.bad }}>{learn.length}</Text>
                <Text style={t.sub}>עוד לומד</Text>
              </View>
            </View>
          ) : null}
          <View style={{ alignSelf: 'stretch', gap: 10, maxWidth: 380, width: '100%', alignSelf: 'center' }}>
            {learn.length ? <Btn label={`תמשיך לתרגל · ${learn.length}`} icon="refresh" onPress={nextRound} /> : null}
            <Btn label="סיום" variant={learn.length ? 'line' : 'primary'} onPress={() => navigation.goBack()} />
          </View>
        </View>
      )}
    </View>
  );
}
