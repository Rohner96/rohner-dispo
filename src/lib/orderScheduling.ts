import { TransportOrder } from '../domain/models';
import { addDays } from './calendar';

function formatMinutes(total: number): string {
  const normalized = ((total % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function shiftOrderByHours(order: TransportOrder, hours: number): TransportOrder {
  const match = order.timeWindow.match(/^(\d{1,2}):(\d{2})\s*[–—-]\s*(\d{1,2}):(\d{2})$/);
  if (!match) return order;
  const start = Number(match[1]) * 60 + Number(match[2]);
  const end = Number(match[3]) * 60 + Number(match[4]);
  const delta = hours * 60;
  const shiftedStart = start + delta;
  const shiftedEnd = end + delta;
  const dayDelta = Math.floor(shiftedStart / 1440);
  return {
    ...order,
    date: addDays(order.date, dayDelta),
    timeWindow: `${formatMinutes(shiftedStart)}–${formatMinutes(shiftedEnd)}`,
  };
}

export function shiftOrderByDays(order: TransportOrder, days: number): TransportOrder {
  return { ...order, date: addDays(order.date, days) };
}
