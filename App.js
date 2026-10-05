import React, { useCallback } from 'react';
import { I18nManager, StyleSheet, LogBox, Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
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
import Toast from './src/components/Toast';
import AppSkeleton from './src/components/AppSkeleton';
import HomeScreen from './src/screens/HomeScreen';
import FitnessScreen from './src/screens/FitnessScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import PsychScreen from './src/screens/PsychScreen';
import SettingsScreen from './src/screens/SettingsScreen';

// כיוון RTL מלא. נקרא לפני הרכיב הראשון; נכנס לתוקף מהרצה הבאה של האפליקציה.
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

const Tab = createBottomTabNavigator();
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
  return (
    <Tab.Navigator
      // מעבר טאב בלי אנימציה — פעולה שחוזרת עשרות פעמים ביום
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <TabBar {...props} />}
    >
      <Tab.Screen name="היום" component={HomeScreen} />
      <Tab.Screen name="כושר" component={FitnessScreen} />
      <Tab.Screen name="הלוח שלי" component={CalendarScreen} />
      <Tab.Screen name="פסיכוטכני" component={PsychScreen} />
    </Tab.Navigator>
  );
}

function Root() {
  const { state, celebration, dismissCelebration, toast } = useApp();

  // שלד בצורת התוכן במקום ספינר — הממתין רואה מה עומד להגיע.
  if (!state) return <AppSkeleton />;

  return (
    <>
      <SheetHost>
        <NavigationContainer theme={navTheme}>
          <RootStack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
            <RootStack.Screen name="Tabs" component={Tabs} />
            {/* הגדרות עולות מלמטה, כמו גיליון — הן משימה צדדית, לא עוד שכבה בהיררכיה */}
            <RootStack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{ animation: 'slide_from_bottom' }}
            />
          </RootStack.Navigator>
        </NavigationContainer>
      </SheetHost>
      <Toast message={toast} />
      <Celebration goal={celebration} onClose={dismissCelebration} />
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

  return (
    <GestureHandlerRootView style={styles.root} onLayout={onReady}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <AppProvider>
          <Root />
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
});
