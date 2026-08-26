import React, { useCallback } from 'react';
import { I18nManager, View, StyleSheet, LogBox } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  useFonts,
  Heebo_400Regular,
  Heebo_600SemiBold,
  Heebo_800ExtraBold,
} from '@expo-google-fonts/heebo';

import { AppProvider, useApp } from './src/context/AppContext';
import { colors } from './src/design/tokens';
import TabBar from './src/components/TabBar';
import HomeScreen from './src/screens/HomeScreen';
import FitnessScreen from './src/screens/FitnessScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import PsychScreen from './src/screens/PsychScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import CelebrationModal from './src/components/CelebrationModal';
import Toast from './src/components/Toast';
import AppSkeleton from './src/components/AppSkeleton';

// כיוון RTL מלא. נקרא לפני הרכיב הראשון; נכנס לתוקף מהרצה הבאה של האפליקציה.
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

LogBox.ignoreLogs(['new NativeEventEmitter']);
SplashScreen.preventAutoHideAsync().catch(() => {});

const Tab = createBottomTabNavigator();
const RootStack = createNativeStackNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.bgSunken,
    text: colors.text1,
    border: colors.border,
    primary: colors.accent,
  },
};

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <TabBar {...props} />}
    >
      <Tab.Screen name="הכנה לשלב" component={HomeScreen} />
      <Tab.Screen name="כושר" component={FitnessScreen} />
      <Tab.Screen name="הלוח שלי" component={CalendarScreen} />
      <Tab.Screen name="פסיכוטכני" component={PsychScreen} />
    </Tab.Navigator>
  );
}

function Root() {
  const { state, celebration, dismissCelebration, toast } = useApp();

  // שלד בצורת התוכן במקום ספינר ממורכז — כך הממתין רואה מה עומד להגיע.
  if (!state) return <AppSkeleton />;

  return (
    <>
      <NavigationContainer theme={navTheme}>
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
          <RootStack.Screen name="Tabs" component={Tabs} />
          <RootStack.Screen name="Settings" component={SettingsScreen} />
        </RootStack.Navigator>
      </NavigationContainer>
      <CelebrationModal goal={celebration} onClose={dismissCelebration} />
      <Toast message={toast} />
    </>
  );
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Heebo_400Regular,
    Heebo_600SemiBold,
    Heebo_800ExtraBold,
  });

  const onReady = useCallback(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded, fontError]);

  // אם הפונט נכשל בטעינה ממשיכים בכל זאת — פונט מערכת עדיף על מסך לבן.
  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <View style={styles.root} onLayout={onReady}>
        <AppProvider>
          <Root />
        </AppProvider>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
});
