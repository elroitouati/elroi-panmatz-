import React, { useCallback } from 'react';
import { I18nManager, StyleSheet, LogBox, Platform, View } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  useFonts,
  Heebo_400Regular,
  Heebo_500Medium,
  Heebo_700Bold,
  Heebo_900Black,
} from '@expo-google-fonts/heebo';

import { AppProvider, useApp } from './src/context/AppContext';
import { colors } from './src/design/tokens';
import TabBar from './src/components/TabBar';
import { SheetHost } from './src/components/Sheet';
import Celebration from './src/components/Celebration';
import StreakCelebration from './src/components/StreakCelebration';
import Toast from './src/components/Toast';
import AppSkeleton from './src/components/AppSkeleton';
import HomeScreen from './src/screens/HomeScreen';
import FitnessScreen from './src/screens/FitnessScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import PsychScreen from './src/screens/PsychScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { ExamProvider } from './src/exam/ExamContext';
import { GateProvider, navRef, useGate } from './src/exam/Gate';
import ExamRoot from './src/exam/ExamRoot';
import WebApp from './src/web/WebApp';
import { PagerLtr, Rtl, rtlScreen } from './src/components/WebDir';

// כיוון RTL מלא. נקרא לפני הרכיב הראשון; נכנס לתוקף מהרצה הבאה של האפליקציה.
// (בדפדפן הכיוון נקבע ב-WebApp עם dir="rtl")
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

LogBox.ignoreLogs(['new NativeEventEmitter']);
SplashScreen.preventAutoHideAsync().catch(() => {});

// סרגל הניווט של אנדרואיד (סמסונג: ||| ○ <) — באותו צבע כמו סרגל הטאבים,
// עם כפתורים בהירים, כך שהתחתית נראית כחלק אחד מהאפליקציה.
if (Platform.OS === 'android') {
  NavigationBar.setBackgroundColorAsync(colors.bgDeep).catch(() => {});
  NavigationBar.setButtonStyleAsync('light').catch(() => {});
}

const Tab = createMaterialTopTabNavigator();
const RootStack = createNativeStackNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.bgDeep,
    text: colors.ink,
    border: colors.separator,
    primary: colors.gold,
  },
};

function Tabs() {
  const gate = useGate();
  return (
    <PagerLtr>
    <Tab.Navigator
      tabBarPosition="bottom"
      tabBar={(props) => <Rtl><TabBar {...props} /></Rtl>}
      screenOptions={{
        // החלקה בין המסכים: הדף עוקב אחרי האצבע 1:1, ומהירות ההעפה מחליטה
        // (pager נייטיב — פיזיקה של המערכת). ב-RTL המסך הבא נמצא משמאל.
        swipeEnabled: true,
        // לחיצה על טאב — מיידית, בלי גלילה בין דפים (פעולה תכופה = אפס תנועה)
        animationEnabled: false,
        // המסך השכן כבר מוכן, כך שבהחלקה רואים תוכן ולא מסך ריק
        lazy: true,
        lazyPreloadDistance: 1,
        lazyPlaceholder: () => <View style={styles.root} />,
      }}
      sceneContainerStyle={{ backgroundColor: colors.bg }}
      style={{ backgroundColor: colors.bg }}
    >
      <Tab.Screen name="היום" component={rtlScreen(HomeScreen)} />
      <Tab.Screen name="כושר" component={rtlScreen(FitnessScreen)} />
      <Tab.Screen name="הלוח שלי" component={rtlScreen(CalendarScreen)} />
      {/* לחיצה על "מבחן" לא מחליפה טאב — היא פותחת את גיליון הכניסה לעולם המבחן */}
      <Tab.Screen
        name="מבחן"
        component={rtlScreen(PsychScreen)}
        listeners={{ tabPress: (e) => { e.preventDefault(); gate.open(); } }}
      />
    </Tab.Navigator>
    </PagerLtr>
  );
}

function Root() {
  const { state, celebration, dismissCelebration, toast, streakCelebration, dismissStreakCelebration } = useApp();

  // שלד בצורת התוכן במקום ספינר — הממתין רואה מה עומד להגיע.
  if (!state) return <AppSkeleton />;

  return (
    <>
      <SheetHost>
        <GateProvider>
        <NavigationContainer theme={navTheme} ref={navRef}>
          <RootStack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
            <RootStack.Screen name="Tabs" component={Tabs} />
            {/* הגדרות עולות מלמטה, כמו גיליון — הן משימה צדדית, לא עוד שכבה בהיררכיה */}
            <RootStack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{ animation: 'slide_from_bottom' }}
            />
            {/* עולם המבחן: עמעום מעל הזית, והעולם עצמו "צולל" פנימה (ExamRoot) */}
            <RootStack.Screen
              name="Exam"
              component={ExamRoot}
              options={{ animation: 'fade', contentStyle: { backgroundColor: '#F5F6F8' } }}
            />
          </RootStack.Navigator>
        </NavigationContainer>
        </GateProvider>
      </SheetHost>
      <Toast message={toast} />
      <Celebration goal={celebration} onClose={dismissCelebration} />
      {/* אם שתי חגיגות באות יחד — קודם היעד, אחר כך הרצף */}
      <StreakCelebration value={celebration ? null : streakCelebration} onClose={dismissStreakCelebration} />
    </>
  );
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Heebo_400Regular,
    Heebo_500Medium,
    Heebo_700Bold,
    Heebo_900Black,
  });

  const onReady = useCallback(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded, fontError]);

  // אם הפונט נכשל ממשיכים בכל זאת — פונט מערכת עדיף על מסך ריק.
  if (!fontsLoaded && !fontError) return null;

  // גרסת המחשב: עולם המבחן בלבד.
  // (EXPO_PUBLIC_WEB_FULL=1 = כל האפליקציה בדפדפן — רק לבדיקות אוטומטיות)
  const webFull = process.env.EXPO_PUBLIC_WEB_FULL === '1';
  if (Platform.OS === 'web' && !webFull) {
    return (
      <GestureHandlerRootView style={styles.app} onLayout={onReady}>
        <WebApp />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.app} onLayout={onReady} {...(webFull ? { dir: 'rtl' } : {})}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <AppProvider>
          <ExamProvider>
            <Root />
          </ExamProvider>
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  app: { flex: 1, backgroundColor: '#000' },
});
