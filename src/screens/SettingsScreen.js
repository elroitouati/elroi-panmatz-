import React, { useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import Screen from '../components/Screen';
import IconButton from '../components/IconButton';
import Toggle from '../components/Toggle';
import { Section, Row } from '../components/Group';
import DateSheet from '../sheets/DateSheet';
import TimeSheet from '../sheets/TimeSheet';
import { colors, space } from '../design/tokens';
import { text } from '../design/typography';
import { ltr } from '../design/rtl';
import { useApp } from '../context/AppContext';
import { formatHebDate, HEB_WEEKDAYS_FULL } from '../utils/date';
import { reminderFor, hasCustomTime, formatTime } from '../utils/reminders';

// ============================================================================
//  הגדרות — נפתח מלמטה כמו גיליון של iOS, ונסגר ב-X.
//  רשימות מקובצות: תאריכי שלבים, התראות, ושעת תזכורת לכל יום אימון.
// ============================================================================

export default function SettingsScreen({ navigation }) {
  const { state, setStageDate, updateSettings, setDayReminder } = useApp();
  const [editStage, setEditStage] = useState(null);
  const [editTime, setEditTime] = useState(null);
  if (!state) return null;
  const { settings } = state;

  const defaultTime = { hour: settings.reminderHour, minute: settings.reminderMinute ?? 0 };
  // ימי האימון של היעדים הפעילים — רק בהם נשלחת תזכורת
  const trainingDays = [...new Set(
    state.goals.filter((g) => g.enabled).flatMap((g) => g.trainingDays)
  )].sort((a, b) => a - b);

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

      <Section title="התראות">
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
            title="שעה רגילה"
            subtitle="לכל יום שאין לו שעה משלו"
            value={ltr(formatTime(defaultTime))}
            chevron
            onPress={() => setEditTime({
              title: 'שעה רגילה',
              subtitle: 'התזכורת תישלח בשעה הזו בכל ימי האימון',
              time: defaultTime,
              day: null,
            })}
          />
        ) : null}
      </Section>

      {settings.notificationsEnabled && trainingDays.length ? (
        <Section
          title="שעה לפי יום"
          footer="לחיצה על יום קובעת לו שעה משלו (בזהב). מופיעים רק ימי האימון — יום נוסף מוסיפים בימי האימון של היעד, במסך כושר."
        >
          {trainingDays.map((d) => {
            const custom = hasCustomTime(settings, d);
            return (
              <Row
                key={d}
                title={`יום ${HEB_WEEKDAYS_FULL[d]}`}
                value={ltr(formatTime(reminderFor(settings, d)))}
                valueStyle={custom ? styles.gold : null}
                chevron
                onPress={() => setEditTime({
                  title: `יום ${HEB_WEEKDAYS_FULL[d]}`,
                  subtitle: 'מתי להזכיר לך ביום הזה?',
                  time: reminderFor(settings, d),
                  custom,
                  day: d,
                })}
                accessibilityLabel={`שעת תזכורת ביום ${HEB_WEEKDAYS_FULL[d]}`}
              />
            );
          })}
        </Section>
      ) : null}

      <Text style={[text.caption, styles.footnote]}>
        הנתונים נשמרים על המכשיר הזה בלבד. אין חשבון ואין שרת.
      </Text>

      <TimeSheet
        target={editTime}
        onClose={() => setEditTime(null)}
        onSave={(time) => {
          if (editTime.day == null) updateSettings({ reminderHour: time.hour, reminderMinute: time.minute });
          else setDayReminder(editTime.day, time);
        }}
        onReset={() => setDayReminder(editTime.day, null)}
      />

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
  footnote: { textAlign: 'center', marginTop: space[6] },
});
