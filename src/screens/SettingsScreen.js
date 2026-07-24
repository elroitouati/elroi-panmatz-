import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Card from '../components/Card';
import DateEntryModal from '../components/DateEntryModal';
import { colors, spacing, radius, font } from '../theme';
import { useApp } from '../context/AppContext';
import { formatHebDate } from '../utils/date';

export default function SettingsScreen({ navigation }) {
  const { state, setStageDate, updateSettings } = useApp();
  const [editStage, setEditStage] = useState(null);

  if (!state) return null;
  const { settings } = state;

  const back = (
    <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
      <Ionicons name="chevron-forward" size={28} color={colors.cream} />
    </Pressable>
  );

  const changeHour = (delta) => {
    let h = settings.reminderHour + delta;
    if (h < 0) h = 23;
    if (h > 23) h = 0;
    updateSettings({ reminderHour: h });
  };

  return (
    <Screen title="הגדרות" subtitle="תאריכי השלבים והתראות" headerRight={back}>
      {/* תאריכי השלבים */}
      <Text style={styles.sectionTitle}>תאריכי השלבים</Text>
      <Text style={styles.sectionSub}>
        עדכן תאריך אמיתי ברגע שהוא נודע (למשל אחרי הרשמה רשמית). ברגע שתאריך הוזן, מסך הבית עובר לספירת ימים מדויקת.
      </Text>

      {state.stages.map((stage) => (
        <Pressable key={stage.id} onPress={() => setEditStage(stage)}>
          <Card style={styles.stageRow}>
            <View style={styles.stageIcon}>
              <Ionicons name={stage.icon} size={20} color={colors.gold} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stageName}>{stage.name}</Text>
              <Text style={[styles.stageDate, stage.date && styles.stageDateSet]}>
                {stage.date ? formatHebDate(stage.date) : `${stage.defaultLabel} (משוער)`}
              </Text>
            </View>
            <Ionicons name="create-outline" size={22} color={colors.creamDim} />
          </Card>
        </Pressable>
      ))}

      {/* התראות */}
      <Text style={styles.sectionTitle}>התראות</Text>
      <Card>
        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.switchTitle}>תזכורות אימון</Text>
            <Text style={styles.switchSub}>תזכורת בימי האימון אם עדיין לא סימנת אימון</Text>
          </View>
          <Switch
            value={settings.notificationsEnabled}
            onValueChange={(v) => updateSettings({ notificationsEnabled: v })}
            trackColor={{ true: colors.goldDim, false: colors.line }}
            thumbColor={settings.notificationsEnabled ? colors.gold : colors.creamDim}
          />
        </View>

        {settings.notificationsEnabled && (
          <View style={styles.hourRow}>
            <Text style={styles.hourLabel}>שעת התזכורת</Text>
            <View style={styles.hourAdjust}>
              <Pressable onPress={() => changeHour(-1)} hitSlop={8} style={styles.adjBtn}>
                <Ionicons name="remove" size={18} color={colors.bg} />
              </Pressable>
              <Text style={styles.hourValue}>
                {String(settings.reminderHour).padStart(2, '0')}:00
              </Text>
              <Pressable onPress={() => changeHour(1)} hitSlop={8} style={styles.adjBtn}>
                <Ionicons name="add" size={18} color={colors.bg} />
              </Pressable>
            </View>
          </View>
        )}
      </Card>

      <Text style={styles.footnote}>
        כל הנתונים נשמרים מקומית על המכשיר שלך בלבד — בלי חשבון ובלי שרת.
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

const styles = StyleSheet.create({
  sectionTitle: { color: colors.cream, fontSize: font.h3, fontWeight: '700', marginTop: spacing.md, textAlign: 'right' },
  sectionSub: { color: colors.creamDim, fontSize: font.small, textAlign: 'right', marginTop: 4, marginBottom: spacing.md, lineHeight: 20 },
  stageRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.md },
  stageIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.bgDeep, alignItems: 'center', justifyContent: 'center' },
  stageName: { color: colors.cream, fontSize: font.body, fontWeight: '700', textAlign: 'right' },
  stageDate: { color: colors.creamDim, fontSize: font.small, textAlign: 'right', marginTop: 2 },
  stageDateSet: { color: colors.gold, fontWeight: '700' },
  switchRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.md },
  switchTitle: { color: colors.cream, fontSize: font.body, fontWeight: '700', textAlign: 'right' },
  switchSub: { color: colors.creamDim, fontSize: font.tiny, textAlign: 'right', marginTop: 2 },
  hourRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.line },
  hourLabel: { color: colors.cream, fontSize: font.body, fontWeight: '600' },
  hourAdjust: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.md },
  adjBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  hourValue: { color: colors.gold, fontSize: font.h3, fontWeight: '900', minWidth: 58, textAlign: 'center' },
  footnote: { color: colors.creamDim, fontSize: font.tiny, textAlign: 'center', marginTop: spacing.xl, lineHeight: 18 },
});
