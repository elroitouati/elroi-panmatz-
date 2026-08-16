import React from 'react';
import { I18nManager, View, ActivityIndicator, StyleSheet, LogBox } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { AppProvider, useApp } from './src/context/AppContext';
import { colors, radius, shadow } from './src/theme';
import IconBadge from './src/components/IconBadge';
import HomeScreen from './src/screens/HomeScreen';
import FitnessScreen from './src/screens/FitnessScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import PsychScreen from './src/screens/PsychScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import CelebrationModal from './src/components/CelebrationModal';
import Toast from './src/components/Toast';

// כיוון RTL מלא — עברית מימין לשמאל
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

LogBox.ignoreLogs(['new NativeEventEmitter']); // רעש לא רלוונטי מ-expo-notifications

const Tab = createBottomTabNavigator();
const RootStack = createNativeStackNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.bgDeep,
    text: colors.cream,
    border: colors.line,
    primary: colors.gold,
  },
};

const TAB_ICONS = {
  'הכנה לשלב': ['home', 'home-outline'],
  'כושר': ['barbell', 'barbell-outline'],
  'הלוח שלי': ['calendar', 'calendar-outline'],
  'פסיכוטכני': ['bulb', 'bulb-outline'],
};

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.creamDim,
        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 20,
          height: 76,
          borderRadius: radius.xl,
          backgroundColor: colors.bgDeep,
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: colors.line,
          ...shadow.card,
        },
        tabBarItemStyle: { paddingVertical: 8 },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700', marginTop: 2 },
        tabBarIcon: ({ focused, color }) => {
          const [on, off] = TAB_ICONS[route.name] || ['ellipse', 'ellipse-outline'];
          return <IconBadge icon={focused ? on : off} size={40} iconSize={20} iconColor={color} active={focused} />;
        },
      })}
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

  if (!state) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  return (
    <>
      <NavigationContainer theme={navTheme}>
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
          <RootStack.Screen name="Tabs" component={Tabs} />
          <RootStack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ presentation: 'card' }}
          />
        </RootStack.Navigator>
      </NavigationContainer>
      <CelebrationModal goal={celebration} onClose={dismissCelebration} />
      <Toast message={toast} />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AppProvider>
        <Root />
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
});
