export type CalendarMode = 'day' | 'week' | 'month' | 'list';

function parseDateKey(key: string): Date {
  const [year = 1970, month = 1, day = 1] = key.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(key: string, days: number): string {
  const date = parseDateKey(key);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

export function startOfWeek(key: string): string {
  const date = parseDateKey(key);
  const day = date.getDay() || 7;
  date.setDate(date.getDate() - day + 1);
  return toDateKey(date);
}

export function weekDateKeys(key: string): string[] {
  const monday = startOfWeek(key);
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}

export function isoWeekNumber(key: string): number {
  const localDate = parseDateKey(key);
  const date = new Date(Date.UTC(localDate.getFullYear(), localDate.getMonth(), localDate.getDate()));
  const weekday = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - weekday);
  const firstDayOfWeekYear = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date.getTime() - firstDayOfWeekYear.getTime()) / 86_400_000) + 1) / 7);
}

export function calendarWeekLabel(key: string): string {
  return `KW ${isoWeekNumber(key)}`;
}

export function isWeekendDate(key: string): boolean {
  const weekday = parseDateKey(key).getDay();
  return weekday === 0 || weekday === 6;
}

export function monthDateKeys(key: string): string[] {
  const anchor = parseDateKey(key);
  const first = toDateKey(new Date(anchor.getFullYear(), anchor.getMonth(), 1, 12));
  const start = startOfWeek(first);
  const last = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0, 12);
  const lastDay = last.getDay() || 7;
  const end = addDays(toDateKey(last), 7 - lastDay);
  const result: string[] = [];
  for (let current = start; current <= end; current = addDays(current, 1)) result.push(current);
  return result;
}

export function shiftCalendarDate(key: string, mode: CalendarMode, direction: -1 | 1): string {
  if (mode === 'day') return addDays(key, direction);
  if (mode === 'week') return addDays(key, direction * 7);
  if (mode === 'month') {
    const date = parseDateKey(key);
    const desiredDay = date.getDate();
    const targetMonth = date.getMonth() + direction;
    const lastTargetDay = new Date(date.getFullYear(), targetMonth + 1, 0, 12).getDate();
    return toDateKey(new Date(date.getFullYear(), targetMonth, Math.min(desiredDay, lastTargetDay), 12));
  }
  return key;
}

export function calendarPeriodLabel(key: string, mode: CalendarMode): string {
  const date = parseDateKey(key);
  if (mode === 'day') return `${new Intl.DateTimeFormat('de-CH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(date)} · ${calendarWeekLabel(key)}`;
  if (mode === 'week') {
    const days = weekDateKeys(key);
    const start = parseDateKey(days[0]!);
    const end = parseDateKey(days[6]!);
    const startLabel = new Intl.DateTimeFormat('de-CH', { day: 'numeric', month: 'short' }).format(start);
    const endLabel = new Intl.DateTimeFormat('de-CH', { day: 'numeric', month: 'short', year: 'numeric' }).format(end);
    return `${calendarWeekLabel(key)} · ${startLabel} – ${endLabel}`;
  }
  if (mode === 'month') return new Intl.DateTimeFormat('de-CH', { month: 'long', year: 'numeric' }).format(date);
  return 'Alle Einträge';
}

export function dayLabel(key: string): string {
  return new Intl.DateTimeFormat('de-CH', { weekday: 'short', day: 'numeric', month: 'numeric' }).format(parseDateKey(key));
}
