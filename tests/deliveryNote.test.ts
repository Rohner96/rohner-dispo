import assert from 'node:assert/strict';
import test from 'node:test';

import { initialOrders, projects, drivers, vehicles } from '../src/data/demoData';
import { buildDeliveryNoteData, formatDuration } from '../src/lib/deliveryNote';

test('formatiert Zeitspannen als Stunden und Minuten', () => {
  assert.equal(formatDuration(95 * 60 * 1000), '01:35 h');
});

test('erstellt strukturierte Lieferscheindaten', () => {
  const order = initialOrders[0]!;
  const data = buildDeliveryNoteData(
    order,
    projects.find((item) => item.id === order.projectId),
    drivers.find((item) => item.id === order.driverId),
    vehicles.find((item) => item.id === order.vehicleId),
  );
  assert.match(data.fileName, /^Lieferschein-A-2026-001\.pdf$/);
  assert.equal(data.customer, 'Greuter AG');
  assert.ok(data.rows.some((row) => row.label === 'Wartezeit Ladeort'));
});
