import assert from 'node:assert/strict';
import test from 'node:test';

import { activeOnly, toggleActive } from '../src/lib/masterData';

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

