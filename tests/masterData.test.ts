import assert from 'node:assert/strict';
import test from 'node:test';

import { activeOnly, axleConfigurationsForVehicle, defaultAssignmentForDriver, projectsForCustomer, toggleActive } from '../src/lib/masterData';

const records = [
  { id: '1', name: 'Aktiv', active: true },
  { id: '2', name: 'Inaktiv', active: false },
];

test('zeigt in Auswahlfeldern nur aktive Stammdaten', () => {
  assert.deepEqual(activeOnly(records).map((item) => item.id), ['1']);
});

test('deaktiviert Stammdaten ohne sie zu löschen', () => {
  const changed = toggleActive(records, '1');
  assert.equal(changed.length, 2);
  assert.equal(changed[0]?.active, false);
});

test('zeigt beim Auftrag nur aktive Projekte des gewählten Kunden', () => {
  const projects = [
    { id: 'p1', customerId: 'c1', active: true },
    { id: 'p2', customerId: 'c1', active: false },
    { id: 'p3', customerId: 'c2', active: true },
  ];
  assert.deepEqual(projectsForCustomer(projects, 'c1').map((item) => item.id), ['p1']);
});

test('übernimmt das Standardgespann des gewählten Chauffeurs', () => {
  assert.deepEqual(defaultAssignmentForDriver({ defaultVehicleId: 'v2', defaultTrailerId: 't1' }), { vehicleId: 'v2', trailerId: 't1' });
  assert.deepEqual(defaultAssignmentForDriver(undefined), { vehicleId: undefined, trailerId: undefined });
});

test('zeigt passende Achsausführungen abhängig von der Fahrzeugart', () => {
  assert.deepEqual(axleConfigurationsForVehicle('sattelschlepper'), ['2-achs', '3-achs']);
  assert.deepEqual(axleConfigurationsForVehicle('kipper'), ['3-achs', '4-achs', '5-achs']);
  assert.deepEqual(axleConfigurationsForVehicle('silo'), ['3-achs', '4-achs', '5-achs']);
  assert.deepEqual(axleConfigurationsForVehicle('fahrmischer'), ['3-achs', '4-achs', '5-achs']);
});
