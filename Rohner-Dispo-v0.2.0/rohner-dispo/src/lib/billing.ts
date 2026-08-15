import { BillingCandidate, Project, TransportOrder } from '../domain/models';

const billableStatuses = new Set(['abgeschlossen', 'kontrolliert', 'verrechenbar']);

export function calculateOrderAmount(order: TransportOrder): number | undefined {
  if (order.billingMode === 'pauschal') return order.rate;
  if (order.billingMode === 'kombiniert') return undefined;
  if (order.quantity === undefined || order.rate === undefined) return undefined;
  return Math.round(order.quantity * order.rate * 100) / 100;
}

export function buildBillingPool(
  orders: TransportOrder[],
  projects: Project[],
): BillingCandidate[] {
  return orders
    .filter((order) => billableStatuses.has(order.status))
    .map((order) => {
      const project = projects.find((item) => item.id === order.projectId);
      if (!project) throw new Error(`Projekt ${order.projectId} fehlt.`);
      return { order, project, amount: calculateOrderAmount(order) };
    });
}

export function formatChf(value?: number): string {
  if (value === undefined) return 'Preis prüfen';
  return `CHF ${value.toFixed(2)}`;
}
