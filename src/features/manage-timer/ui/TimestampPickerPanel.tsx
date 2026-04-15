import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, FieldError, Label, Separator, Surface, TimeField } from '@heroui/react';
import {
  type DateValue,
  CalendarDateTime,
  getLocalTimeZone,
  parseAbsoluteToLocal,
  Time,
} from '@internationalized/date';

import { MS_IN_MINUTE } from '@/shared/config';
import { useNow } from '@/shared/lib';
import { getInitialDateTime, isDateInPast, isTimeInPast, isToday } from '../lib/date';

interface Props {
  initialTargetDateTime: number | null;
  onChange: (timestamp: number) => void;
  onValidityChange: (isValid: boolean) => void;
}

export const DEFAULT_TIME_OFFSET_MINUTES = 30;

export const TimestampPickerPanel = ({
  initialTargetDateTime,
  onChange,
  onValidityChange,
}: Props) => {
  const { t } = useTranslation();

  const timeFieldRef = useRef<HTMLDivElement>(null);

  const [selectedDate, setSelectedDate] = useState(() =>
    getInitialDateTime(initialTargetDateTime, { minutes: DEFAULT_TIME_OFFSET_MINUTES }),
  );

  const nowMs = useNow();
  const nextMinuteStartMs = Math.floor((nowMs + MS_IN_MINUTE) / MS_IN_MINUTE) * MS_IN_MINUTE;
  const minZonedDateTime = parseAbsoluteToLocal(new Date(nextMinuteStartMs).toISOString());
  const today = isToday(selectedDate, minZonedDateTime);

  const minTimeValue = today
    ? new Time(minZonedDateTime.hour, minZonedDateTime.minute, 0)
    : undefined;

  const minCalendarDate = new CalendarDateTime(
    minZonedDateTime.year,
    minZonedDateTime.month,
    minZonedDateTime.day,
    0,
    0,
    0,
  );

  const timestamp = selectedDate.toDate(getLocalTimeZone()).getTime();
  const isPastDate = isDateInPast(selectedDate, minCalendarDate);
  const isPastTime = isTimeInPast(timestamp, nextMinuteStartMs);

  useEffect(() => {
    onChange(timestamp);
    onValidityChange(!isPastTime);
  }, [timestamp, isPastTime, onChange, onValidityChange]);

  const handleDateChange = (newDate: DateValue) => {
    setSelectedDate(prev => {
      return new CalendarDateTime(
        newDate.year,
        newDate.month,
        newDate.day,
        prev.hour,
        prev.minute,
        0,
      );
    });
  };

  const handleTimeChange = (newTime: Time | null) => {
    if (!newTime) {
      return;
    }

    setSelectedDate(prev => {
      return new CalendarDateTime(prev.year, prev.month, prev.day, newTime.hour, newTime.minute, 0);
    });
  };

  const handleTimeFieldLabelClick = () => {
    const firstSegment = timeFieldRef.current?.querySelector(
      'input, [role="spinbutton"], [tabindex="0"]',
    );

    if (firstSegment instanceof HTMLElement) {
      firstSegment.focus();
    }
  };

  return (
    <Surface className="flex flex-col items-center justify-center gap-4 rounded-xl border border-border/50 p-4">
      <Calendar
        value={selectedDate}
        minValue={minCalendarDate}
        isInvalid={isPastDate}
        weeksInMonth={6}
        onChange={handleDateChange}
        aria-label={t($ => $.timer.timerEditModal.timestampPicker.aria.label)}
      >
        <Calendar.Header>
          <Calendar.YearPickerTrigger>
            <Calendar.YearPickerTriggerHeading />
            <Calendar.YearPickerTriggerIndicator />
          </Calendar.YearPickerTrigger>

          <Calendar.NavButton slot="previous" />
          <Calendar.NavButton slot="next" />
        </Calendar.Header>

        <Calendar.Grid>
          <Calendar.GridHeader>
            {day => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
          </Calendar.GridHeader>

          <Calendar.GridBody>{date => <Calendar.Cell date={date} />}</Calendar.GridBody>
        </Calendar.Grid>

        <Calendar.YearPickerGrid>
          <Calendar.YearPickerGridBody>
            {({ year }) => <Calendar.YearPickerCell year={year} />}
          </Calendar.YearPickerGridBody>
        </Calendar.YearPickerGrid>
      </Calendar>

      <Separator />

      <div className="flex w-full items-start justify-between gap-3">
        <Label
          className="mt-2.5 cursor-pointer text-xs tracking-wider uppercase"
          onClick={handleTimeFieldLabelClick}
        >
          {t($ => $.timer.timerEditModal.timestampPicker.label)}
        </Label>

        <TimeField
          ref={timeFieldRef}
          className="flex flex-col items-end"
          value={new Time(selectedDate.hour, selectedDate.minute, 0)}
          minValue={minTimeValue}
          isInvalid={isPastTime}
          onChange={handleTimeChange}
        >
          <TimeField.Group variant="secondary" className="min-w-28">
            <TimeField.Input className="flex w-full justify-center">
              {segment => <TimeField.Segment segment={segment} />}
            </TimeField.Input>
          </TimeField.Group>

          {(isPastDate || isPastTime) && (
            <FieldError className="pe-0">
              {t($ => $.timer.timerEditModal.errors.pastDateTime)}
            </FieldError>
          )}
        </TimeField>
      </div>
    </Surface>
  );
};
