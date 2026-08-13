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

test('neu angelegter Mitarbeiter kann sich mit Testpasswort anmelden', () => {
  const user = authenticateDemoUser('neuer', 'demo', [{ id: 'u-new', username: 'neuer', displayName: 'Neuer Mitarbeiter', role: 'employee', active: true, driverId: 'd-new' }]);
  assert.equal(user?.driverId, 'd-new');
});

test('gesperrter Mitarbeiter kann sich nicht anmelden', () => {
  const user = authenticateDemoUser('gesperrt', 'demo', [{ id: 'u-off', username: 'gesperrt', displayName: 'Gesperrt', role: 'employee', active: false, driverId: 'd-off' }]);
  assert.equal(user, undefined);
});
