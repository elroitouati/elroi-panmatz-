import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import Flow from '../components/Flow';
import { SheetHost } from '../components/Sheet';
import { ExamProvider, useExam } from '../exam/ExamContext';
import ExamRoot from '../exam/ExamRoot';
import { useX, Btn, ON_FLOW, font, MAX_W } from '../exam/ui';
import { supabase, supabaseConfigured, currentUser, authErrorText } from '../sync/supabase';
import { dir } from '../design/rtl';

// ============================================================================
//  גרסת המחשב — עולם המבחן בלבד, בדפדפן.
//  • כיוון RTL מלא (dir="rtl" על השורש).
//  • התחברות עם אותו חשבון של פנמ"צ (הסנכרון עם My Day) — אימייל וסיסמה.
//  • הנתונים מסתנכרנים עם הטלפון דרך הטבלה exam_state.
//  • העמוד מוגבל ל-820 פיקסלים ובמרכז; שאלות בשתי עמודות; קיצורי מקלדת.
// ============================================================================

if (typeof document !== 'undefined') {
  document.documentElement.setAttribute('dir', 'rtl');
  document.documentElement.setAttribute('lang', 'he');
  document.title = 'פסיכוטכני · אלרואי';
}

const Stack = createNativeStackNavigator();

function Login() {
  const { c, t } = useX();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const submit = async () => {
    if (!email || !password) return;
    setBusy(true); setErr(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
    } catch (e) { setErr(authErrorText(e)); } finally { setBusy(false); }
  };
  const input = { height: 56, borderRadius: 14, borderWidth: 1, borderColor: c.mist, backgroundColor: c.surface, paddingHorizontal: 16, fontFamily: font.m, fontSize: 18, color: c.ink, textAlign: dir.start, outlineStyle: 'none' };
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: c.paper }}>
      <View style={{ width: '100%', maxWidth: 440, gap: 14 }}>
        <Flow variant="exam" style={{ padding: 24, marginBottom: 6 }}>
          <Ionicons name="reader" size={26} color={ON_FLOW.dim} />
          <Text style={{ fontFamily: font.h, fontSize: 30, lineHeight: 36, color: ON_FLOW.ink, marginTop: 8, textAlign: dir.start }}>פסיכוטכני · מחשב</Text>
          <Text style={{ fontFamily: font.r, fontSize: 17, lineHeight: 25, color: ON_FLOW.dim, marginTop: 6, textAlign: dir.start }}>
            התחברות עם החשבון של פנמ״צ — אותו אימייל וסיסמה של הסנכרון עם My Day. כל מה שתעשה כאן יופיע גם בטלפון.
          </Text>
        </Flow>
        <TextInput style={input} value={email} onChangeText={setEmail} placeholder="אימייל" placeholderTextColor={c.steel} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
        <TextInput style={input} value={password} onChangeText={setPassword} placeholder="סיסמה" placeholderTextColor={c.steel} secureTextEntry autoComplete="current-password" onSubmitEditing={submit} />
        {err ? <Text style={[t.body, { color: c.bad }]}>{err}</Text> : null}
        <Btn label={busy ? 'מתחבר…' : 'התחברות'} icon="log-in-outline" onPress={submit} disabled={busy || !email || !password} />
      </View>
    </View>
  );
}

function Shell() {
  const { c } = useX();
  const ex = useExam();
  const theme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: c.paper, card: c.paper, text: c.ink, border: c.mist, primary: c.deep } };
  if (!ex?.state) return <View style={{ flex: 1, backgroundColor: c.paper }} />;
  return (
    <View style={{ flex: 1, backgroundColor: c.paper }}>
      <View style={{ flex: 1, width: '100%', maxWidth: MAX_W, alignSelf: 'center', overflow: 'hidden' }}>
        <SheetHost>
          <NavigationContainer theme={theme} documentTitle={{ formatter: () => 'פסיכוטכני · אלרואי' }}>
            <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.paper } }}>
              <Stack.Screen name="Exam" component={ExamRoot} />
            </Stack.Navigator>
          </NavigationContainer>
        </SheetHost>
      </View>
    </View>
  );
}

function Gate() {
  const { c } = useX();
  const [user, setUser] = useState(supabaseConfigured ? undefined : null);
  useEffect(() => {
    if (!supabaseConfigured) return undefined;
    currentUser().then((u) => setUser(u || null));
    const { data } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);
  if (user === undefined) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.paper }}><ActivityIndicator color={c.deep} /></View>;
  if (supabaseConfigured && !user) return <Login />;
  return <Shell />;
}

export default function WebApp() {
  return (
    <View dir="rtl" style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ExamProvider>
          <Gate />
        </ExamProvider>
      </SafeAreaProvider>
    </View>
  );
}
