import {
  type DateTimeDuration,
  type DateValue,
  CalendarDateTime,
  getLocalTimeZone,
  now,
  parseAbsoluteToLocal,
} from '@internationalized/date';

export const getInitialDateTime = (
  timestamp: number | null,
  offset: DateTimeDuration = {},
): CalendarDateTime => {
  let dateTime = now(getLocalTimeZone()).add(offset);

  if (timestamp) {
    try {
      dateTime = parseAbsoluteToLocal(new Date(timestamp).toISOString());
    } catch {
      // Fallback
    }
  }

  return new CalendarDateTime(
    dateTime.year,
    dateTime.month,
    dateTime.day,
    dateTime.hour,
    dateTime.minute,
    0,
  );
};

export const isToday = (selectedDate: DateValue, minZonedDateTime: DateValue): boolean => {
  return (
    selectedDate.year === minZonedDateTime.year &&
    selectedDate.month === minZonedDateTime.month &&
    selectedDate.day === minZonedDateTime.day
  );
};

export const isDateInPast = (selectedDate: DateValue, minCalendarDate: DateValue): boolean => {
  if (selectedDate.year < minCalendarDate.year) {
    return true;
  }

  if (selectedDate.year > minCalendarDate.year) {
    return false;
  }

  if (selectedDate.month < minCalendarDate.month) {
    return true;
  }

  if (selectedDate.month > minCalendarDate.month) {
    return false;
  }

  return selectedDate.day < minCalendarDate.day;
};

export const isTimeInPast = (timestamp: number, nextMinuteStartMs: number): boolean => {
  return timestamp < nextMinuteStartMs;
};
