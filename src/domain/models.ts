export type UserRole = 'dispo' | 'chauffeur' | 'sekretariat';

export type OrderType =
  | 'kipper'
  | 'silo'
  | 'fahrmischer'
  | 'tieflader'
  | 'langware'
  | 'kran'
  | 'kombiniert';

export type OrderStatus =
  | 'anfrage'
  | 'provisorisch'
  | 'bestaetigt'
  | 'zugeteilt'
  | 'unterwegs'
  | 'abgeschlossen'
  | 'kontrolliert'
  | 'verrechenbar'
  | 'verrechnet';

export type BillingMode =
  | 'pauschal'
  | 'tonne'
  | 'kubikmeter'
  | 'fuhre'
  | 'stunde'
  | 'kilometer'
  | 'kombiniert';

export type WorkflowStep =
  | 'zugeteilt'
  | 'angenommen'
  | 'beladung_gestartet'
  | 'beladung_beendet'
  | 'unterwegs'
  | 'angekommen'
  | 'entladung_gestartet'
  | 'entladung_beendet'
  | 'abgeschlossen';

export interface WorkflowEvent {
  step: WorkflowStep;
  at: string;
}

export type AbsenceType = 'ferien' | 'krank' | 'kompensation' | 'urlaub';

export interface Absence {
  id: string;
  driverId: string;
  type: AbsenceType;
  from: string;
  to: string;
  note?: string;
}

export interface Vehicle {
  id: string;
  internalNumber: string;
  label: string;
  category: OrderType;
  active: boolean;
}

export interface Trailer {
  id: string;
  internalNumber: string;
  label: string;
  active: boolean;
}

export interface Driver {
  id: string;
  name: string;
  active: boolean;
}

export interface Project {
  id: string;
  customerName: string;
  projectNumber?: string;
  name: string;
}

export interface TransportOrder {
  id: string;
  orderNumber: string;
  type: OrderType;
  status: OrderStatus;
  workflowStep: WorkflowStep;
  workflowEvents: WorkflowEvent[];
  projectId: string;
  title: string;
  date: string;
  timeWindow: string;
  pickup: string;
  delivery: string;
  description: string;
  driverId?: string;
  vehicleId?: string;
  trailerId?: string;
  billingMode: BillingMode;
  quantity?: number;
  unit?: 't' | 'm3' | 'h' | 'Fuhren' | 'km';
  rate?: number;
  reportNumber?: string;
}

export interface BillingCandidate {
  order: TransportOrder;
  project: Project;
  amount?: number;
}
