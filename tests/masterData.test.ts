import assert from 'node:assert/strict';
import test from 'node:test';

import { activeOnly, projectsForCustomer, toggleActive } from '../src/lib/masterData';

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
