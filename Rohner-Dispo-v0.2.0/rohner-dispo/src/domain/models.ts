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
