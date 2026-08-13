import assert from 'node:assert/strict';
import test from 'node:test';

import { monthDateKeys, shiftCalendarDate, startOfWeek, weekDateKeys } from '../src/lib/calendar';

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
