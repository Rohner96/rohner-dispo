import { Customer, Driver, Trailer, Vehicle, VehicleAxleConfiguration, VehicleCategory } from '../domain/models';

export function activeOnly<T extends { active: boolean }>(items: T[]): T[] {
  return items.filter((item) => item.active);
}

export function axleConfigurationsForVehicle(category: VehicleCategory): VehicleAxleConfiguration[] {
  if (category === 'sattelschlepper') return ['2-achs', '3-achs'];
  if (category === 'wechselsystem') return ['5-achs'];
  return ['3-achs', '4-achs', '5-achs'];
}

export function vehicleCategorySupportsCrane(category: VehicleCategory): boolean {
  return category === 'sattelschlepper';
}

export function vehicleCategoryHasSelectableAxles(category: VehicleCategory): boolean {
  return category !== 'wechselsystem';
}

export function vehicleCategorySupportsBodyTypes(category: VehicleCategory): boolean {
  return category === 'wechselsystem';
}

export function toggleActive<T extends { id: string; active: boolean }>(items: T[], id: string): T[] {
  return items.map((item) => item.id === id ? { ...item, active: !item.active } : item);
}

export function projectsForCustomer<T extends { customerId: string; active: boolean }>(items: T[], customerId: string): T[] {
  return items.filter((item) => item.customerId === customerId && item.active);
}

export function defaultAssignmentForDriver<T extends { defaultVehicleId?: string; defaultTrailerId?: string }>(driver?: T): { vehicleId?: string; trailerId?: string } {
  return { vehicleId: driver?.defaultVehicleId, trailerId: driver?.defaultTrailerId };
}

export function driverNameParts(driver: Pick<Driver, 'name' | 'firstName' | 'lastName'>): { firstName: string; lastName: string } {
  if (driver.firstName || driver.lastName) {
    return { firstName: driver.firstName?.trim() ?? '', lastName: driver.lastName?.trim() ?? '' };
  }
  const parts = driver.name.trim().split(/\s+/).filter(Boolean);
  const lastName = parts.length > 1 ? parts.pop()! : '';
  return { firstName: parts.join(' '), lastName };
}

export function sortDriversByLastName(drivers: Driver[]): Driver[] {
  return [...drivers].sort((left, right) => {
    const leftName = driverNameParts(left);
    const rightName = driverNameParts(right);
    const byLastName = leftName.lastName.localeCompare(rightName.lastName, 'de-CH', { sensitivity: 'base' });
    return byLastName || leftName.firstName.localeCompare(rightName.firstName, 'de-CH', { sensitivity: 'base' });
  });
}

export function sortVehiclesByInternalNumber(vehicles: Vehicle[]): Vehicle[] {
  return [...vehicles].sort((left, right) => left.internalNumber.localeCompare(right.internalNumber, 'de-CH', {
    numeric: true,
    sensitivity: 'base',
  }));
}

export function sortTrailersByInternalNumber(trailers: Trailer[]): Trailer[] {
  return [...trailers].sort((left, right) => left.internalNumber.localeCompare(right.internalNumber, 'de-CH', {
    numeric: true,
    sensitivity: 'base',
  }));
}

export function sortCustomersByCustomerNumber(customers: Customer[]): Customer[] {
  return [...customers].sort((left, right) => left.customerNumber.localeCompare(right.customerNumber, 'de-CH', {
    numeric: true,
    sensitivity: 'base',
  }));
}
