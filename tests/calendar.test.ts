import assert from 'node:assert/strict';
import test from 'node:test';

import { calendarPeriodLabel, calendarWeekLabel, isoWeekNumber, isWeekendDate, monthDateKeys, shiftCalendarDate, startOfWeek, weekDateKeys } from '../src/lib/calendar';

test('erstellt eine Montag-bis-Sonntag-Woche', () => {
  assert.equal(startOfWeek('2026-08-13'), '2026-08-10');
  assert.deepEqual(weekDateKeys('2026-08-13'), ['2026-08-10', '2026-08-11', '2026-08-12', '2026-08-13', '2026-08-14', '2026-08-15', '2026-08-16']);
});

test('wechselt Tag, Woche und Monat vor und zurück', () => {
  assert.equal(shiftCalendarDate('2026-08-13', 'day', 1), '2026-08-14');
  assert.equal(shiftCalendarDate('2026-08-13', 'week', -1), '2026-08-06');
  assert.equal(shiftCalendarDate('2026-01-31', 'month', 1), '2026-02-28');
});

test('Monatsansicht enthält volle Kalenderwochen', () => {
  const days = monthDateKeys('2026-08-13');
  assert.equal(days[0], '2026-07-27');
  assert.equal(days.at(-1), '2026-09-06');
  assert.equal(days.length % 7, 0);
});

test('berechnet ISO-Kalenderwochen auch über den Jahreswechsel korrekt', () => {
  assert.equal(isoWeekNumber('2026-08-13'), 33);
  assert.equal(isoWeekNumber('2026-01-01'), 1);
  assert.equal(isoWeekNumber('2027-01-01'), 53);
  assert.equal(calendarWeekLabel('2026-08-13'), 'KW 33');
});

test('zeigt die Kalenderwoche in Tages- und Wochenüberschrift', () => {
  assert.match(calendarPeriodLabel('2026-08-13', 'day'), /KW 33/);
  assert.match(calendarPeriodLabel('2026-08-13', 'week'), /^KW 33/);
});

test('erkennt Samstag und Sonntag als Wochenende', () => {
  assert.equal(isWeekendDate('2026-08-14'), false);
  assert.equal(isWeekendDate('2026-08-15'), true);
  assert.equal(isWeekendDate('2026-08-16'), true);
});
