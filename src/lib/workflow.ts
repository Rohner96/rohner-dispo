import { WorkflowEvent, WorkflowStep } from '../domain/models';

export const workflowLabels: Record<WorkflowStep, string> = {
  zugeteilt: 'Auftrag zugeteilt',
  angenommen: 'Auftrag angenommen',
  ladeort_angekommen: 'Am Ladeort angekommen',
  beladung_gestartet: 'Beladung begonnen',
  beladung_beendet: 'Beladung beendet',
  entladeort_angekommen: 'Am Abladeort angekommen',
  entladung_gestartet: 'Entladung begonnen',
  entladung_beendet: 'Entladung beendet',
  abgeschlossen: 'Auftrag abgeschlossen',
};

const workflowOrder: WorkflowStep[] = [
  'zugeteilt',
  'angenommen',
  'ladeort_angekommen',
  'beladung_gestartet',
  'beladung_beendet',
  'entladeort_angekommen',
  'entladung_gestartet',
  'entladung_beendet',
  'abgeschlossen',
];

export function nextWorkflowStep(current: WorkflowStep): WorkflowStep {
  const index = workflowOrder.indexOf(current);
  return workflowOrder[Math.min(index + 1, workflowOrder.length - 1)] ?? 'zugeteilt';
}

export function previousWorkflowStep(current: WorkflowStep): WorkflowStep {
  const index = workflowOrder.indexOf(current);
  return workflowOrder[Math.max(index - 1, 0)] ?? 'zugeteilt';
}

export function nextWorkflowAction(current: WorkflowStep): string {
  const next = nextWorkflowStep(current);
  const actions: Record<WorkflowStep, string> = {
    zugeteilt: 'Auftrag annehmen',
    angenommen: 'Ankunft Ladeort',
    ladeort_angekommen: 'Beginn Beladung',
    beladung_gestartet: 'Beladung beenden',
    beladung_beendet: 'Ankunft Abladeort',
    entladeort_angekommen: 'Beginn Entladung',
    entladung_gestartet: 'Entladung beenden',
    entladung_beendet: 'Auftrag abschliessen',
    abgeschlossen: 'Abgeschlossen',
  };
  return actions[current] ?? workflowLabels[next];
}

export type WorkflowDurationKey =
  | 'fahrt_ladeort'
  | 'wartezeit_ladeort'
  | 'beladung'
  | 'fahrt_abladeort'
  | 'wartezeit_abladeort'
  | 'entladung'
  | 'gesamt';

export type WorkflowDurations = Record<WorkflowDurationKey, number>;

const durationRanges: Record<Exclude<WorkflowDurationKey, 'gesamt'>, [WorkflowStep, WorkflowStep]> = {
  fahrt_ladeort: ['angenommen', 'ladeort_angekommen'],
  wartezeit_ladeort: ['ladeort_angekommen', 'beladung_gestartet'],
  beladung: ['beladung_gestartet', 'beladung_beendet'],
  fahrt_abladeort: ['beladung_beendet', 'entladeort_angekommen'],
  wartezeit_abladeort: ['entladeort_angekommen', 'entladung_gestartet'],
  entladung: ['entladung_gestartet', 'entladung_beendet'],
};

function eventTime(events: WorkflowEvent[], step: WorkflowStep): number | undefined {
  const event = events.find((item) => item.step === step);
  if (!event) return undefined;
  const value = new Date(event.at).getTime();
  return Number.isFinite(value) ? value : undefined;
}

export function calculateWorkflowDurations(
  events: WorkflowEvent[],
  currentStep: WorkflowStep,
  now = new Date(),
): WorkflowDurations {
  const nowTime = now.getTime();
  const currentIndex = workflowOrder.indexOf(currentStep);
  const result: WorkflowDurations = {
    fahrt_ladeort: 0,
    wartezeit_ladeort: 0,
    beladung: 0,
    fahrt_abladeort: 0,
    wartezeit_abladeort: 0,
    entladung: 0,
    gesamt: 0,
  };

  for (const [key, [startStep, endStep]] of Object.entries(durationRanges) as [Exclude<WorkflowDurationKey, 'gesamt'>, [WorkflowStep, WorkflowStep]][]) {
    const start = eventTime(events, startStep);
    if (start === undefined) continue;
    const end = eventTime(events, endStep);
    const startIndex = workflowOrder.indexOf(startStep);
    const effectiveEnd = end ?? (currentIndex === startIndex ? nowTime : start);
    result[key] = Math.max(0, effectiveEnd - start);
  }

  const acceptedAt = eventTime(events, 'angenommen');
  if (acceptedAt !== undefined) {
    const completedAt = eventTime(events, 'abgeschlossen');
    result.gesamt = Math.max(0, (completedAt ?? nowTime) - acceptedAt);
  }
  return result;
}

export function rollbackWorkflow(events: WorkflowEvent[], currentStep: WorkflowStep): {
  step: WorkflowStep;
  events: WorkflowEvent[];
} {
  if (currentStep === 'zugeteilt') return { step: currentStep, events };
  const step = previousWorkflowStep(currentStep);
  const lastCurrentIndex = events.map((event) => event.step).lastIndexOf(currentStep);
  if (lastCurrentIndex < 0) return { step, events };
  return {
    step,
    events: events.filter((_event, index) => index !== lastCurrentIndex),
  };
}

export function mapTargetForStep(step: WorkflowStep): 'pickup' | 'delivery' | undefined {
  if (step === 'angenommen') return 'pickup';
  if (step === 'beladung_beendet') return 'delivery';
  return undefined;
}

export function isWorkflowFinished(step: WorkflowStep): boolean {
  return step === 'abgeschlossen';
}
