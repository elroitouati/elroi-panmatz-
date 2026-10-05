import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Screen from '../components/Screen';
import IconButton from '../components/IconButton';
import Stepper from '../components/Stepper';
import Toggle from '../components/Toggle';
import { Section, Row } from '../components/Group';
import DateSheet from '../sheets/DateSheet';
import { colors, space } from '../design/tokens';
import { text } from '../design/typography';
import { ltr } from '../design/rtl';
import { useApp } from '../context/AppContext';
import { formatHebDate } from '../utils/date';

// ============================================================================
//  הגדרות — נפתח מלמטה כמו גיליון של iOS, ונסגר ב-X.
//  רשימות מקובצות: תאריכי שלבים, התראות.
// ============================================================================

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

  return (
    <Screen
      title="הגדרות"
      bottomInset={40}
      action={<IconButton icon="close" label="סגירה" onPress={() => navigation.goBack()} />}
    >
      <Section
        title="תאריכי השלבים"
        footer="עד שיוזן תאריך אמיתי, מסך הבית מציג את החודש המשוער — בלי ספירת ימים."
      >
        {state.stages.map((stage) => (
          <Row
            key={stage.id}
            title={stage.name}
            value={stage.date ? ltr(formatHebDate(stage.date)) : `${stage.defaultLabel} · משוער`}
            valueStyle={stage.date ? styles.gold : null}
            chevron
            onPress={() => setEditStage(stage)}
            accessibilityLabel={`עריכת תאריך ל${stage.name}`}
          />
        ))}
      </Section>

      <Section title="התראות" footer="התזכורת נשלחת רק בימי האימון שהגדרת.">
        <Row
          title="תזכורת אימון"
          trailing={
            <Toggle
              value={settings.notificationsEnabled}
              onValueChange={(v) => updateSettings({ notificationsEnabled: v })}
              label="תזכורת אימון"
            />
          }
        />
        {settings.notificationsEnabled ? (
          <Row
            title="שעה"
            trailing={
              <View style={styles.hourRow}>
                <Text style={[text.value, styles.hour]}>
                  {ltr(`${String(settings.reminderHour).padStart(2, '0')}:00`)}
                </Text>
                <Stepper
                  size="sm"
                  onPlus={() => changeHour(1)}
                  onMinus={() => changeHour(-1)}
                  plusLabel="שעה מאוחרת יותר"
                  minusLabel="שעה מוקדמת יותר"
                />
              </View>
            }
          />
        ) : null}
      </Section>

      <Text style={[text.caption, styles.footnote]}>
        הנתונים נשמרים על המכשיר הזה בלבד. אין חשבון ואין שרת.
      </Text>

      <DateSheet
        stage={editStage}
        onClose={() => setEditStage(null)}
        onSave={(key) => setStageDate(editStage.id, key)}
        onClear={() => setStageDate(editStage.id, null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  gold: { color: colors.gold },
  hourRow: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  hour: { minWidth: 52, textAlign: 'center' },
  footnote: { textAlign: 'center', marginTop: space[6] },
});
