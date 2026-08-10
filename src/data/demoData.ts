import { Absence, Customer, Driver, Project, RepairCase, Trailer, TransportOrder, Vehicle } from '../domain/models';

export const customers: Customer[] = [
  { id: 'c1', customerNumber: '10001', name: 'Greuter AG', address: 'Zürich', contact: 'Disposition', active: true },
  { id: 'c2', customerNumber: '10002', name: 'Kibag', address: 'Baden', contact: 'Baustellenleitung', active: true },
  { id: 'c3', customerNumber: '10003', name: 'Muster Bau AG', address: 'Siglistorf', active: true },
];

export const drivers: Driver[] = [
  { id: 'd1', personnelNumber: 'P001', name: 'René Rohner', phone: '+41 79 000 00 01', active: true },
  { id: 'd2', personnelNumber: 'P002', name: 'Marcel Muster', phone: '+41 79 000 00 02', active: true },
  { id: 'd3', personnelNumber: 'P003', name: 'André Beispiel', active: true },
];

export const vehicles: Vehicle[] = [
  { id: 'v1', internalNumber: 'LKW 01', label: 'Kipper 5-Achser', category: 'kipper', active: true },
  { id: 'v2', internalNumber: 'LKW 07', label: 'LKW-Kran 30 m/t', category: 'kran', active: true },
  { id: 'v3', internalNumber: 'LKW 12', label: 'Sattelschlepper', category: 'tieflader', active: true },
];

export const trailers: Trailer[] = [
  { id: 't1', internalNumber: 'ANH 04', label: 'Tandem-Kippanhänger', active: true },
  { id: 't2', internalNumber: 'TL 02', label: 'Tieflader', active: true },
];

export const projects: Project[] = [
  { id: 'p1', customerId: 'c1', customerName: 'Greuter AG', projectNumber: '10725538', name: 'Baustelle LUWA' },
  { id: 'p2', customerId: 'c2', customerName: 'Kibag', name: 'Aushub Baustelle Nord' },
  { id: 'p3', customerId: 'c3', customerName: 'Muster Bau AG', name: 'Baumaschinentransport' },
];

export const absences: Absence[] = [
  { id: 'a1', driverId: 'd3', type: 'ferien', from: '2026-08-10', to: '2026-08-14', note: 'Ferien' },
  { id: 'a2', driverId: 'd2', type: 'kompensation', from: '2026-08-13', to: '2026-08-13', note: 'Kompensation' },
  { id: 'a3', driverId: 'd1', type: 'urlaub', from: '2026-08-14', to: '2026-08-14', note: 'Urlaub halber Tag' },
];

export const initialOrders: TransportOrder[] = [
  {
    id: 'o1',
    orderNumber: 'A-2026-001',
    type: 'kran',
    status: 'zugeteilt',
    workflowStep: 'zugeteilt',
    workflowEvents: [],
    projectId: 'p1',
    title: 'Leitschranken abräumen',
    date: '2026-08-11',
    timeWindow: '07:00–16:00',
    pickup: 'Baustelle FB Zürich',
    delivery: 'Industriepark Wangen',
    description: '216 m Meton und 168 m Convico abräumen.',
    driverId: 'd1',
    vehicleId: 'v2',
    billingMode: 'stunde',
    quantity: 9,
    unit: 'h',
    rate: 245,
    reportNumber: '37199',
  },
  {
    id: 'o2',
    orderNumber: 'A-2026-002',
    type: 'kipper',
    status: 'unterwegs',
    workflowStep: 'unterwegs',
    workflowEvents: [],
    projectId: 'p2',
    title: 'Aushub abführen',
    date: '2026-08-11',
    timeWindow: '06:30–17:00',
    pickup: 'Baustelle Nord',
    delivery: 'Deponie',
    description: 'Mehrfachfuhren; Zielmenge 180 t.',
    driverId: 'd2',
    vehicleId: 'v1',
    trailerId: 't1',
    billingMode: 'tonne',
    quantity: 124,
    unit: 't',
    rate: 13.5,
    reportNumber: '37204',
  },
  {
    id: 'o3',
    orderNumber: 'A-2026-003',
    type: 'tieflader',
    status: 'provisorisch',
    workflowStep: 'zugeteilt',
    workflowEvents: [],
    projectId: 'p3',
    title: 'Bagger transportieren',
    date: '2026-08-12',
    timeWindow: '08:00–11:00',
    pickup: 'Werkhof Baden',
    delivery: 'Baustelle Siglistorf',
    description: 'Maschinengewicht und Abmessungen noch bestätigen.',
    vehicleId: 'v3',
    trailerId: 't2',
    billingMode: 'pauschal',
    rate: 1450,
  },
];

export const initialRepairCases: RepairCase[] = [
  {
    id: 'r1',
    caseNumber: 'REP-2026-001',
    vehicleId: 'v2',
    reportedByUserId: 'u-rene',
    reportedByName: 'René Rohner',
    category: 'technischer_defekt',
    priority: 'dringend',
    title: 'Scheibenwischer ohne Funktion',
    description: 'Der linke Scheibenwischerarm bewegt sich nicht mehr zuverlässig.',
    reportedAt: '2026-08-10T06:45:00.000Z',
    status: 'gemeldet',
    events: [{ status: 'gemeldet', at: '2026-08-10T06:45:00.000Z', byUserId: 'u-rene' }],
  },
  {
    id: 'r2',
    caseNumber: 'REP-2026-002',
    vehicleId: 'v1',
    reportedByUserId: 'u-marcel',
    reportedByName: 'Marcel Muster',
    category: 'verschleiss',
    priority: 'normal',
    title: 'Seitenmarkierungsleuchte defekt',
    description: 'Markierungsleuchte hinten rechts funktioniert nicht mehr.',
    reportedAt: '2026-08-09T15:20:00.000Z',
    status: 'termin_organisiert',
    workshopName: 'Nutzfahrzeug-Center Baden',
    workshopDate: '2026-08-13',
    workshopTime: '09:00',
    events: [
      { status: 'gemeldet', at: '2026-08-09T15:20:00.000Z', byUserId: 'u-marcel' },
      { status: 'termin_organisiert', at: '2026-08-10T08:10:00.000Z', byUserId: 'u-admin' },
    ],
  },
];
