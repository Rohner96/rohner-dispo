import { WorkflowStep } from '../domain/models';

export const workflowLabels: Record<WorkflowStep, string> = {
  zugeteilt: 'Auftrag zugeteilt',
  angenommen: 'Auftrag angenommen',
  beladung_gestartet: 'Beladung begonnen',
  beladung_beendet: 'Beladung beendet',
  unterwegs: 'Fahrt gestartet',
  angekommen: 'Am Abladeort angekommen',
  entladung_gestartet: 'Entladung begonnen',
  entladung_beendet: 'Entladung beendet',
  abgeschlossen: 'Auftrag abgeschlossen',
};

const workflowOrder: WorkflowStep[] = [
  'zugeteilt',
  'angenommen',
  'beladung_gestartet',
  'beladung_beendet',
  'unterwegs',
  'angekommen',
  'entladung_gestartet',
  'entladung_beendet',
  'abgeschlossen',
];

export function nextWorkflowStep(current: WorkflowStep): WorkflowStep {
  const index = workflowOrder.indexOf(current);
  return workflowOrder[Math.min(index + 1, workflowOrder.length - 1)] ?? 'zugeteilt';
}

export function nextWorkflowAction(current: WorkflowStep): string {
  const next = nextWorkflowStep(current);
  const actions: Record<WorkflowStep, string> = {
    zugeteilt: 'Auftrag annehmen',
    angenommen: 'Beladung beginnen',
    beladung_gestartet: 'Beladung beenden',
    beladung_beendet: 'Fahrt starten',
    unterwegs: 'Ankunft Abladeort',
    angekommen: 'Entladung beginnen',
    entladung_gestartet: 'Entladung beenden',
    entladung_beendet: 'Auftrag abschliessen',
    abgeschlossen: 'Abgeschlossen',
  };
  return actions[current] ?? workflowLabels[next];
}

export function isWorkflowFinished(step: WorkflowStep): boolean {
  return step === 'abgeschlossen';
}
