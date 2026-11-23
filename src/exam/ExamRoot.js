import React, { useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, Animated as RNAnimated } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, useReducedMotion } from 'react-native-reanimated';
import Press from '../components/Press';
import { haptic } from '../design/haptics';
import { colors, ease, keep } from '../design/tokens';
import { useX, font } from './ui';
import { useExam } from './ExamContext';
import ExamToday from './screens/ExamToday';
import ExamPractice from './screens/ExamPractice';
import ExamWords from './screens/ExamWords';
import ExamProgress from './screens/ExamProgress';
import TopicHub from './screens/TopicHub';
import Lesson from './screens/Lesson';
import Quiz from './screens/Quiz';
import Results from './screens/Results';
import Review from './screens/Review';
import Cards from './screens/Cards';
import Errors from './screens/Errors';
import ExamSettings from './screens/ExamSettings';
import Sim from './screens/Sim';

// ============================================================================
//  עולם המבחן — מחסנית משלו: ארבעה טאבים, ומעליהם מסכי מיקוד (שאלה,
//  כרטיסיות, שיעור) שעולים מלמטה בלי טאבים.
//  כניסה: העולם מגיע מ-1.04 ושקיפות 0 → 1 ב-360ms (ease-in-out) — תחושת
//  "צלילה" לעולם אחר. בהפחתת תנועה: רק עמעום.
// ============================================================================

const Stack = createNativeStackNavigator();
const Tab = createMaterialTopTabNavigator();

const ICONS = { 'היום': 'today', 'תרגול': 'grid', 'מילים': 'albums', 'התקדמות': 'analytics' };

function ExamTabBar({ state, navigation, position }) {
  const { c } = useX();
  const insets = useSafeAreaInsets();
  const prev = React.useRef(state.index);
  useEffect(() => { if (prev.current !== state.index) haptic.selection(); prev.current = state.index; }, [state.index]);
  const n = state.routes.length;
  return (
    <View style={{ position: 'absolute', start: 0, end: 0, bottom: 0, flexDirection: 'row', paddingTop: 8, paddingBottom: Math.max(insets.bottom, 10) }}>
      {Platform.OS === 'ios' ? <BlurView intensity={50} tint={c.dark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} /> : null}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: Platform.OS === 'ios' ? c.glass : c.paper }]} />
      <View style={{ position: 'absolute', top: 0, start: 0, end: 0, height: StyleSheet.hairlineWidth, backgroundColor: c.mist }} />
      {state.routes.map((route, i) => {
        const focused = state.index === i;
        const icon = ICONS[route.name];
        const on = position.interpolate({ inputRange: [i - 1, i, i + 1].map((v) => Math.max(-1, Math.min(n, v))), outputRange: [0, 1, 0], extrapolate: 'clamp' });
        const off = RNAnimated.subtract(1, on);
        return (
          <Press key={route.key} scaleTo={1} accessibilityRole="tab" accessibilityState={{ selected: focused }} accessibilityLabel={route.name}
            wrapStyle={{ flex: 1 }} style={{ alignItems: 'center', justifyContent: 'center', gap: 4, minHeight: 50 }}
            onPress={() => { const e = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true }); if (!focused && !e.defaultPrevented) navigation.navigate(route.name); }}>
            <View style={{ width: 28, height: 26 }}>
              <RNAnimated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', opacity: off }]}>
                <Ionicons name={`${icon}-outline`} size={24} color={c.steel} />
              </RNAnimated.View>
              <RNAnimated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', opacity: on }]}>
                <Ionicons name={icon} size={24} color={c.deep} />
              </RNAnimated.View>
            </View>
            <Text style={{ fontFamily: focused ? font.b : font.m, fontSize: 13, lineHeight: 16, color: focused ? c.deep : c.steel, textAlign: 'center' }}>{route.name}</Text>
          </Press>
        );
      })}
    </View>
  );
}

function ExamTabs() {
  const { c } = useX();
  return (
    <Tab.Navigator
      tabBarPosition="bottom"
      tabBar={(p) => <ExamTabBar {...p} />}
      screenOptions={{ swipeEnabled: true, animationEnabled: false, lazy: true, lazyPreloadDistance: 1, lazyPlaceholder: () => <View style={{ flex: 1, backgroundColor: c.paper }} /> }}
      sceneContainerStyle={{ backgroundColor: c.paper }}
      style={{ backgroundColor: c.paper }}
    >
      <Tab.Screen name="היום" component={ExamToday} />
      <Tab.Screen name="תרגול" component={ExamPractice} />
      <Tab.Screen name="מילים" component={ExamWords} />
      <Tab.Screen name="התקדמות" component={ExamProgress} />
    </Tab.Navigator>
  );
}

export default function ExamRoot() {
  const { c } = useX();
  const ex = useExam();
  const reduced = useReducedMotion();
  const p = useSharedValue(0);
  useEffect(() => { p.value = withTiming(1, { duration: 360, easing: ease.inOut, ...keep }); }, []);
  const st = useAnimatedStyle(() => ({
    opacity: p.value,
    transform: reduced ? [] : [{ scale: 1.04 - 0.04 * p.value }],
  }));

  // סרגל הניווט של אנדרואיד מקבל את צבע העולם, וחוזר לזית ביציאה
  useFocusEffect(useCallback(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync(c.paper).catch(() => {});
      NavigationBar.setButtonStyleAsync(c.dark ? 'light' : 'dark').catch(() => {});
    }
    return () => {
      if (Platform.OS === 'android') {
        NavigationBar.setBackgroundColorAsync(colors.bgDeep).catch(() => {});
        NavigationBar.setButtonStyleAsync('light').catch(() => {});
      }
    };
  }, [c]));

  if (!ex?.state) return <View style={{ flex: 1, backgroundColor: c.paper }} />;

  const focus = { animation: 'fade_from_bottom', contentStyle: { backgroundColor: c.paper } };
  return (
    <Animated.View style={[{ flex: 1, backgroundColor: c.paper }, st]}>
      <StatusBar style={c.dark ? 'light' : 'dark'} />
      <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.paper } }}>
        <Stack.Screen name="ExamTabs" component={ExamTabs} />
        <Stack.Screen name="TopicHub" component={TopicHub} options={focus} />
        <Stack.Screen name="Lesson" component={Lesson} options={focus} />
        <Stack.Screen name="Quiz" component={Quiz} options={{ ...focus, gestureEnabled: false }} />
        <Stack.Screen name="Results" component={Results} options={focus} />
        <Stack.Screen name="Review" component={Review} options={focus} />
        <Stack.Screen name="Cards" component={Cards} options={{ ...focus, gestureEnabled: false }} />
        <Stack.Screen name="Errors" component={Errors} options={focus} />
        <Stack.Screen name="ExamSettings" component={ExamSettings} options={focus} />
        <Stack.Screen name="Sim" component={Sim} options={{ ...focus, gestureEnabled: false }} />
      </Stack.Navigator>
    </Animated.View>
  );
}
