import { RepairCase, RepairStatus } from '../domain/models';

export const repairStatusLabels: Record<RepairStatus, string> = {
  gemeldet: 'Neu gemeldet',
  termin_organisiert: 'Werkstatttermin organisiert',
  in_reparatur: 'In Reparatur',
  erledigt: 'Reparatur erledigt',
};

const statusOrder: RepairStatus[] = [
  'gemeldet',
  'termin_organisiert',
  'in_reparatur',
  'erledigt',
];

export function canChangeRepairStatus(current: RepairStatus, next: RepairStatus): boolean {
  return statusOrder.indexOf(next) >= statusOrder.indexOf(current);
}

export function activeRepairsForEmployee(repairs: RepairCase[], userId: string): RepairCase[] {
  return repairs.filter((repair) => repair.reportedByUserId === userId && repair.status !== 'erledigt');
}

export function workshopRepairsOnDate(repairs: RepairCase[], date: string): RepairCase[] {
  return repairs.filter((repair) => repair.workshopDate === date && repair.status !== 'erledigt');
}
