import assert from 'node:assert/strict';
import test from 'node:test';
import { isAppLanguage, languageOptions, translate, translatedWorkflowAction } from '../src/lib/i18n';

test('bietet die vier gewünschten Mitarbeitersprachen an', () => {
  assert.deepEqual(languageOptions.map((option) => option.value), ['de', 'en', 'sq', 'ro']);
});

test('übersetzt Menüpunkte und Chauffeur-Aktionen', () => {
  assert.equal(translate('en', 'orders'), 'My orders');
  assert.equal(translate('sq', 'settings'), 'Cilësimet');
  assert.equal(translate('ro', 'reportRepair'), 'Raportează reparație');
  assert.equal(translatedWorkflowAction('en', 'zugeteilt'), 'Accept order');
});

test('erkennt nur unterstützte Sprachwerte', () => {
  assert.equal(isAppLanguage('de'), true);
  assert.equal(isAppLanguage('fr'), false);
  assert.equal(isAppLanguage(null), false);
});
