export function activeOnly<T extends { active: boolean }>(items: T[]): T[] {
  return items.filter((item) => item.active);
}

export function toggleActive<T extends { id: string; active: boolean }>(items: T[], id: string): T[] {
  return items.map((item) => item.id === id ? { ...item, active: !item.active } : item);
}

export function projectsForCustomer<T extends { customerId: string; active: boolean }>(items: T[], customerId: string): T[] {
  return items.filter((item) => item.customerId === customerId && item.active);
}
