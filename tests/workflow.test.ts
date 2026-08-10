import assert from 'node:assert/strict';
import test from 'node:test';

import { isWorkflowFinished, nextWorkflowAction, nextWorkflowStep } from '../src/lib/workflow';

test('führt den Chauffeur in der richtigen Reihenfolge', () => {
  assert.equal(nextWorkflowStep('zugeteilt'), 'angenommen');
  assert.equal(nextWorkflowStep('beladung_beendet'), 'unterwegs');
  assert.equal(nextWorkflowStep('unterwegs'), 'angekommen');
  assert.equal(nextWorkflowStep('entladung_beendet'), 'abgeschlossen');
});

test('zeigt die nächste verständliche Aktion', () => {
  assert.equal(nextWorkflowAction('angenommen'), 'Beladung beginnen');
  assert.equal(nextWorkflowAction('angekommen'), 'Entladung beginnen');
});

test('erkennt abgeschlossenen Auftrag', () => {
  assert.equal(isWorkflowFinished('abgeschlossen'), true);
  assert.equal(isWorkflowFinished('unterwegs'), false);
});
