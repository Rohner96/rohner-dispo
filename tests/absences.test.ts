import assert from 'node:assert/strict';
import test from 'node:test';

import { filterDrivers, isValidAbsenceRange } from '../src/lib/absences';

const drivers = [
  { id: 'd1', personnelNumber: 'P001', name: 'René Rohner', active: true },
  { id: 'd2', personnelNumber: 'P002', name: 'Marcel Muster', active: true },
];

test('filtert Mitarbeiter während der Eingabe nach Name oder Personalnummer', () => {
  assert.deepEqual(filterDrivers(drivers, 'Mar').map((item) => item.id), ['d2']);
  assert.deepEqual(filterDrivers(drivers, 'P001').map((item) => item.id), ['d1']);
});

test('prüft den Zeitraum einer Abwesenheit', () => {
  assert.equal(isValidAbsenceRange('2026-08-10', '2026-08-14'), true);
  assert.equal(isValidAbsenceRange('2026-08-14', '2026-08-10'), false);
  assert.equal(isValidAbsenceRange('14.08.2026', '2026-08-14'), false);
});
