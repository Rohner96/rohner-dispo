import assert from 'node:assert/strict';
import test from 'node:test';

import { activeOnly, axleConfigurationsForVehicle, defaultAssignmentForDriver, driverNameParts, projectsForCustomer, sortCustomersByCustomerNumber, sortDriversByLastName, sortTrailersByInternalNumber, sortVehiclesByInternalNumber, toggleActive, vehicleCategoryHasSelectableAxles, vehicleCategorySupportsBodyTypes, vehicleCategorySupportsCrane } from '../src/lib/masterData';
import { Customer, Driver, Trailer, Vehicle } from '../src/domain/models';

const records = [
  { id: '1', name: 'Aktiv', active: true },
  { id: '2', name: 'Inaktiv', active: false },
];

test('zeigt in Auswahlfeldern nur aktive Stammdaten', () => {
  assert.deepEqual(activeOnly(records).map((item) => item.id), ['1']);
});

test('deaktiviert Stammdaten ohne sie zu löschen', () => {
  const changed = toggleActive(records, '1');
  assert.equal(changed.length, 2);
  assert.equal(changed[0]?.active, false);
});

test('zeigt beim Auftrag nur aktive Projekte des gewählten Kunden', () => {
  const projects = [
    { id: 'p1', customerId: 'c1', active: true },
    { id: 'p2', customerId: 'c1', active: false },
    { id: 'p3', customerId: 'c2', active: true },
  ];
  assert.deepEqual(projectsForCustomer(projects, 'c1').map((item) => item.id), ['p1']);
});

test('übernimmt das Standardgespann des gewählten Chauffeurs', () => {
  assert.deepEqual(defaultAssignmentForDriver({ defaultVehicleId: 'v2', defaultTrailerId: 't1' }), { vehicleId: 'v2', trailerId: 't1' });
  assert.deepEqual(defaultAssignmentForDriver(undefined), { vehicleId: undefined, trailerId: undefined });
});

test('zeigt passende Achsausführungen abhängig von der Fahrzeugart', () => {
  assert.deepEqual(axleConfigurationsForVehicle('sattelschlepper'), ['2-achs', '3-achs']);
  assert.deepEqual(axleConfigurationsForVehicle('kipper'), ['3-achs', '4-achs', '5-achs']);
  assert.deepEqual(axleConfigurationsForVehicle('silo'), ['3-achs', '4-achs', '5-achs']);
  assert.deepEqual(axleConfigurationsForVehicle('fahrmischer'), ['3-achs', '4-achs', '5-achs']);
  assert.deepEqual(axleConfigurationsForVehicle('wechselsystem'), ['5-achs']);
});

test('bietet die Kranauswahl nur für Sattelschlepper an', () => {
  assert.equal(vehicleCategorySupportsCrane('sattelschlepper'), true);
  assert.equal(vehicleCategorySupportsCrane('kipper'), false);
  assert.equal(vehicleCategorySupportsCrane('silo'), false);
  assert.equal(vehicleCategorySupportsCrane('fahrmischer'), false);
  assert.equal(vehicleCategorySupportsCrane('wechselsystem'), false);
});

test('führt Wechselsystem fest als 5-Achs und mit auswählbaren Aufbauarten', () => {
  assert.equal(vehicleCategoryHasSelectableAxles('wechselsystem'), false);
  assert.equal(vehicleCategorySupportsBodyTypes('wechselsystem'), true);
  assert.equal(vehicleCategorySupportsBodyTypes('sattelschlepper'), false);
});

test('übernimmt getrennte Namen und teilt bestehende Anzeigenamen kompatibel auf', () => {
  assert.deepEqual(driverNameParts({ name: 'Sven Rohner', firstName: 'Sven', lastName: 'Rohner' }), { firstName: 'Sven', lastName: 'Rohner' });
  assert.deepEqual(driverNameParts({ name: 'Marcel Muster' }), { firstName: 'Marcel', lastName: 'Muster' });
});

test('sortiert Mitarbeiter alphabetisch nach Nachnamen', () => {
  const drivers = [
    { id: '1', name: 'Sven Rohner', active: true },
    { id: '2', name: 'André Beispiel', active: true },
    { id: '3', name: 'Marcel Muster', active: true },
  ] as Driver[];
  assert.deepEqual(sortDriversByLastName(drivers).map((driver) => driver.name), ['André Beispiel', 'Marcel Muster', 'Sven Rohner']);
});

test('sortiert LKW natürlich nach der LKW-Nummer', () => {
  const vehicles = [
    { id: '1', internalNumber: 'WG 10' },
    { id: '2', internalNumber: 'WG 02' },
    { id: '3', internalNumber: 'WG 01' },
  ] as Vehicle[];
  assert.deepEqual(sortVehiclesByInternalNumber(vehicles).map((vehicle) => vehicle.internalNumber), ['WG 01', 'WG 02', 'WG 10']);
});

test('sortiert Anhänger natürlich nach der Anhängernummer', () => {
  const trailers = [
    { id: '1', internalNumber: 'A100' },
    { id: '2', internalNumber: 'A32' },
    { id: '3', internalNumber: 'A30' },
    { id: '4', internalNumber: 'A31' },
  ] as Trailer[];
  assert.deepEqual(sortTrailersByInternalNumber(trailers).map((trailer) => trailer.internalNumber), ['A30', 'A31', 'A32', 'A100']);
});

test('sortiert Kunden von der kleinsten zur grössten Kundennummer', () => {
  const customers = [
    { id: '1', customerNumber: '100', name: 'Hundert' },
    { id: '2', customerNumber: '9', name: 'Neun' },
    { id: '3', customerNumber: '20', name: 'Zwanzig' },
  ] as Customer[];
  assert.deepEqual(sortCustomersByCustomerNumber(customers).map((customer) => customer.customerNumber), ['9', '20', '100']);
});
