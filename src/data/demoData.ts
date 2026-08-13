import { Absence, Customer, Driver, Project, RepairCase, Trailer, TransportOrder, Vehicle } from '../domain/models';

export const customers: Customer[] = [
  { id: 'c1', customerNumber: '10001', name: 'Greuter AG', address: 'Zürich', contacts: [{ id: 'cp1', name: 'Martin Keller', function: 'Disposition', phone: '+41 44 000 00 01', email: 'dispo@greuter-demo.ch' }], active: true },
  { id: 'c2', customerNumber: '10002', name: 'Kibag', address: 'Baden', contacts: [{ id: 'cp2', name: 'Sandra Meier', function: 'Baustellenleitung', phone: '+41 56 000 00 02', email: 'sandra.meier@kibag-demo.ch' }], active: true },
  { id: 'c3', customerNumber: '10003', name: 'Muster Bau AG', address: 'Siglistorf', contacts: [], active: true },
];

export const drivers: Driver[] = [
  { id: 'd1', personnelNumber: 'P001', name: 'René Rohner', address: 'Siglistorf', phone: '+41 79 000 00 01', email: 'rene@rohner-demo.ch', function: 'Chauffeur', employmentStart: '2020-03-01', employmentPercentage: 100, defaultVehicleId: 'v2', active: true },
  { id: 'd2', personnelNumber: 'P002', name: 'Marcel Muster', address: 'Baden', phone: '+41 79 000 00 02', email: 'marcel@rohner-demo.ch', function: 'Chauffeur', employmentStart: '2022-08-01', employmentPercentage: 100, defaultVehicleId: 'v1', defaultTrailerId: 't1', active: true },
  { id: 'd3', personnelNumber: 'P003', name: 'André Beispiel', function: 'Chauffeur', employmentPercentage: 100, defaultVehicleId: 'v3', defaultTrailerId: 't2', active: true },
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
  { id: 'p1', customerId: 'c1', customerName: 'Greuter AG', projectNumber: '10725538', name: 'Baustelle LUWA', active: true },
  { id: 'p2', customerId: 'c2', customerName: 'Kibag', name: 'Aushub Baustelle Nord', active: true },
  { id: 'p3', customerId: 'c3', customerName: 'Muster Bau AG', name: 'Baumaschinentransport', active: true },
];

export const absences: Absence[] = [
  { id: 'a1', driverId: 'd3', type: 'ferien', from: '2026-08-10', to: '2026-08-14', note: 'Ferien' },
  { id: 'a2', driverId: 'd2', type: 'kompensation', from: '2026-08-13', to: '2026-08-13', note: 'Kompensation' },
  { id: 'a3', driverId: 'd1', type: 'unfall', from: '2026-08-14', to: '2026-08-14', note: 'Unfallabwesenheit' },
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
    pickupMapUrl: 'https://www.google.com/maps/search/?api=1&query=Baustelle+FB+Z%C3%BCrich',
    delivery: 'Industriepark Wangen',
    deliveryMapUrl: 'https://www.google.com/maps/search/?api=1&query=Industriepark+Wangen',
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
    workflowStep: 'angenommen',
    workflowEvents: [{ step: 'angenommen', at: '2026-08-10T06:30:00.000Z' }],
    projectId: 'p2',
    title: 'Aushub abführen',
    date: '2026-08-11',
    timeWindow: '06:30–17:00',
    pickup: 'Baustelle Nord',
    pickupMapUrl: 'https://www.google.com/maps/search/?api=1&query=Baustelle+Nord',
    delivery: 'Deponie',
    deliveryMapUrl: 'https://www.google.com/maps/search/?api=1&query=Deponie',
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
    pickupMapUrl: 'https://www.google.com/maps/search/?api=1&query=Werkhof+Baden',
    delivery: 'Baustelle Siglistorf',
    deliveryMapUrl: 'https://www.google.com/maps/search/?api=1&query=Baustelle+Siglistorf',
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
