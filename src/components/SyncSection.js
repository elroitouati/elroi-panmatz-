import React, { useEffect, useState } from 'react';
import { View, Text, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Section, Row } from './Group';
import Input from './Input';
import Button from './Button';
import { colors, space } from '../design/tokens';
import { text } from '../design/typography';
import { ltr } from '../design/rtl';
import { useApp } from '../context/AppContext';
import { supabaseConfigured, authErrorText } from '../sync/supabase';
import {
  getSyncStatus,
  onSyncStatus,
  syncNow,
  signIn,
  signUp,
  signOut,
  backupToCloud,
  fetchBackup,
  lastBackupTime,
} from '../sync/panmatzSync';
import { formatHebDate, dayKey } from '../utils/date';

// ============================================================================
//  סנכרון עם My Day + גיבוי לענן. תוספת בלבד — בלי התחברות הכל נשאר מקומי.
// ============================================================================

const when = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  const hm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return `${formatHebDate(dayKey(d))} · ${hm}`;
};

export default function SyncSection() {
  const { state, restoreState } = useApp();
  const [status, setStatus] = useState(getSyncStatus());
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(null);
  const [msg, setMsg] = useState(null);
  const [backupAt, setBackupAt] = useState(null);

  useEffect(() => onSyncStatus(setStatus), []);
  useEffect(() => {
    if (status.user) lastBackupTime().then(setBackupAt).catch(() => {});
  }, [status.user]);

  if (!supabaseConfigured) return null; // בלי מפתחות — המסך נראה בדיוק כמו קודם

  const run = (name, fn) => async () => {
    setBusy(name);
    setMsg(null);
    try {
      await fn();
    } catch (e) {
      setMsg({ error: true, text: authErrorText(e) });
    } finally {
      setBusy(null);
    }
  };

  if (!status.user) {
    return (
      <Section
        title="סנכרון עם My Day"
        footer="התחברות חד-פעמית. אותו חשבון בשתי האפליקציות — ואז אימון שסומן כאן מסומן גם ב-My Day, ולהפך."
      >
        <Row>
          <View style={styles.form}>
            <Input value={email} onChangeText={setEmail} placeholder="אימייל" keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
            <Input value={password} onChangeText={setPassword} placeholder="סיסמה (לפחות 6 תווים)" secureTextEntry autoCapitalize="none" />
            {msg ? <Text style={[text.sub, msg.error ? styles.err : styles.ok]}>{msg.text}</Text> : null}
            <Button
              variant="primary"
              label={busy === 'in' ? 'מתחבר…' : 'התחברות'}
              disabled={!!busy || !email || !password}
              onPress={run('in', () => signIn(email, password))}
            />
            <Button
              label="אין לי חשבון — הרשמה"
              disabled={!!busy || !email || password.length < 6}
              onPress={run('up', async () => {
                const ready = await signUp(email, password);
                if (!ready) setMsg({ text: 'נשלח אימייל אישור. אשר אותו ואז לחץ "התחברות".' });
              })}
            />
          </View>
        </Row>
      </Section>
    );
  }

  const restore = () =>
    Alert.alert(
      'לשחזר מהגיבוי בענן?',
      'כל הנתונים באפליקציה יוחלפו בנתונים מהגיבוי האחרון. אי אפשר לבטל.',
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'שחזור',
          style: 'destructive',
          onPress: run('restore', async () => {
            const backup = await fetchBackup();
            if (!backup?.state) {
              setMsg({ error: true, text: 'עדיין אין גיבוי בענן' });
              return;
            }
            restoreState(backup.state);
            setMsg({ text: 'הנתונים שוחזרו מהגיבוי' });
          }),
        },
      ]
    );

  return (
    <Section
      title="סנכרון עם My Day"
      footer={msg?.text || (status.error ? `הסנכרון האחרון נכשל (${authErrorText(status.error)}). השינויים שמורים וישלחו כשיחזור החיבור.` : 'אימונים ויעדי היום מופיעים ב-My Day, וסימון בכל צד מתעדכן בשני.')}
    >
      <Row
        title="מחובר"
        subtitle={status.user.email}
        leading={<Ionicons name="cloud-done-outline" size={22} color={colors.gold} />}
        value={status.lastSync ? ltr(when(status.lastSync).split(' · ')[1]) : null}
      />
      <Row
        title="סנכרון עכשיו"
        leading={<Ionicons name="sync-outline" size={22} color={colors.ink2} />}
        trailing={busy === 'sync' ? <ActivityIndicator color={colors.gold} /> : null}
        onPress={run('sync', async () => {
          await syncNow();
          setMsg({ text: 'מסונכרן ✓' });
        })}
      />
      <Row
        title="גיבוי מלא לענן"
        subtitle={backupAt ? `גיבוי אחרון: ${when(backupAt)}` : 'עוד לא נשמר גיבוי'}
        leading={<Ionicons name="cloud-upload-outline" size={22} color={colors.ink2} />}
        trailing={busy === 'backup' ? <ActivityIndicator color={colors.gold} /> : null}
        onPress={run('backup', async () => {
          const at = await backupToCloud(state);
          setBackupAt(at);
          setMsg({ text: 'כל הנתונים גובו לענן ✓' });
        })}
      />
      <Row
        title="שחזור מהגיבוי"
        leading={<Ionicons name="cloud-download-outline" size={22} color={colors.ink2} />}
        trailing={busy === 'restore' ? <ActivityIndicator color={colors.gold} /> : null}
        onPress={restore}
      />
      <Row
        title="התנתקות"
        leading={<Ionicons name="log-out-outline" size={22} color={colors.red} />}
        onPress={run('out', () => signOut())}
      />
    </Section>
  );
}

const styles = StyleSheet.create({
  form: { gap: space[3], paddingVertical: space[2] },
  err: { color: colors.red },
  ok: { color: colors.gold },
});

