// שעות תזכורת: שעה רגילה לכל הימים, ושעה מיוחדת לימים מסוימים.
// settings.reminderByDay = { '5': { hour: 14, minute: 0 } }  (0=ראשון..6=שבת)

// השעה שבה תישלח התזכורת ביום הנתון
export function reminderFor(settings, weekday) {
  const custom = settings?.reminderByDay?.[weekday];
  if (custom) return { hour: custom.hour, minute: custom.minute ?? 0 };
  return { hour: settings?.reminderHour ?? 18, minute: settings?.reminderMinute ?? 0 };
}

export function hasCustomTime(settings, weekday) {
  return !!settings?.reminderByDay?.[weekday];
}

// הזזת שעה בדקות, עם גלישה סביב חצות (23:45 + 30 = 00:15)
export function shiftTime({ hour, minute }, deltaMinutes) {
  const total = (((hour * 60 + minute + deltaMinutes) % 1440) + 1440) % 1440;
  return { hour: Math.floor(total / 60), minute: total % 60 };
}

export function formatTime({ hour, minute }) {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}
