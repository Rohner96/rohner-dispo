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
  | 'ladeort_angekommen'
  | 'beladung_gestartet'
  | 'beladung_beendet'
  | 'entladeort_angekommen'
  | 'entladung_gestartet'
  | 'entladung_beendet'
  | 'abgeschlossen';

export interface WorkflowEvent {
  step: WorkflowStep;
  at: string;
}

export type AbsenceType = 'ferien' | 'kompensation' | 'krank' | 'unfall';

export type VehicleCategory = 'sattelschlepper' | 'kipper' | 'silo' | 'fahrmischer';
export type VehicleAxleConfiguration = '2-achs' | '3-achs' | '4-achs' | '5-achs';
export type CraneCapacity = 22 | 23 | 30 | 54;
export type TrailerCategory = 'kippsattel' | 'semi_tieflader_ohne_kran' | 'semi_tieflader_mit_kran';

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
  category: VehicleCategory;
  axleConfiguration: VehicleAxleConfiguration;
  hasCrane: boolean;
  craneCapacity?: CraneCapacity;
  active: boolean;
}

export interface Trailer {
  id: string;
  internalNumber: string;
  label: string;
  category: TrailerCategory;
  active: boolean;
}

export interface Driver {
  id: string;
  personnelNumber?: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  function?: string;
  employmentStart?: string;
  employmentPercentage?: number;
  notes?: string;
  defaultVehicleId?: string;
  defaultTrailerId?: string;
  active: boolean;
}

export interface Customer {
  id: string;
  customerNumber: string;
  name: string;
  address?: string;
  contacts: CustomerContact[];
  active: boolean;
}

export interface CustomerContact {
  id: string;
  name: string;
  function?: string;
  phone?: string;
  email?: string;
}

export interface Project {
  id: string;
  customerId: string;
  customerName: string;
  projectNumber?: string;
  name: string;
  description?: string;
  active: boolean;
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
  pickupMapUrl?: string;
  delivery: string;
  deliveryMapUrl?: string;
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

export type RepairCategory = 'unfallschaden' | 'technischer_defekt' | 'verschleiss';

export type RepairPriority = 'normal' | 'dringend' | 'fahrzeug_stilllegen';

export type RepairStatus =
  | 'gemeldet'
  | 'termin_organisiert'
  | 'in_reparatur'
  | 'erledigt';

export interface RepairEvent {
  status: RepairStatus;
  at: string;
  byUserId: string;
  note?: string;
}

export interface RepairCase {
  id: string;
  caseNumber: string;
  vehicleId: string;
  reportedByUserId: string;
  reportedByName: string;
  category: RepairCategory;
  priority: RepairPriority;
  title: string;
  description: string;
  photoUri?: string;
  reportedAt: string;
  status: RepairStatus;
  workshopName?: string;
  workshopDate?: string;
  workshopTime?: string;
  adminNote?: string;
  events: RepairEvent[];
}
