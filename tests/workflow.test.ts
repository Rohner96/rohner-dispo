import assert from 'node:assert/strict';
import test from 'node:test';

import {
  calculateWorkflowDurations,
  isWorkflowFinished,
  mapTargetForStep,
  nextWorkflowAction,
  nextWorkflowStep,
  rollbackWorkflow,
} from '../src/lib/workflow';

test('führt den Chauffeur in der richtigen Reihenfolge', () => {
  assert.equal(nextWorkflowStep('zugeteilt'), 'angenommen');
  assert.equal(nextWorkflowStep('angenommen'), 'ladeort_angekommen');
  assert.equal(nextWorkflowStep('beladung_beendet'), 'entladeort_angekommen');
  assert.equal(nextWorkflowStep('entladung_beendet'), 'abgeschlossen');
});

test('zeigt die nächste verständliche Aktion', () => {
  assert.equal(nextWorkflowAction('angenommen'), 'Ankunft Ladeort');
  assert.equal(nextWorkflowAction('ladeort_angekommen'), 'Beginn Beladung');
  assert.equal(nextWorkflowAction('entladeort_angekommen'), 'Beginn Entladung');
});

test('erkennt abgeschlossenen Auftrag', () => {
  assert.equal(isWorkflowFinished('abgeschlossen'), true);
  assert.equal(isWorkflowFinished('beladung_beendet'), false);
});

test('berechnet Fahrt, Wartezeit und Beladung separat', () => {
  const events = [
    { step: 'angenommen' as const, at: '2026-08-10T08:00:00.000Z' },
    { step: 'ladeort_angekommen' as const, at: '2026-08-10T08:30:00.000Z' },
    { step: 'beladung_gestartet' as const, at: '2026-08-10T08:45:00.000Z' },
    { step: 'beladung_beendet' as const, at: '2026-08-10T09:15:00.000Z' },
  ];
  const durations = calculateWorkflowDurations(events, 'beladung_beendet', new Date('2026-08-10T09:25:00.000Z'));
  assert.equal(durations.fahrt_ladeort, 30 * 60 * 1000);
  assert.equal(durations.wartezeit_ladeort, 15 * 60 * 1000);
  assert.equal(durations.beladung, 30 * 60 * 1000);
  assert.equal(durations.fahrt_abladeort, 10 * 60 * 1000);
});

test('zurück entfernt den Fehlklick und lässt die vorherige Phase weiterlaufen', () => {
  const events = [
    { step: 'ladeort_angekommen' as const, at: '2026-08-10T08:30:00.000Z' },
    { step: 'beladung_gestartet' as const, at: '2026-08-10T08:45:00.000Z' },
  ];
  const corrected = rollbackWorkflow(events, 'beladung_gestartet');
  const durations = calculateWorkflowDurations(corrected.events, corrected.step, new Date('2026-08-10T08:50:00.000Z'));
  assert.equal(corrected.step, 'ladeort_angekommen');
  assert.equal(durations.wartezeit_ladeort, 20 * 60 * 1000);
});

test('zeigt Navigation nur während der Fahrt zum jeweiligen Ort', () => {
  assert.equal(mapTargetForStep('angenommen'), 'pickup');
  assert.equal(mapTargetForStep('beladung_beendet'), 'delivery');
  assert.equal(mapTargetForStep('ladeort_angekommen'), undefined);
});
