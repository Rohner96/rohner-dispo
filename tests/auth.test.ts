import assert from 'node:assert/strict';
import test from 'node:test';

import { authenticateDemoUser } from '../src/auth/demoAuth';

test('meldet Administrator mit Testzugang an', () => {
  const user = authenticateDemoUser('admin', 'demo');
  assert.equal(user?.role, 'admin');
});

test('meldet Mitarbeiter mit zugehörigem Chauffeur an', () => {
  const user = authenticateDemoUser('rene', 'demo');
  assert.equal(user?.role, 'employee');
  assert.equal(user?.driverId, 'd1');
});

test('weist falsches Passwort zurück', () => {
  assert.equal(authenticateDemoUser('admin', 'falsch'), undefined);
});
