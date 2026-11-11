import { fromDate, toCalendarDate, today, type CalendarDate } from '@internationalized/date';
import { APP_LOCALE, BUSINESS_TIME_ZONE } from '@/config/app';

const dateTimeFormat = (options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(APP_LOCALE, { timeZone: BUSINESS_TIME_ZONE, ...options });

const timeFormatter = dateTimeFormat({ hour: 'numeric', minute: '2-digit' });
const shortDateFormatter = dateTimeFormat({ weekday: 'short', month: 'short', day: 'numeric' });
const longDateFormatter = dateTimeFormat({ weekday: 'long', day: 'numeric', month: 'long' });
const minutesFormatter = new Intl.NumberFormat(APP_LOCALE, { style: 'unit', unit: 'minute', unitDisplay: 'long' });
const hoursFormatter = new Intl.NumberFormat(APP_LOCALE, { style: 'unit', unit: 'hour', unitDisplay: 'long' });
const unitListFormatter = new Intl.ListFormat(APP_LOCALE, { style: 'narrow', type: 'unit' });

/** Node and browsers ship different ICU spaces (e.g. U+202F); a plain space keeps hydration stable. */
const normalizeSpaces = (text: string) => text.replace(/\s+/g, ' ');

export const formatTime = (isoString: string) =>
  normalizeSpaces(timeFormatter.formatToParts(new Date(isoString)).map(part => part.value).join(''));

export const formatTimeRange = (startTime: string, endTime: string) =>
  normalizeSpaces(timeFormatter.formatRange(new Date(startTime), new Date(endTime)));

export const formatShortDate = (isoString: string) => normalizeSpaces(shortDateFormatter.format(new Date(isoString)));

export const formatLongDate = (isoString: string) => normalizeSpaces(longDateFormatter.format(new Date(isoString)));

export function formatDuration(startTime: string, endTime: string) {
  const totalMinutes = Math.max(0, Math.round((Date.parse(endTime) - Date.parse(startTime)) / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const parts = [
    hours > 0 ? hoursFormatter.format(hours) : null,
    minutes > 0 || hours === 0 ? minutesFormatter.format(minutes) : null,
  ].filter((part): part is string => part !== null);
  return unitListFormatter.format(parts);
}

/** Calendar day of an instant in the business zone; the key shared by grouping and the date picker. */
export const getCalendarDate = (isoString: string): CalendarDate =>
  toCalendarDate(fromDate(new Date(isoString), BUSINESS_TIME_ZONE));

export const getDateKey = (isoString: string) => getCalendarDate(isoString).toString();

export const getBusinessToday = (): CalendarDate => today(BUSINESS_TIME_ZONE);
