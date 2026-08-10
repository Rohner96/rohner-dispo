import assert from 'node:assert/strict';
import test from 'node:test';

import { initialOrders, projects } from '../src/data/demoData';
import { buildBillingPool, calculateOrderAmount, formatChf } from '../src/lib/billing';

test('berechnet Stundenleistung', () => {
  assert.equal(calculateOrderAmount(initialOrders[0]!), 2205);
});

test('berechnet Tonnenleistung', () => {
  assert.equal(calculateOrderAmount(initialOrders[1]!), 1674);
});

test('formatiert Schweizer Franken', () => {
  assert.equal(formatChf(1450), 'CHF 1450.00');
});

test('nimmt nur abgeschlossene Leistungen in den Verrechnungspool', () => {
  const finished = initialOrders.map((order, index) => index === 0 ? { ...order, status: 'kontrolliert' as const } : order);
  const pool = buildBillingPool(finished, projects);
  assert.equal(pool.length, 1);
  assert.equal(pool[0]!.order.orderNumber, 'A-2026-001');
});
