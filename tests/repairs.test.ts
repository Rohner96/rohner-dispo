import assert from 'node:assert/strict';
import test from 'node:test';

import { initialRepairCases } from '../src/data/demoData';
import { activeRepairsForEmployee, canChangeRepairStatus, workshopRepairsOnDate } from '../src/lib/repairs';

test('zeigt dem Mitarbeiter nur eigene offene Reparaturfälle', () => {
  const own = activeRepairsForEmployee(initialRepairCases, 'u-rene');
  assert.equal(own.length, 1);
  assert.equal(own[0]?.reportedByUserId, 'u-rene');
});

test('übernimmt organisierte Werkstatttermine in den Kalender', () => {
  const calendarEntries = workshopRepairsOnDate(initialRepairCases, '2026-08-13');
  assert.equal(calendarEntries.length, 1);
  assert.equal(calendarEntries[0]?.workshopName, 'Nutzfahrzeug-Center Baden');
});

test('verhindert das Zurücksetzen eines Reparaturstatus', () => {
  assert.equal(canChangeRepairStatus('termin_organisiert', 'gemeldet'), false);
  assert.equal(canChangeRepairStatus('in_reparatur', 'erledigt'), true);
});
