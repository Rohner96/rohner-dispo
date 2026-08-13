import assert from 'node:assert/strict';
import test from 'node:test';

import { cloudLoginEmail } from '../src/lib/cloudIdentity';

test('bildet einen Portal-Benutzernamen auf die interne Login-Adresse ab', () => {
  assert.equal(cloudLoginEmail(' Admin '), 'admin@login.rohner-app.ch');
});

test('akzeptiert alternativ eine vollständige E-Mail-Adresse', () => {
  assert.equal(cloudLoginEmail('dispo@rohner.ch'), 'dispo@rohner.ch');
});
