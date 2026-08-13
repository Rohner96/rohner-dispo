import assert from 'node:assert/strict';
import test from 'node:test';

import { initialOrders } from '../src/data/demoData';
import { shiftOrderByDays, shiftOrderByHours } from '../src/lib/orderScheduling';

test('verschiebt einen Auftrag stundenweise', () => {
  const order = initialOrders[0]!;
  const shifted = shiftOrderByHours(order, 1);
  assert.equal(shifted.timeWindow, '08:00–17:00');
  assert.equal(shifted.date, order.date);
});

test('verschiebt bei Überschreiten von Mitternacht auch das Datum', () => {
  const order = { ...initialOrders[0]!, date: '2026-08-13', timeWindow: '23:00–23:30' };
  const shifted = shiftOrderByHours(order, 1);
  assert.equal(shifted.timeWindow, '00:00–00:30');
  assert.equal(shifted.date, '2026-08-14');
});

test('verschiebt einen Auftrag tageweise', () => {
  assert.equal(shiftOrderByDays(initialOrders[0]!, -1).date, '2026-08-10');
});
