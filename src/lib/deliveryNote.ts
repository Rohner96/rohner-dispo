import { jsPDF } from 'jspdf';

import { Driver, Project, Trailer, TransportOrder, Vehicle } from '../domain/models';
import { calculateWorkflowDurations, workflowLabels } from './workflow';

export interface DeliveryNoteData {
  fileName: string;
  title: string;
  customer: string;
  project: string;
  driver: string;
  vehicle: string;
  trailer: string;
  rows: { label: string; value: string }[];
  timeline: { label: string; value: string }[];
}

export function formatDuration(milliseconds: number): string {
  const totalMinutes = Math.max(0, Math.round(milliseconds / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} h`;
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function buildDeliveryNoteData(
  order: TransportOrder,
  project?: Project,
  driver?: Driver,
  vehicle?: Vehicle,
  trailer?: Trailer,
): DeliveryNoteData {
  const completedAt = order.workflowEvents.find((event) => event.step === 'abgeschlossen')?.at;
  const durations = calculateWorkflowDurations(
    order.workflowEvents,
    order.workflowStep,
    completedAt ? new Date(completedAt) : new Date(),
  );
  return {
    fileName: `Lieferschein-${order.orderNumber.replace(/[^a-z0-9-]/gi, '-')}.pdf`,
    title: `Lieferschein ${order.orderNumber}`,
    customer: project?.customerName ?? 'Kunde offen',
    project: project?.name ?? 'Projekt offen',
    driver: driver?.name ?? 'Chauffeur offen',
    vehicle: vehicle ? `${vehicle.internalNumber} - ${vehicle.label}` : 'LKW offen',
    trailer: trailer ? `${trailer.internalNumber} - ${trailer.label}` : 'Ohne Anhänger',
    rows: [
      { label: 'Auftrag', value: order.title },
      { label: 'Datum', value: order.date },
      { label: 'Ladeort', value: order.pickup },
      { label: 'Abladeort', value: order.delivery },
      { label: 'Bemerkungen', value: order.description || '-' },
      { label: 'Fahrt zum Ladeort', value: formatDuration(durations.fahrt_ladeort) },
      { label: 'Wartezeit Ladeort', value: formatDuration(durations.wartezeit_ladeort) },
      { label: 'Beladung', value: formatDuration(durations.beladung) },
      { label: 'Fahrt zum Abladeort', value: formatDuration(durations.fahrt_abladeort) },
      { label: 'Wartezeit Abladeort', value: formatDuration(durations.wartezeit_abladeort) },
      { label: 'Entladung', value: formatDuration(durations.entladung) },
      { label: 'Gesamtzeit Auftrag', value: formatDuration(durations.gesamt) },
    ],
    timeline: order.workflowEvents.map((event) => ({
      label: workflowLabels[event.step],
      value: formatDateTime(event.at),
    })),
  };
}

export function downloadDeliveryNote(data: DeliveryNoteData): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const left = 18;
  const width = 174;
  let y = 20;

  doc.setFillColor(11, 77, 39);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('ROHNER TRANSPORTE', left, 13);
  doc.setFontSize(10);
  doc.text('Kommunikationsapp', left, 20);

  y = 40;
  doc.setTextColor(20, 32, 24);
  doc.setFontSize(19);
  doc.text(data.title, left, y);
  y += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Kunde: ${data.customer}`, left, y);
  doc.text(`Projekt: ${data.project}`, 110, y);
  y += 7;
  doc.text(`Chauffeur: ${data.driver}`, left, y);
  doc.text(`LKW: ${data.vehicle}`, 110, y);
  y += 7;
  doc.text(`Anhänger: ${data.trailer}`, left, y);
  y += 10;
  doc.setDrawColor(190, 202, 193);
  doc.line(left, y, left + width, y);
  y += 7;

  for (const row of data.rows) {
    if (y > 272) {
      doc.addPage();
      y = 20;
    }
    doc.setFont('helvetica', 'bold');
    doc.text(row.label, left, y);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(row.value, 112) as string[];
    doc.text(lines, 72, y);
    y += Math.max(7, lines.length * 5);
  }

  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Zeitprotokoll', left, y);
  y += 8;
  doc.setFontSize(9);
  for (const event of data.timeline) {
    if (y > 278) {
      doc.addPage();
      y = 20;
    }
    doc.setFont('helvetica', 'normal');
    doc.text(event.label, left, y);
    doc.text(event.value, 125, y);
    y += 6;
  }

  doc.setFontSize(8);
  doc.setTextColor(95, 108, 98);
  doc.text('Automatisch erstellt durch die Rohner Kommunikationsapp.', left, 289);
  doc.save(data.fileName);
}
