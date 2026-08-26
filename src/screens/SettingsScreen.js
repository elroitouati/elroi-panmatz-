import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Tile from '../components/Tile';
import IconBadge from '../components/IconBadge';
import DateEntryModal from '../components/DateEntryModal';
import { colors, space, radius, touch, state as st } from '../design/tokens';
import { text } from '../design/typography';
import { ltr } from '../design/rtl';
import { useApp } from '../context/AppContext';
import { formatHebDate } from '../utils/date';

export default function SettingsScreen({ navigation }) {
  const { state, setStageDate, updateSettings } = useApp();
  const [editStage, setEditStage] = useState(null);

  if (!state) return null;
  const { settings } = state;

  const changeHour = (delta) => {
    let h = settings.reminderHour + delta;
    if (h < 0) h = 23;
    if (h > 23) h = 0;
    updateSettings({ reminderHour: h });
  };

  // חזרה בעברית מצביעה ימינה — לכיוון תחילת הקריאה
  const back = (
    <Pressable
      onPress={() => navigation.goBack()}
      accessibilityRole="button"
      accessibilityLabel="חזרה"
      hitSlop={12}
      style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
    >
      <Ionicons name="chevron-forward" size={20} color={colors.text1} />
    </Pressable>
  );

  return (
    <Screen title="הגדרות" subtitle="תאריכים והתראות" action={back}>
      <Text style={[text.bodyStrong, styles.sectionTitle]}>תאריכי השלבים</Text>
      <Text style={text.label}>
        עד שיוזן תאריך אמיתי, מסך הבית מציג את החודש המשוער בלבד — בלי ספירת ימים.
      </Text>

      <View style={styles.list}>
        {state.stages.map((stage) => (
          <Tile
            key={stage.id}
            onPress={() => setEditStage(stage)}
            accessibilityLabel={`עריכת תאריך ל${stage.name}`}
            style={styles.row}
          >
            <IconBadge icon={stage.icon} size={touch.min} active={!!stage.date} />
            <View style={styles.rowText}>
              <Text style={text.bodyStrong} numberOfLines={1}>{stage.name}</Text>
              <Text style={[text.label, stage.date && styles.dateSet]} numberOfLines={1}>
                {stage.date ? ltr(formatHebDate(stage.date)) : `${stage.defaultLabel} · משוער`}
              </Text>
            </View>
            <Ionicons name="create-outline" size={18} color={colors.text3} />
          </Tile>
        ))}
      </View>

      <Text style={[text.bodyStrong, styles.sectionTitle]}>התראות</Text>
      <Tile style={styles.notifTile}>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={text.bodyStrong}>תזכורת אימון</Text>
            <Text style={text.label}>נשלחת בימי האימון שהגדרת</Text>
          </View>
          <Switch
            value={settings.notificationsEnabled}
            onValueChange={(v) => updateSettings({ notificationsEnabled: v })}
            trackColor={{ true: colors.accentBorder, false: colors.surface3 }}
            thumbColor={settings.notificationsEnabled ? colors.accent : colors.text3}
            accessibilityLabel="תזכורת אימון"
          />
        </View>

        {settings.notificationsEnabled ? (
          <View style={styles.hourRow}>
            <Text style={text.label}>שעת התזכורת</Text>
            <View style={styles.stepper}>
              <Step icon="remove" label="שעה מוקדמת יותר" onPress={() => changeHour(-1)} />
              <Text style={[text.bodyStrong, styles.hour]}>
                {ltr(`${String(settings.reminderHour).padStart(2, '0')}:00`)}
              </Text>
              <Step icon="add" label="שעה מאוחרת יותר" onPress={() => changeHour(1)} />
            </View>
          </View>
        ) : null}
      </Tile>

      <Text style={[text.label, styles.footnote]}>
        הנתונים נשמרים על המכשיר הזה בלבד. אין חשבון ואין שרת.
      </Text>

      <DateEntryModal
        visible={!!editStage}
        stage={editStage}
        onClose={() => setEditStage(null)}
        onSave={(key) => setStageDate(editStage.id, key)}
        onClear={() => setStageDate(editStage.id, null)}
      />
    </Screen>
  );
}

function Step({ icon, label, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={({ pressed }) => [styles.step, pressed && styles.pressed]}
    >
      <Ionicons name={icon} size={16} color={colors.text1} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  iconBtn: {
    width: touch.min, height: touch.min, borderRadius: radius.pill,
    backgroundColor: colors.surface1, alignItems: 'center', justifyContent: 'center',
  },
  pressed: { backgroundColor: colors.surface3 },
  sectionTitle: { marginTop: space[4] },
  list: { gap: space[3] },
  row: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  rowText: { flex: 1, gap: 2 },
  dateSet: { color: colors.accent },
  notifTile: { gap: space[4] },
  hourRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderTopWidth: 1, borderTopColor: colors.border, paddingTop: space[4],
  },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  step: {
    width: 32, height: 32, borderRadius: radius.sm,
    backgroundColor: colors.surface1, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  hour: { minWidth: 56, textAlign: 'center' },
  footnote: { textAlign: 'center', marginTop: space[4] },
});
