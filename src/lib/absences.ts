import { Driver } from '../domain/models';

export function filterDrivers(drivers: Driver[], query: string): Driver[] {
  const normalized = query.trim().toLocaleLowerCase('de-CH');
  if (!normalized) return drivers;
  return drivers.filter((driver) => `${driver.personnelNumber ?? ''} ${driver.name}`.toLocaleLowerCase('de-CH').includes(normalized));
}

export function isValidAbsenceRange(from: string, to: string): boolean {
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  return datePattern.test(from) && datePattern.test(to) && from <= to;
}
