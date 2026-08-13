import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Image,
  Linking,
  Platform,
  useWindowDimensions,
} from 'react-native';

import { absences as initialAbsences, customers as initialCustomers, drivers as initialDrivers, initialOrders, initialRepairCases, projects as initialProjects, trailers as initialTrailers, vehicles as initialVehicles } from './src/data/demoData';
import { AppUser, authenticateDemoUser, demoUsers } from './src/auth/demoAuth';
import {
  BillingMode,
  Absence,
  AbsenceType,
  Customer,
  Driver,
  OrderType,
  Project,
  RepairCase,
  RepairCategory,
  RepairPriority,
  RepairStatus,
  Trailer,
  TransportOrder,
  Vehicle,
} from './src/domain/models';
import { MasterDataView } from './src/components/MasterDataView';
import { buildBillingPool, formatChf } from './src/lib/billing';
import {
  calculateWorkflowDurations,
  isWorkflowFinished,
  mapTargetForStep,
  nextWorkflowAction,
  nextWorkflowStep,
  rollbackWorkflow,
  workflowLabels,
} from './src/lib/workflow';
import { activeRepairsForEmployee, canChangeRepairStatus, repairStatusLabels, workshopRepairsOnDate } from './src/lib/repairs';
import { activeOnly, defaultAssignmentForDriver, projectsForCustomer } from './src/lib/masterData';
import { buildDeliveryNoteData, downloadDeliveryNote } from './src/lib/deliveryNote';
import { filterDrivers, isValidAbsenceRange } from './src/lib/absences';
import { CalendarMode, calendarPeriodLabel, dayLabel, monthDateKeys, shiftCalendarDate, toDateKey, weekDateKeys } from './src/lib/calendar';
import { shiftOrderByDays, shiftOrderByHours } from './src/lib/orderScheduling';

type Screen = 'calendar' | 'newOrder' | 'driver' | 'repairs' | 'billing' | 'masterData' | 'absences';

const typeLabels: Record<OrderType, string> = {
  kipper: 'Kipper',
  silo: 'Silowagen',
  fahrmischer: 'Fahrmischer',
  tieflader: 'Tieflader',
  langware: 'Langware',
  kran: 'LKW-Kran',
  kombiniert: 'Kombiniert',
};

const billingLabels: Record<BillingMode, string> = {
  pauschal: 'Pauschal',
  tonne: 'Pro Tonne',
  kubikmeter: 'Pro m³',
  fuhre: 'Pro Fuhre',
  stunde: 'Nach Aufwand / Stunde',
  kilometer: 'Pro Kilometer',
  kombiniert: 'Kombiniert',
};

const typeColors: Record<OrderType, string> = {
  kipper: '#D94841',
  silo: '#8B5CF6',
  fahrmischer: '#0891B2',
  tieflader: '#2563EB',
  langware: '#CA8A04',
  kran: '#15803D',
  kombiniert: '#475569',
};

function lookup<T extends { id: string }>(items: T[], id?: string): T | undefined {
  return id ? items.find((item) => item.id === id) : undefined;
}

function openMapUrl(url: string) {
  const trimmedUrl = url.trim();
  if (!trimmedUrl) return;
  const completeUrl = /^https?:\/\//i.test(trimmedUrl) ? trimmedUrl : `https://${trimmedUrl}`;
  Linking.openURL(completeUrl);
}

function orderMapUrl(order: TransportOrder, target: 'pickup' | 'delivery'): string {
  const explicitUrl = target === 'pickup' ? order.pickupMapUrl : order.deliveryMapUrl;
  if (explicitUrl?.trim()) return explicitUrl;
  const place = target === 'pickup' ? order.pickup : order.delivery;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`;
}

function saveOrderDeliveryNote(
  order: TransportOrder,
  projectsData: Project[],
  driversData: Driver[],
  vehiclesData: Vehicle[],
  trailersData: Trailer[],
) {
  downloadDeliveryNote(buildDeliveryNoteData(
    order,
    lookup(projectsData, order.projectId),
    lookup(driversData, order.driverId),
    lookup(vehiclesData, order.vehicleId),
    lookup(trailersData, order.trailerId),
  ));
}

function formatLiveDuration(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':');
}

function ChoiceRow<T extends string>({
  options,
  selected,
  onSelect,
}: {
  options: { value: T; label: string }[];
  selected: T;
  onSelect: (value: T) => void;
}) {
  return (
    <View style={styles.choices}>
      {options.map((option) => (
        <Pressable
          key={option.value}
          onPress={() => onSelect(option.value)}
          style={[styles.choice, selected === option.value && styles.choiceActive]}
        >
          <Text style={[styles.choiceText, selected === option.value && styles.choiceTextActive]}>
            {option.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function Dropdown({
  options,
  selected,
  onSelect,
  placeholder = 'Auswählen',
}: {
  options: { value: string; label: string }[];
  selected: string;
  onSelect: (value: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const selectedLabel = options.find((option) => option.value === selected)?.label;
  return (
    <View style={styles.dropdownWrap}>
      <Pressable style={styles.dropdownButton} onPress={() => setOpen((value) => !value)}>
        <Text style={[styles.dropdownText, !selectedLabel && styles.dropdownPlaceholder]}>{selectedLabel ?? placeholder}</Text>
        <Text style={styles.dropdownArrow}>{open ? '▲' : '▼'}</Text>
      </Pressable>
      {open ? (
        <View style={styles.dropdownMenu}>
          {options.map((option) => (
            <Pressable key={option.value} style={[styles.dropdownOption, option.value === selected && styles.dropdownOptionActive]} onPress={() => { onSelect(option.value); setOpen(false); }}>
              <Text style={[styles.dropdownOptionText, option.value === selected && styles.dropdownOptionTextActive]}>{option.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function DatePicker({ value, onSelect }: { value: string; onSelect: (date: string) => void }) {
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(value || toDateKey(new Date()));
  const days = monthDateKeys(visibleMonth);
  const monthPrefix = visibleMonth.slice(0, 7);
  const today = toDateKey(new Date());
  const displayValue = value ? value.split('-').reverse().join('.') : 'Datum auswählen';

  function openCalendar() {
    if (value) setVisibleMonth(value);
    setOpen((current) => !current);
  }

  return (
    <View style={styles.datePickerWrap}>
      <Pressable style={styles.datePickerButton} onPress={openCalendar}>
        <Text style={styles.datePickerButtonText}>📅 {displayValue}</Text><Text style={styles.dropdownArrow}>{open ? '▲' : '▼'}</Text>
      </Pressable>
      {open ? <View style={styles.datePickerPanel}>
        <View style={styles.datePickerHeader}>
          <Pressable style={styles.datePickerArrow} onPress={() => setVisibleMonth((date) => shiftCalendarDate(date, 'month', -1))}><Text style={styles.datePickerArrowText}>‹</Text></Pressable>
          <Text style={styles.datePickerMonth}>{calendarPeriodLabel(visibleMonth, 'month')}</Text>
          <Pressable style={styles.datePickerArrow} onPress={() => setVisibleMonth((date) => shiftCalendarDate(date, 'month', 1))}><Text style={styles.datePickerArrowText}>›</Text></Pressable>
        </View>
        <View style={styles.datePickerGrid}>{['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day) => <Text key={day} style={styles.datePickerWeekday}>{day}</Text>)}</View>
        <View style={styles.datePickerGrid}>{days.map((date) => {
          const inMonth = date.startsWith(monthPrefix);
          const selected = date === value;
          return <Pressable key={date} onPress={() => { onSelect(date); setOpen(false); }} style={[styles.datePickerDay, selected && styles.datePickerDaySelected, date === today && !selected && styles.datePickerDayToday]}><Text style={[styles.datePickerDayText, !inMonth && styles.datePickerDayOutside, selected && styles.datePickerDayTextSelected]}>{Number(date.slice(-2))}</Text></Pressable>;
        })}</View>
      </View> : null}
    </View>
  );
}

function SearchableDriverSelect({ drivers, selected, onSelect }: { drivers: Driver[]; selected: string; onSelect: (driverId: string) => void }) {
  const selectedDriver = drivers.find((driver) => driver.id === selected);
  const [query, setQuery] = useState(selectedDriver?.name ?? '');
  const [open, setOpen] = useState(false);
  const matches = filterDrivers(drivers, query);

  function select(driver: Driver) {
    onSelect(driver.id);
    setQuery(driver.name);
    setOpen(false);
  }

  return (
    <View style={styles.dropdownWrap}>
      <View style={styles.searchSelectRow}>
        <TextInput
          style={styles.searchSelectInput}
          value={query}
          onChangeText={(value) => { setQuery(value); onSelect(''); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Mitarbeiter suchen oder auswählen"
        />
        <Pressable style={styles.searchSelectButton} onPress={() => setOpen((value) => !value)}><Text style={styles.searchSelectArrow}>{open ? '▲' : '▼'}</Text></Pressable>
      </View>
      {open ? <View style={styles.dropdownMenu}>
        {matches.map((driver) => <Pressable key={driver.id} style={[styles.dropdownOption, driver.id === selected && styles.dropdownOptionActive]} onPress={() => select(driver)}><Text style={[styles.dropdownOptionText, driver.id === selected && styles.dropdownOptionTextActive]}>{driver.personnelNumber ? `${driver.personnelNumber} · ` : ''}{driver.name}</Text></Pressable>)}
        {matches.length === 0 ? <Text style={styles.noSearchResult}>Kein passender Mitarbeiter gefunden.</Text> : null}
      </View> : null}
    </View>
  );
}

function OrderCard({ order, projectsData, driversData, vehiclesData, trailersData, compact = false }: { order: TransportOrder; projectsData: Project[]; driversData: Driver[]; vehiclesData: Vehicle[]; trailersData: Trailer[]; compact?: boolean }) {
  const project = lookup(projectsData, order.projectId);
  const driver = lookup(driversData, order.driverId);
  const vehicle = lookup(vehiclesData, order.vehicleId);
  const trailer = lookup(trailersData, order.trailerId);

  return (
    <View style={[styles.card, { borderLeftColor: typeColors[order.type] }]}>
      <View style={styles.cardTopline}>
        <Text style={styles.orderNumber}>{order.orderNumber} · {typeLabels[order.type]}</Text>
        <Text style={styles.status}>{workflowLabels[order.workflowStep]}</Text>
      </View>
      <Text style={styles.cardTitle}>{order.title}</Text>
      <Text style={styles.muted}>{project?.customerName} · {project?.name}</Text>
      <Text style={styles.route}>{order.pickup} → {order.delivery}</Text>
      {!compact && (order.pickupMapUrl || order.deliveryMapUrl) ? (
        <View style={styles.locationLinks}>
          {order.pickupMapUrl ? (
            <Pressable style={styles.locationLinkButton} onPress={() => openMapUrl(order.pickupMapUrl!)}>
              <Text style={styles.locationLinkText}>📍 Ladeort in Google Maps</Text>
            </Pressable>
          ) : null}
          {order.deliveryMapUrl ? (
            <Pressable style={styles.locationLinkButton} onPress={() => openMapUrl(order.deliveryMapUrl!)}>
              <Text style={styles.locationLinkText}>📍 Abladeort in Google Maps</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      {!compact && <Text style={styles.description}>{order.description}</Text>}
      <View style={styles.tags}>
        <Text style={styles.tag}>{order.timeWindow}</Text>
        <Text style={styles.tag}>{driver?.name ?? 'Chauffeur offen'}</Text>
        <Text style={styles.tag}>{vehicle?.internalNumber ?? 'LKW offen'}</Text>
        {trailer && <Text style={styles.tag}>{trailer.internalNumber}</Text>}
      </View>
    </View>
  );
}

const absenceLabels = {
  ferien: 'Ferien',
  kompensation: 'Kompensation',
  krank: 'Krank',
  unfall: 'Unfall',
} satisfies Record<AbsenceType, string>;

type CalendarSelection = { kind: 'order' | 'absence' | 'repair'; id: string };

function CalendarDay({ date, orders, absencesData, repairs, projectsData, driversData, vehiclesData, mode, onSelect }: { date: string; orders: TransportOrder[]; absencesData: Absence[]; repairs: RepairCase[]; projectsData: Project[]; driversData: Driver[]; vehiclesData: Vehicle[]; mode: 'day' | 'week' | 'month'; onSelect: (selection: CalendarSelection) => void }) {
  const dayOrders = orders.filter((order) => order.date === date);
  const dayAbsences = absencesData.filter((absence) => date >= absence.from && date <= absence.to);
  const dayRepairs = workshopRepairsOnDate(repairs, date);
  const empty = dayOrders.length === 0 && dayAbsences.length === 0 && dayRepairs.length === 0;
  return (
    <View style={[styles.calendarColumn, mode === 'day' && styles.dayColumn, mode === 'month' && styles.monthColumn]}>
      <Text style={styles.weekDay}>{dayLabel(date)}</Text>
      {dayOrders.map((order) => {
        const driver = lookup(driversData, order.driverId);
        const project = lookup(projectsData, order.projectId);
        return <Pressable accessibilityRole="button" key={order.id} onPress={() => onSelect({ kind: 'order', id: order.id })} style={[styles.calendarOrder, styles.clickableCalendarEntry, { borderLeftColor: typeColors[order.type] }]}><Text style={styles.calendarTime}>{order.timeWindow}</Text><Text style={styles.calendarTitle}>{project?.customerName ?? order.title}</Text><Text style={styles.calendarMeta}>{driver?.name ?? 'Nicht zugeteilt'} · {typeLabels[order.type]}</Text></Pressable>;
      })}
      {dayAbsences.map((absence) => {
        const driver = lookup(driversData, absence.driverId);
        return <Pressable accessibilityRole="button" key={`${absence.id}-${date}`} onPress={() => onSelect({ kind: 'absence', id: absence.id })} style={[styles.calendarAbsence, styles.clickableCalendarEntry]}><Text style={styles.calendarTitle}>{driver?.name}</Text><Text style={styles.calendarMeta}>{absenceLabels[absence.type]}</Text></Pressable>;
      })}
      {dayRepairs.map((repair) => {
        const vehicle = lookup(vehiclesData, repair.vehicleId);
        return <Pressable accessibilityRole="button" key={`${repair.id}-${date}`} onPress={() => onSelect({ kind: 'repair', id: repair.id })} style={[styles.calendarRepair, styles.clickableCalendarEntry]}><Text style={styles.calendarTime}>{repair.workshopTime ?? 'Zeit offen'} · WERKSTATT</Text><Text style={styles.calendarTitle}>{vehicle?.internalNumber} · {repair.title}</Text><Text style={styles.calendarMeta}>{repair.workshopName ?? 'Werkstatt offen'}</Text></Pressable>;
      })}
      {empty ? <Text style={styles.calendarEmpty}>Noch frei</Text> : null}
    </View>
  );
}

function DispositionView({
  orders,
  absencesData,
  repairs,
  projectsData,
  driversData,
  vehiclesData,
  trailersData,
  onNewOrder,
  onUpdateOrder,
  onOpenAbsences,
  onOpenRepairs,
}: {
  orders: TransportOrder[];
  absencesData: Absence[];
  repairs: RepairCase[];
  projectsData: Project[];
  driversData: Driver[];
  vehiclesData: Vehicle[];
  trailersData: Trailer[];
  onNewOrder: () => void;
  onUpdateOrder: (order: TransportOrder) => void;
  onOpenAbsences: () => void;
  onOpenRepairs: () => void;
}) {
  const [calendarMode, setCalendarMode] = useState<CalendarMode>('week');
  const [anchorDate, setAnchorDate] = useState(toDateKey(new Date()));
  const [selection, setSelection] = useState<CalendarSelection>();
  const dates = [...new Set(orders.map((order) => order.date))].sort();
  const visibleDates = calendarMode === 'day' ? [anchorDate] : calendarMode === 'week' ? weekDateKeys(anchorDate) : calendarMode === 'month' ? monthDateKeys(anchorDate) : [];
  const selectedOrder = selection?.kind === 'order' ? lookup(orders, selection.id) : undefined;
  const selectedAbsence = selection?.kind === 'absence' ? lookup(absencesData, selection.id) : undefined;
  const selectedRepair = selection?.kind === 'repair' ? lookup(repairs, selection.id) : undefined;

  function moveOrder(hoursOrDays: number, unit: 'hour' | 'day') {
    if (!selectedOrder) return;
    const shifted = unit === 'hour' ? shiftOrderByHours(selectedOrder, hoursOrDays) : shiftOrderByDays(selectedOrder, hoursOrDays);
    onUpdateOrder(shifted);
    setAnchorDate(shifted.date);
  }

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeading}>
        <View style={styles.headingBlock}>
          <Text style={styles.heading}>Kalender</Text>
        </View>
        <Pressable style={styles.primaryButton} onPress={onNewOrder}>
          <Text style={styles.primaryButtonText}>+ Auftrag</Text>
        </Pressable>
      </View>

      {selection ? <View style={styles.calendarDetail}>
        <View style={styles.calendarDetailHeader}><Text style={styles.calendarDetailTitle}>{selectedOrder ? 'Transportauftrag' : selectedAbsence ? 'Abwesenheitsmeldung' : 'Reparaturfall'}</Text><Pressable style={styles.closeDetailButton} onPress={() => setSelection(undefined)}><Text style={styles.closeDetailText}>Schliessen ×</Text></Pressable></View>
        {selectedOrder ? <>
          <OrderCard order={selectedOrder} projectsData={projectsData} driversData={driversData} vehiclesData={vehiclesData} trailersData={trailersData} />
          {calendarMode === 'day' ? <View style={styles.moveActions}><Pressable style={styles.moveButton} onPress={() => moveOrder(-1, 'hour')}><Text style={styles.moveButtonText}>− 1 Stunde</Text></Pressable><Pressable style={styles.moveButton} onPress={() => moveOrder(1, 'hour')}><Text style={styles.moveButtonText}>+ 1 Stunde</Text></Pressable></View> : null}
          {calendarMode === 'week' ? <View style={styles.moveActions}><Pressable style={styles.moveButton} onPress={() => moveOrder(-1, 'day')}><Text style={styles.moveButtonText}>← 1 Tag</Text></Pressable><Pressable style={styles.moveButton} onPress={() => moveOrder(1, 'day')}><Text style={styles.moveButtonText}>1 Tag →</Text></Pressable></View> : null}
          {calendarMode === 'month' ? <Text style={styles.calendarDetailHint}>Zum Verschieben bitte zur Tages- oder Wochenansicht wechseln.</Text> : null}
        </> : null}
        {selectedAbsence ? <><Text style={styles.cardTitle}>{lookup(driversData, selectedAbsence.driverId)?.name}</Text><Text style={styles.muted}>{absenceLabels[selectedAbsence.type]} · {selectedAbsence.from === selectedAbsence.to ? selectedAbsence.from : `${selectedAbsence.from} bis ${selectedAbsence.to}`}</Text>{selectedAbsence.note ? <Text style={styles.description}>{selectedAbsence.note}</Text> : null}<Pressable style={styles.detailLinkButton} onPress={onOpenAbsences}><Text style={styles.detailLinkText}>Abwesenheitsverwaltung öffnen</Text></Pressable></> : null}
        {selectedRepair ? <><Text style={styles.cardTitle}>{lookup(vehiclesData, selectedRepair.vehicleId)?.internalNumber} · {selectedRepair.title}</Text><Text style={styles.muted}>{selectedRepair.workshopDate} · {selectedRepair.workshopTime ?? 'Zeit offen'} · {selectedRepair.workshopName ?? 'Werkstatt offen'}</Text><Text style={styles.description}>{selectedRepair.description}</Text><Pressable style={styles.detailLinkButton} onPress={onOpenRepairs}><Text style={styles.detailLinkText}>Reparaturfall öffnen</Text></Pressable></> : null}
      </View> : null}
      <View style={styles.calendarSwitch}>
        <Pressable onPress={() => setCalendarMode('day')} style={[styles.navButton, calendarMode === 'day' && styles.navButtonActive]}>
          <Text style={[styles.navText, calendarMode === 'day' && styles.navTextActive]}>Tag</Text>
        </Pressable>
        <Pressable onPress={() => setCalendarMode('week')} style={[styles.navButton, calendarMode === 'week' && styles.navButtonActive]}>
          <Text style={[styles.navText, calendarMode === 'week' && styles.navTextActive]}>Woche</Text>
        </Pressable>
        <Pressable onPress={() => setCalendarMode('month')} style={[styles.navButton, calendarMode === 'month' && styles.navButtonActive]}>
          <Text style={[styles.navText, calendarMode === 'month' && styles.navTextActive]}>Monat</Text>
        </Pressable>
        <Pressable onPress={() => setCalendarMode('list')} style={[styles.navButton, calendarMode === 'list' && styles.navButtonActive]}>
          <Text style={[styles.navText, calendarMode === 'list' && styles.navTextActive]}>Liste</Text>
        </Pressable>
      </View>

      {calendarMode !== 'list' ? <>
        <View style={styles.calendarNavigator}>
          <Pressable accessibilityLabel="Vorheriger Zeitraum" style={styles.calendarArrow} onPress={() => setAnchorDate((date) => shiftCalendarDate(date, calendarMode, -1))}><Text style={styles.calendarArrowText}>‹</Text></Pressable>
          <Text style={styles.calendarPeriod}>{calendarPeriodLabel(anchorDate, calendarMode)}</Text>
          <Pressable accessibilityLabel="Nächster Zeitraum" style={styles.calendarArrow} onPress={() => setAnchorDate((date) => shiftCalendarDate(date, calendarMode, 1))}><Text style={styles.calendarArrowText}>›</Text></Pressable>
        </View>
        <ScrollView horizontal={calendarMode !== 'day'} showsHorizontalScrollIndicator>
          <View style={[styles.calendarBoard, calendarMode === 'month' && styles.monthBoard]}>
            {visibleDates.map((date) => <CalendarDay key={date} date={date} orders={orders} absencesData={absencesData} repairs={repairs} projectsData={projectsData} driversData={driversData} vehiclesData={vehiclesData} mode={calendarMode} onSelect={setSelection} />)}
          </View>
        </ScrollView>
      </> : (
        dates.map((date) => (
          <View key={date} style={styles.dayBlock}>
            <Text style={styles.dayTitle}>{date}</Text>
            {orders.filter((order) => order.date === date).map((order) => <Pressable key={order.id} onPress={() => setSelection({ kind: 'order', id: order.id })}><OrderCard order={order} projectsData={projectsData} driversData={driversData} vehiclesData={vehiclesData} trailersData={trailersData} compact /></Pressable>)}
          </View>
        ))
      )}
    </View>
  );
}

function AbsencesView({ absencesData, driversData, onSave, onDelete }: { absencesData: Absence[]; driversData: Driver[]; onSave: (absence: Absence) => void; onDelete: (id: string) => void }) {
  const activeDrivers = activeOnly(driversData);
  const [driverId, setDriverId] = useState('');
  const [type, setType] = useState<AbsenceType>('ferien');
  const [from, setFrom] = useState('2026-08-13');
  const [to, setTo] = useState('2026-08-13');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  function save() {
    if (!driverId) return setError('Bitte einen Mitarbeiter aus der Auswahl anklicken.');
    if (!isValidAbsenceRange(from.trim(), to.trim())) return setError('Bitte einen gültigen Zeitraum im Format JJJJ-MM-TT eingeben. Das Bis-Datum darf nicht vor dem Von-Datum liegen.');
    onSave({ id: `absence-${Date.now()}`, driverId, type, from: from.trim(), to: to.trim(), note: note.trim() || undefined });
    setDriverId('');
    setNote('');
    setError('');
  }

  const sorted = [...absencesData].sort((a, b) => b.from.localeCompare(a.from));
  return (
    <View style={styles.section}>
      <Text style={styles.eyebrow}>PERSONALPLANUNG</Text>
      <Text style={styles.heading}>Abwesenheiten</Text>
      <Text style={styles.infoBox}>Mitarbeiter über das Dropdown auswählen oder den Namen bzw. die Personalnummer eintippen. Der Eintrag erscheint nach dem Speichern direkt im Kalender.</Text>
      <View style={styles.absenceForm}>
        <Text style={styles.fieldLabel}>Mitarbeiter</Text>
        <SearchableDriverSelect drivers={activeDrivers} selected={driverId} onSelect={setDriverId} />
        <Text style={styles.fieldLabel}>Art der Abwesenheit</Text>
        <ChoiceRow options={(Object.keys(absenceLabels) as AbsenceType[]).map((value) => ({ value, label: absenceLabels[value] }))} selected={type} onSelect={setType} />
        <View style={styles.formGrid}>
          <View style={styles.formField}><Text style={styles.fieldLabel}>Von</Text><DatePicker value={from} onSelect={(value) => { setFrom(value); if (value > to) setTo(value); }} /></View>
          <View style={styles.formField}><Text style={styles.fieldLabel}>Bis</Text><DatePicker value={to} onSelect={setTo} /></View>
        </View>
        <Text style={styles.fieldLabel}>Bemerkung</Text>
        <TextInput style={[styles.input, styles.textArea]} multiline numberOfLines={3} value={note} onChangeText={setNote} placeholder="Optional, z. B. Arztzeugnis vorhanden" />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <Pressable style={styles.primaryButtonLarge} onPress={save}><Text style={styles.primaryButtonText}>Abwesenheit erfassen</Text></Pressable>
      </View>

      <Text style={styles.listHeading}>Erfasste Abwesenheiten</Text>
      {sorted.length === 0 ? <Text style={styles.empty}>Noch keine Abwesenheit erfasst.</Text> : sorted.map((absence) => {
        const driver = lookup(driversData, absence.driverId);
        return <View key={absence.id} style={styles.absenceRow}><View style={styles.billingMain}><Text style={styles.listTitle}>{driver?.name ?? 'Unbekannter Mitarbeiter'} · {absenceLabels[absence.type]}</Text><Text style={styles.muted}>{absence.from === absence.to ? absence.from : `${absence.from} bis ${absence.to}`}{absence.note ? ` · ${absence.note}` : ''}</Text></View><Pressable style={styles.deleteButton} onPress={() => onDelete(absence.id)}><Text style={styles.deleteButtonText}>Löschen</Text></Pressable></View>;
      })}
    </View>
  );
}

function OrderForm({
  customersData,
  projectsData,
  driversData,
  vehiclesData,
  trailersData,
  onSave,
  onCancel,
}: {
  customersData: Customer[];
  projectsData: Project[];
  driversData: Driver[];
  vehiclesData: Vehicle[];
  trailersData: Trailer[];
  onSave: (order: TransportOrder) => void;
  onCancel: () => void;
}) {
  const activeCustomers = activeOnly(customersData);
  const activeDrivers = activeOnly(driversData);
  const activeVehicles = activeOnly(vehiclesData);
  const activeTrailers = activeOnly(trailersData);
  const [customerId, setCustomerId] = useState(activeCustomers[0]?.id ?? '');
  const matchingProjects = projectsForCustomer(projectsData, customerId);
  const [projectId, setProjectId] = useState(matchingProjects[0]?.id ?? '');
  const [type, setType] = useState<OrderType>('kipper');
  const [billingMode, setBillingMode] = useState<BillingMode>('stunde');
  const [date, setDate] = useState('2026-08-13');
  const [timeWindow, setTimeWindow] = useState('07:00–17:00');
  const [title, setTitle] = useState('Neuer Transportauftrag');
  const [pickup, setPickup] = useState('Abholort');
  const [pickupMapUrl, setPickupMapUrl] = useState('');
  const [delivery, setDelivery] = useState('Abladeort');
  const [deliveryMapUrl, setDeliveryMapUrl] = useState('');
  const [description, setDescription] = useState('Bemerkungen zum Auftrag');
  const initialDriver = activeDrivers[0];
  const initialAssignment = defaultAssignmentForDriver(initialDriver);
  const [driverId, setDriverId] = useState(initialDriver?.id ?? '');
  const [vehicleId, setVehicleId] = useState(initialAssignment.vehicleId && activeVehicles.some((item) => item.id === initialAssignment.vehicleId) ? initialAssignment.vehicleId : activeVehicles[0]?.id ?? '');
  const [trailerId, setTrailerId] = useState(initialAssignment.trailerId && activeTrailers.some((item) => item.id === initialAssignment.trailerId) ? initialAssignment.trailerId : 'none');

  function save() {
    const number = `A-2026-${String(Date.now()).slice(-4)}`;
    onSave({
      id: `order-${Date.now()}`,
      orderNumber: number,
      type,
      status: 'zugeteilt',
      workflowStep: 'zugeteilt',
      workflowEvents: [],
      projectId,
      title: title.trim() || 'Transportauftrag',
      date: date.trim(),
      timeWindow: timeWindow.trim(),
      pickup: pickup.trim(),
      pickupMapUrl: pickupMapUrl.trim() || undefined,
      delivery: delivery.trim(),
      deliveryMapUrl: deliveryMapUrl.trim() || undefined,
      description: description.trim(),
      driverId,
      vehicleId,
      trailerId: trailerId === 'none' ? undefined : trailerId,
      billingMode,
    });
  }

  return (
    <View style={styles.section}>
      <Text style={styles.eyebrow}>NEUER TRANSPORTAUFTRAG</Text>
      <Text style={styles.heading}>Auftrag erfassen</Text>

      <Text style={styles.fieldLabel}>Kunde</Text>
      <Dropdown
        options={activeCustomers.map((customer) => ({ value: customer.id, label: `${customer.customerNumber} · ${customer.name}` }))}
        selected={customerId}
        onSelect={(value) => {
          setCustomerId(value);
          setProjectId(projectsForCustomer(projectsData, value)[0]?.id ?? '');
        }}
        placeholder="Kunde auswählen"
      />

      <Text style={styles.fieldLabel}>Projekt</Text>
      <Dropdown
        options={matchingProjects.map((project) => ({ value: project.id, label: `${project.projectNumber ? `${project.projectNumber} · ` : ''}${project.name}` }))}
        selected={projectId}
        onSelect={setProjectId}
        placeholder="Projekt auswählen"
      />

      <Text style={styles.fieldLabel}>Transportart</Text>
      <ChoiceRow
        options={(Object.keys(typeLabels) as OrderType[]).map((value) => ({ value, label: typeLabels[value] }))}
        selected={type}
        onSelect={setType}
      />

      <View style={styles.formGrid}>
        <View style={styles.formField}>
          <Text style={styles.fieldLabel}>Datum</Text>
          <DatePicker value={date} onSelect={setDate} />
        </View>
        <View style={styles.formField}>
          <Text style={styles.fieldLabel}>Zeitfenster</Text>
          <TextInput style={styles.input} value={timeWindow} onChangeText={setTimeWindow} />
        </View>
      </View>

      <Text style={styles.fieldLabel}>Kurzbezeichnung</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} />

      <View style={styles.formGrid}>
        <View style={styles.formField}>
          <Text style={styles.fieldLabel}>Ladeort / Beschreibung</Text>
          <TextInput style={styles.input} value={pickup} onChangeText={setPickup} placeholder="z. B. Werkhof, Halle 3" />
          <Text style={styles.fieldLabel}>Google-Maps-Link Ladeort</Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            style={styles.input}
            value={pickupMapUrl}
            onChangeText={setPickupMapUrl}
            placeholder="Google-Maps-Link einfügen"
          />
        </View>
        <View style={styles.formField}>
          <Text style={styles.fieldLabel}>Abladeort / Beschreibung</Text>
          <TextInput style={styles.input} value={delivery} onChangeText={setDelivery} placeholder="z. B. Baustelle, Einfahrt Süd" />
          <Text style={styles.fieldLabel}>Google-Maps-Link Abladeort</Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            style={styles.input}
            value={deliveryMapUrl}
            onChangeText={setDeliveryMapUrl}
            placeholder="Google-Maps-Link einfügen"
          />
        </View>
      </View>

      <Text style={styles.fieldLabel}>Auftrag / Bemerkungen</Text>
      <TextInput
        multiline
        numberOfLines={4}
        style={[styles.input, styles.textArea]}
        value={description}
        onChangeText={setDescription}
      />

      <Text style={styles.fieldLabel}>Chauffeur</Text>
      <Dropdown
        options={activeDrivers.map((driver) => ({ value: driver.id, label: `${driver.personnelNumber ? `${driver.personnelNumber} · ` : ''}${driver.name}` }))}
        selected={driverId}
        onSelect={(value) => {
          setDriverId(value);
          const assignment = defaultAssignmentForDriver(activeDrivers.find((driver) => driver.id === value));
          setVehicleId(assignment.vehicleId && activeVehicles.some((item) => item.id === assignment.vehicleId) ? assignment.vehicleId : activeVehicles[0]?.id ?? '');
          setTrailerId(assignment.trailerId && activeTrailers.some((item) => item.id === assignment.trailerId) ? assignment.trailerId : 'none');
        }}
      />

      <Text style={styles.fieldLabel}>LKW</Text>
      <Dropdown
        options={activeVehicles.map((vehicle) => ({
          value: vehicle.id,
          label: `${vehicle.internalNumber} · ${vehicle.label}`,
        }))}
        selected={vehicleId}
        onSelect={setVehicleId}
      />

      <Text style={styles.fieldLabel}>Anhänger / Auflieger</Text>
      <Dropdown
        options={[
          { value: 'none', label: 'Ohne Anhänger' },
          ...activeTrailers.map((trailer) => ({
            value: trailer.id,
            label: `${trailer.internalNumber} · ${trailer.label}`,
          })),
        ]}
        selected={trailerId}
        onSelect={setTrailerId}
      />

      <Text style={styles.fieldLabel}>Verrechnung</Text>
      <ChoiceRow
        options={(Object.keys(billingLabels) as BillingMode[]).map((value) => ({
          value,
          label: billingLabels[value],
        }))}
        selected={billingMode}
        onSelect={setBillingMode}
      />

      <View style={styles.formActions}>
        <Pressable style={styles.secondaryButton} onPress={onCancel}>
          <Text style={styles.secondaryButtonText}>Abbrechen</Text>
        </Pressable>
        <Pressable style={styles.primaryButtonLarge} onPress={save}>
          <Text style={styles.primaryButtonText}>Auftrag speichern</Text>
        </Pressable>
      </View>
    </View>
  );
}

function DriverView({
  orders,
  user,
  projectsData,
  driversData,
  vehiclesData,
  trailersData,
  onAdvance,
  onBack,
}: {
  orders: TransportOrder[];
  user: AppUser;
  projectsData: Project[];
  driversData: Driver[];
  vehiclesData: Vehicle[];
  trailersData: Trailer[];
  onAdvance: (id: string) => void;
  onBack: (id: string) => void;
}) {
  const [now, setNow] = useState(() => new Date());
  const [backConfirmationId, setBackConfirmationId] = useState<string>();
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const assigned = orders.filter((order) => (
    order.driverId === user.driverId && order.status !== 'verrechnet'
  ));

  return (
    <View style={styles.section}>
      <Text style={styles.eyebrow}>{user.displayName.toUpperCase()} · AKTUELLE AUFTRÄGE</Text>
      <Text style={styles.heading}>Meine Touren</Text>
      {assigned.map((order) => (
        <View key={order.id}>
          <OrderCard order={order} projectsData={projectsData} driversData={driversData} vehiclesData={vehiclesData} trailersData={trailersData} />
          {(() => {
            const mapTarget = mapTargetForStep(order.workflowStep);
            const durations = calculateWorkflowDurations(order.workflowEvents, order.workflowStep, now);
            return (
              <>
                {mapTarget ? (
                  <View style={styles.nextDestinationBox}>
                    <Text style={styles.nextDestinationEyebrow}>NÄCHSTES ZIEL</Text>
                    <Text style={styles.nextDestinationTitle}>
                      {mapTarget === 'pickup' ? order.pickup : order.delivery}
                    </Text>
                    <Pressable style={styles.mapButtonStrong} onPress={() => openMapUrl(orderMapUrl(order, mapTarget))}>
                      <Text style={styles.primaryButtonText}>
                        {mapTarget === 'pickup' ? 'Google Maps zum Ladeort' : 'Google Maps zum Abladeort'}
                      </Text>
                    </Pressable>
                  </View>
                ) : null}

                {order.workflowStep !== 'zugeteilt' ? (
                  <View style={styles.timeSummary}>
                    <Text style={styles.timeSummaryTitle}>Laufende Zeiterfassung</Text>
                    <View style={styles.timeGrid}>
                      <View style={styles.timeCell}><Text style={styles.timeLabel}>Fahrt Ladeort</Text><Text style={styles.timeValue}>{formatLiveDuration(durations.fahrt_ladeort)}</Text></View>
                      <View style={styles.timeCell}><Text style={styles.timeLabel}>Wartezeit Ladeort</Text><Text style={styles.timeValue}>{formatLiveDuration(durations.wartezeit_ladeort)}</Text></View>
                      <View style={styles.timeCell}><Text style={styles.timeLabel}>Beladung</Text><Text style={styles.timeValue}>{formatLiveDuration(durations.beladung)}</Text></View>
                      <View style={styles.timeCell}><Text style={styles.timeLabel}>Fahrt Abladeort</Text><Text style={styles.timeValue}>{formatLiveDuration(durations.fahrt_abladeort)}</Text></View>
                      <View style={styles.timeCell}><Text style={styles.timeLabel}>Wartezeit Abladeort</Text><Text style={styles.timeValue}>{formatLiveDuration(durations.wartezeit_abladeort)}</Text></View>
                      <View style={styles.timeCell}><Text style={styles.timeLabel}>Entladung</Text><Text style={styles.timeValue}>{formatLiveDuration(durations.entladung)}</Text></View>
                    </View>
                  </View>
                ) : null}
              </>
            );
          })()}
          <View style={styles.driverActions}>
            <Pressable
              disabled={isWorkflowFinished(order.workflowStep)}
              style={[styles.actionButton, isWorkflowFinished(order.workflowStep) && styles.disabledButton]}
              onPress={() => onAdvance(order.id)}
            >
              <Text style={styles.actionButtonText}>{nextWorkflowAction(order.workflowStep)}</Text>
            </Pressable>
            {order.workflowStep !== 'zugeteilt' && order.status !== 'verrechenbar' ? (
              <Pressable style={styles.backButton} onPress={() => setBackConfirmationId(order.id)}>
                <Text style={styles.backButtonText}>↶ Einen Schritt zurück</Text>
              </Pressable>
            ) : null}
          </View>
          {backConfirmationId === order.id ? (
            <View style={styles.backConfirmation}>
              <Text style={styles.backConfirmationTitle}>Letzten Schritt wirklich korrigieren?</Text>
              <Text style={styles.description}>Die Zeit läuft danach wieder in der vorherigen Phase weiter.</Text>
              <View style={styles.driverActions}>
                <Pressable style={styles.secondaryButton} onPress={() => setBackConfirmationId(undefined)}>
                  <Text style={styles.secondaryButtonText}>Abbrechen</Text>
                </Pressable>
                <Pressable style={styles.backConfirmButton} onPress={() => { onBack(order.id); setBackConfirmationId(undefined); }}>
                  <Text style={styles.primaryButtonText}>Ja, Schritt zurück</Text>
                </Pressable>
              </View>
            </View>
          ) : null}
          {isWorkflowFinished(order.workflowStep) ? (
            <Pressable style={styles.pdfButton} onPress={() => saveOrderDeliveryNote(order, projectsData, driversData, vehiclesData, trailersData)}>
              <Text style={styles.pdfButtonText}>Lieferschein als PDF herunterladen</Text>
            </Pressable>
          ) : null}
          {order.workflowEvents.length > 0 && (
            <View style={styles.timeline}>
              {order.workflowEvents.map((event, index) => (
                <View key={`${event.step}-${index}`} style={styles.timelineRow}>
                  <Text style={styles.timelineLabel}>{workflowLabels[event.step]}</Text>
                  <Text style={styles.timelineTime}>{new Date(event.at).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      ))}
      {assigned.length === 0 && <Text style={styles.empty}>Keine Aufträge zugeteilt.</Text>}
    </View>
  );
}

const repairCategoryLabels: Record<RepairCategory, string> = {
  unfallschaden: 'Unfall / äusserer Schaden',
  technischer_defekt: 'Technischer Defekt',
  verschleiss: 'Verschleiss / altersbedingt',
};

const repairPriorityLabels: Record<RepairPriority, string> = {
  normal: 'Normal',
  dringend: 'Dringend',
  fahrzeug_stilllegen: 'Fahrzeug nicht weiterfahren',
};

function RepairCard({ repair, vehiclesData, showReporter = false }: { repair: RepairCase; vehiclesData: Vehicle[]; showReporter?: boolean }) {
  const vehicle = lookup(vehiclesData, repair.vehicleId);
  return (
    <View style={styles.repairCard}>
      <View style={styles.cardTopline}>
        <Text style={styles.orderNumber}>{repair.caseNumber} · {repairCategoryLabels[repair.category]}</Text>
        <Text style={[styles.repairStatus, repair.priority === 'fahrzeug_stilllegen' && styles.repairStatusCritical]}>
          {repairStatusLabels[repair.status]}
        </Text>
      </View>
      <Text style={styles.cardTitle}>{repair.title}</Text>
      <Text style={styles.route}>{vehicle?.internalNumber} · {vehicle?.label}</Text>
      <Text style={styles.description}>{repair.description}</Text>
      {repair.photoUri ? <Image source={{ uri: repair.photoUri }} style={styles.repairPhoto} resizeMode="cover" /> : null}
      <View style={styles.tags}>
        <Text style={styles.tag}>{repairPriorityLabels[repair.priority]}</Text>
        {showReporter && <Text style={styles.tag}>Gemeldet von {repair.reportedByName}</Text>}
        <Text style={styles.tag}>{new Date(repair.reportedAt).toLocaleString('de-CH')}</Text>
      </View>
      {repair.workshopDate ? (
        <View style={styles.appointmentBox}>
          <Text style={styles.appointmentTitle}>Werkstatttermin</Text>
          <Text style={styles.description}>{repair.workshopDate} · {repair.workshopTime || 'Zeit offen'}</Text>
          <Text style={styles.muted}>{repair.workshopName || 'Werkstatt noch offen'}</Text>
        </View>
      ) : null}
    </View>
  );
}

function EmployeeRepairsView({
  repairs,
  user,
  vehiclesData,
  onReport,
}: {
  repairs: RepairCase[];
  user: AppUser;
  vehiclesData: Vehicle[];
  onReport: (repair: RepairCase) => void;
}) {
  const activeVehicles = activeOnly(vehiclesData);
  const [vehicleId, setVehicleId] = useState(activeVehicles[0]?.id ?? '');
  const [category, setCategory] = useState<RepairCategory>('technischer_defekt');
  const [priority, setPriority] = useState<RepairPriority>('normal');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [photoUri, setPhotoUri] = useState<string>();
  const [formError, setFormError] = useState('');
  const ownActiveRepairs = activeRepairsForEmployee(repairs, user.id);

  async function takePhoto() {
    setFormError('');
    if (Platform.OS !== 'web') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setFormError('Bitte erlaube den Kamerazugriff, damit du ein Foto aufnehmen kannst.');
        return;
      }
    }
    const result = Platform.OS === 'web'
      ? await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.75 })
      : await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.75 });
    if (!result.canceled && result.assets[0]?.uri) setPhotoUri(result.assets[0].uri);
  }

  function saveRepair() {
    if (!title.trim() || !description.trim() || !photoUri) {
      setFormError('Bitte Kurzbezeichnung, Beschreibung und ein Foto erfassen.');
      return;
    }
    const now = new Date().toISOString();
    const caseNumber = `REP-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
    onReport({
      id: `repair-${Date.now()}`,
      caseNumber,
      vehicleId,
      reportedByUserId: user.id,
      reportedByName: user.displayName,
      category,
      priority,
      title: title.trim(),
      description: description.trim(),
      photoUri,
      reportedAt: now,
      status: 'gemeldet',
      events: [{ status: 'gemeldet', at: now, byUserId: user.id }],
    });
    setTitle('');
    setDescription('');
    setPhotoUri(undefined);
    setPriority('normal');
    setFormError('');
  }

  return (
    <View style={styles.section}>
      <Text style={styles.eyebrow}>FAHRZEUG & WERKSTATT</Text>
      <Text style={styles.heading}>Schaden oder Defekt melden</Text>

      <Text style={styles.fieldLabel}>Betroffener LKW</Text>
      <ChoiceRow
        options={activeVehicles.map((vehicle) => ({ value: vehicle.id, label: `${vehicle.internalNumber} · ${vehicle.label}` }))}
        selected={vehicleId}
        onSelect={setVehicleId}
      />

      <Text style={styles.fieldLabel}>Art der Meldung</Text>
      <ChoiceRow
        options={(Object.keys(repairCategoryLabels) as RepairCategory[]).map((value) => ({ value, label: repairCategoryLabels[value] }))}
        selected={category}
        onSelect={setCategory}
      />

      <Text style={styles.fieldLabel}>Dringlichkeit</Text>
      <ChoiceRow
        options={(Object.keys(repairPriorityLabels) as RepairPriority[]).map((value) => ({ value, label: repairPriorityLabels[value] }))}
        selected={priority}
        onSelect={setPriority}
      />

      <Text style={styles.fieldLabel}>Kurzbezeichnung</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="z. B. Scheibenwischer defekt" />
      <Text style={styles.fieldLabel}>Was ist passiert oder defekt?</Text>
      <TextInput
        multiline
        numberOfLines={4}
        style={[styles.input, styles.textArea]}
        value={description}
        onChangeText={setDescription}
        placeholder="Schaden möglichst genau beschreiben"
      />

      <Pressable style={styles.cameraButton} onPress={takePhoto}>
        <Text style={styles.cameraButtonText}>{photoUri ? 'Foto ersetzen' : '📷 Foto aufnehmen'}</Text>
      </Pressable>
      {photoUri ? <Image source={{ uri: photoUri }} style={styles.photoPreview} resizeMode="cover" /> : null}
      {formError ? <Text style={styles.errorText}>{formError}</Text> : null}
      <Pressable style={styles.primaryButtonLarge} onPress={saveRepair}>
        <Text style={styles.primaryButtonText}>Reparaturfall melden</Text>
      </Pressable>

      <Text style={styles.listHeading}>Meine offenen Meldungen</Text>
      {ownActiveRepairs.map((repair) => <RepairCard key={repair.id} repair={repair} vehiclesData={vehiclesData} />)}
      {ownActiveRepairs.length === 0 && <Text style={styles.empty}>Du hast keine offenen Reparaturfälle.</Text>}
    </View>
  );
}

function AdminRepairCard({
  repair,
  vehiclesData,
  onUpdate,
}: {
  repair: RepairCase;
  vehiclesData: Vehicle[];
  onUpdate: (id: string, status: RepairStatus, details?: Partial<RepairCase>) => void;
}) {
  const [workshopName, setWorkshopName] = useState(repair.workshopName ?? '');
  const [workshopDate, setWorkshopDate] = useState(repair.workshopDate ?? '2026-08-14');
  const [workshopTime, setWorkshopTime] = useState(repair.workshopTime ?? '08:00');
  const [adminNote, setAdminNote] = useState(repair.adminNote ?? '');

  return (
    <View style={styles.adminRepairBlock}>
      <RepairCard repair={repair} vehiclesData={vehiclesData} showReporter />
      {repair.status === 'gemeldet' ? (
        <View style={styles.repairAdminPanel}>
          <Text style={styles.listTitle}>Werkstatttermin organisieren</Text>
          <TextInput style={styles.input} value={workshopName} onChangeText={setWorkshopName} placeholder="Werkstatt" />
          <View style={styles.formGrid}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Datum</Text>
              <TextInput style={styles.input} value={workshopDate} onChangeText={setWorkshopDate} placeholder="JJJJ-MM-TT" />
            </View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Zeit</Text>
              <TextInput style={styles.input} value={workshopTime} onChangeText={setWorkshopTime} placeholder="HH:MM" />
            </View>
          </View>
          <TextInput style={styles.input} value={adminNote} onChangeText={setAdminNote} placeholder="Interne Notiz (optional)" />
          <Pressable
            style={styles.primaryButtonLarge}
            onPress={() => onUpdate(repair.id, 'termin_organisiert', { workshopName, workshopDate, workshopTime, adminNote })}
          >
            <Text style={styles.primaryButtonText}>Termin speichern und in Kalender eintragen</Text>
          </Pressable>
        </View>
      ) : null}
      {repair.status === 'termin_organisiert' ? (
        <Pressable style={styles.actionButton} onPress={() => onUpdate(repair.id, 'in_reparatur')}>
          <Text style={styles.actionButtonText}>Fahrzeug ist in Reparatur</Text>
        </Pressable>
      ) : null}
      {repair.status === 'in_reparatur' ? (
        <Pressable style={styles.completeRepairButton} onPress={() => onUpdate(repair.id, 'erledigt')}>
          <Text style={styles.primaryButtonText}>Reparatur erledigt</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function AdminRepairsView({
  repairs,
  vehiclesData,
  onUpdate,
}: {
  repairs: RepairCase[];
  vehiclesData: Vehicle[];
  onUpdate: (id: string, status: RepairStatus, details?: Partial<RepairCase>) => void;
}) {
  const openRepairs = repairs.filter((repair) => repair.status !== 'erledigt');
  const finishedRepairs = repairs.filter((repair) => repair.status === 'erledigt');
  return (
    <View style={styles.section}>
      <Text style={styles.eyebrow}>FAHRZEUGE & WERKSTATT</Text>
      <Text style={styles.heading}>Reparaturfälle</Text>
      <Text style={styles.infoBox}>Neue Meldungen werden nach Dringlichkeit angezeigt. Nur Administratoren können Werkstatttermine und Status ändern.</Text>
      {openRepairs.map((repair) => <AdminRepairCard key={repair.id} repair={repair} vehiclesData={vehiclesData} onUpdate={onUpdate} />)}
      {openRepairs.length === 0 && <Text style={styles.empty}>Keine offenen Reparaturfälle.</Text>}
      {finishedRepairs.length > 0 ? (
        <>
          <Text style={styles.listHeading}>Erledigt</Text>
          {finishedRepairs.map((repair) => <RepairCard key={repair.id} repair={repair} vehiclesData={vehiclesData} showReporter />)}
        </>
      ) : null}
    </View>
  );
}

function LoginView({ onLogin, users }: { onLogin: (user: AppUser) => void; users: AppUser[] }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function login() {
    const user = authenticateDemoUser(username, password, users);
    if (!user) {
      setError('Benutzername oder Passwort ist falsch.');
      return;
    }
    setError('');
    onLogin(user);
  }

  return (
    <View style={styles.loginPage}>
      <View style={styles.loginCard}>
        <Image
          source={require('./assets/rohner-logo.png')}
          style={styles.loginLogo}
          resizeMode="contain"
          accessibilityLabel="Rohner AG Transporte"
        />
        <Text style={styles.loginAppName}>Kommunikationsapp</Text>
        <Text style={styles.loginTitle}>Anmelden</Text>
        <Text style={styles.loginSub}>Transportaufträge und Fuhrrapporte</Text>

        <Text style={styles.fieldLabel}>Benutzername</Text>
        <TextInput
          autoCapitalize="none"
          autoComplete="username"
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          onSubmitEditing={login}
        />

        <Text style={styles.fieldLabel}>Passwort</Text>
        <TextInput
          autoCapitalize="none"
          autoComplete="password"
          secureTextEntry
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          onSubmitEditing={login}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable style={styles.loginButton} onPress={login}>
          <Text style={styles.primaryButtonText}>Anmelden</Text>
        </Pressable>

        <View style={styles.demoBox}>
          <Text style={styles.demoTitle}>Testzugänge</Text>
          <Text style={styles.demoText}>Administrator: admin / demo</Text>
          <Text style={styles.demoText}>Mitarbeiter: rene / demo</Text>
          <Text style={styles.demoText}>Mitarbeiter: marcel / demo</Text>
        </View>
      </View>
    </View>
  );
}

function OfficeView({
  orders,
  projectsData,
  driversData,
  vehiclesData,
  trailersData,
  onRelease,
}: {
  orders: TransportOrder[];
  projectsData: Project[];
  driversData: Driver[];
  vehiclesData: Vehicle[];
  trailersData: Trailer[];
  onRelease: (id: string) => void;
}) {
  const candidates = buildBillingPool(orders, projectsData);
  const awaitingRelease = orders.filter((order) => order.status === 'abgeschlossen');

  return (
    <View style={styles.section}>
      <Text style={styles.eyebrow}>KONTROLLE & VERRECHNUNG</Text>
      <Text style={styles.heading}>Freigabe durch Administration</Text>
      {awaitingRelease.map((order) => {
        const project = lookup(projectsData, order.projectId);
        return (
          <View key={order.id} style={styles.billingRow}>
            <View style={styles.billingMain}>
              <Text style={styles.cardTitle}>{project?.customerName}</Text>
              <Text style={styles.muted}>{order.orderNumber} · {order.title}</Text>
              <Text style={styles.description}>Vom Chauffeur abgeschlossen</Text>
            </View>
            <View style={styles.billingActions}>
              <Pressable style={styles.pdfSmallButton} onPress={() => saveOrderDeliveryNote(order, projectsData, driversData, vehiclesData, trailersData)}>
                <Text style={styles.pdfButtonText}>PDF</Text>
              </Pressable>
              <Pressable style={styles.releaseButton} onPress={() => onRelease(order.id)}>
                <Text style={styles.primaryButtonText}>Zur Verrechnung freigeben</Text>
              </Pressable>
            </View>
          </View>
        );
      })}
      {awaitingRelease.length === 0 && (
        <Text style={styles.empty}>Keine abgeschlossenen Aufträge warten auf Freigabe.</Text>
      )}

      <Text style={styles.listHeading}>Freigegebene Leistungen</Text>
      {candidates.map(({ order, project, amount }) => (
        <View key={order.id} style={styles.billingRow}>
          <View style={styles.billingMain}>
            <Text style={styles.cardTitle}>{project.customerName}</Text>
            <Text style={styles.muted}>{project.name} · LS {order.reportNumber ?? 'offen'}</Text>
            <Text style={styles.description}>{order.title}</Text>
          </View>
          <View style={styles.billingActions}>
            <Text style={styles.amount}>{formatChf(amount)}</Text>
            <Pressable style={styles.pdfSmallButton} onPress={() => saveOrderDeliveryNote(order, projectsData, driversData, vehiclesData, trailersData)}>
              <Text style={styles.pdfButtonText}>Lieferschein PDF</Text>
            </Pressable>
          </View>
        </View>
      ))}
      {candidates.length === 0 && (
        <Text style={styles.empty}>Noch keine Leistungen zur Verrechnung freigegeben.</Text>
      )}
    </View>
  );
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<AppUser>();
  const [screen, setScreen] = useState<Screen>('calendar');
  const [orders, setOrders] = useState(initialOrders);
  const [absenceData, setAbsenceData] = useState(initialAbsences);
  const [repairs, setRepairs] = useState(initialRepairCases);
  const [customerData, setCustomerData] = useState(initialCustomers);
  const [projectData, setProjectData] = useState(initialProjects);
  const [driverData, setDriverData] = useState(initialDrivers);
  const [vehicleData, setVehicleData] = useState(initialVehicles);
  const [trailerData, setTrailerData] = useState(initialTrailers);
  const [userData, setUserData] = useState(demoUsers);
  const [message, setMessage] = useState('');
  const { width } = useWindowDimensions();
  const maxWidth = width > 1100 ? 1040 : width;

  function login(user: AppUser) {
    setCurrentUser(user);
    setScreen(user.role === 'admin' ? 'calendar' : 'driver');
    setMessage(`Willkommen, ${user.displayName}.`);
  }

  function logout() {
    setCurrentUser(undefined);
    setScreen('calendar');
    setMessage('');
  }

  function advanceOrder(id: string) {
    setOrders((current) => current.map((order) => {
      if (order.id !== id) return order;
      const step = nextWorkflowStep(order.workflowStep);
      const status = step === 'abgeschlossen'
        ? 'abgeschlossen'
        : step === 'zugeteilt'
          ? 'zugeteilt'
          : ['angenommen', 'ladeort_angekommen', 'beladung_gestartet', 'beladung_beendet', 'entladeort_angekommen', 'entladung_gestartet', 'entladung_beendet'].includes(step)
          ? 'unterwegs'
          : 'zugeteilt';
      return {
        ...order,
        workflowStep: step,
        workflowEvents: [...order.workflowEvents, { step, at: new Date().toISOString() }],
        status,
      };
    }));
    setMessage('Status wurde aktualisiert.');
  }

  function backOrder(id: string) {
    setOrders((current) => current.map((order) => {
      if (order.id !== id || order.status === 'verrechenbar' || order.status === 'verrechnet') return order;
      const corrected = rollbackWorkflow(order.workflowEvents, order.workflowStep);
      return {
        ...order,
        workflowStep: corrected.step,
        workflowEvents: corrected.events,
        status: corrected.step === 'zugeteilt' ? 'zugeteilt' : 'unterwegs',
      };
    }));
    setMessage('Der letzte Schritt wurde korrigiert. Die vorherige Zeit läuft weiter.');
  }

  function releaseForBilling(id: string) {
    setOrders((current) => current.map((order) => (
      order.id === id ? { ...order, status: 'verrechenbar' } : order
    )));
    setMessage('Auftrag wurde zur Verrechnung freigegeben.');
  }

  function saveOrder(order: TransportOrder) {
    setOrders((current) => [...current, order]);
    setScreen('calendar');
    setMessage(`${order.orderNumber} wurde gespeichert und eingeplant.`);
  }

  function updateScheduledOrder(order: TransportOrder) {
    setOrders((current) => current.map((item) => item.id === order.id ? order : item));
    setMessage(`${order.orderNumber} wurde im Kalender verschoben.`);
  }

  function saveAbsence(absence: Absence) {
    setAbsenceData((current) => [...current, absence]);
    setMessage(`${absenceLabels[absence.type]} wurde erfasst und im Kalender eingetragen.`);
  }

  function deleteAbsence(id: string) {
    setAbsenceData((current) => current.filter((absence) => absence.id !== id));
    setMessage('Abwesenheit wurde gelöscht.');
  }

  function reportRepair(repair: RepairCase) {
    setRepairs((current) => [repair, ...current]);
    setMessage(`${repair.caseNumber} wurde gemeldet und an die Administration übermittelt.`);
  }

  function updateRepair(id: string, status: RepairStatus, details: Partial<RepairCase> = {}) {
    setRepairs((current) => current.map((repair) => {
      if (repair.id !== id || !canChangeRepairStatus(repair.status, status)) return repair;
      return {
        ...repair,
        ...details,
        status,
        events: [...repair.events, { status, at: new Date().toISOString(), byUserId: currentUser?.id ?? 'u-admin' }],
      };
    }));
    setMessage(status === 'erledigt' ? 'Reparatur wurde als erledigt abgeschlossen.' : 'Reparaturstatus wurde aktualisiert.');
  }

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar style="light" />
        <LoginView onLogin={login} users={userData} />
      </SafeAreaView>
    );
  }

  const isAdmin = currentUser.role === 'admin';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
        <View style={[styles.container, { maxWidth }]}>
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.accountName}>{currentUser.displayName}</Text>
                <Text style={styles.accountRole}>{isAdmin ? 'Administrator' : 'Mitarbeiter'}</Text>
              </View>
              <View style={styles.headerBrand}>
                <View style={styles.headerLogoSurface}>
                  <Image
                    source={require('./assets/rohner-logo.png')}
                    style={styles.headerLogo}
                    resizeMode="contain"
                    accessibilityLabel="Rohner AG Transporte"
                  />
                </View>
                <Text style={styles.brandSub}>Kommunikationsapp</Text>
              </View>
            </View>
            <Pressable onPress={logout} style={styles.logoutButton}>
              <Text style={styles.logoutText}>Abmelden</Text>
            </Pressable>
          </View>

          {isAdmin && (
            <View style={styles.subNavigation}>
              <Pressable onPress={() => setScreen('calendar')} style={[styles.navButton, screen === 'calendar' && styles.navButtonActive]}>
                <Text style={[styles.navText, screen === 'calendar' && styles.navTextActive]}>Kalender</Text>
              </Pressable>
              <Pressable onPress={() => setScreen('newOrder')} style={[styles.navButton, screen === 'newOrder' && styles.navButtonActive]}>
                <Text style={[styles.navText, screen === 'newOrder' && styles.navTextActive]}>Auftrag erfassen</Text>
              </Pressable>
              <Pressable onPress={() => setScreen('masterData')} style={[styles.navButton, screen === 'masterData' && styles.navButtonActive]}>
                <Text style={[styles.navText, screen === 'masterData' && styles.navTextActive]}>Stammdaten</Text>
              </Pressable>
              <Pressable onPress={() => setScreen('absences')} style={[styles.navButton, screen === 'absences' && styles.navButtonActive]}>
                <Text style={[styles.navText, screen === 'absences' && styles.navTextActive]}>Abwesenheiten</Text>
              </Pressable>
              <Pressable onPress={() => setScreen('repairs')} style={[styles.navButton, screen === 'repairs' && styles.navButtonActive]}>
                <Text style={[styles.navText, screen === 'repairs' && styles.navTextActive]}>Reparaturen ({repairs.filter((repair) => repair.status !== 'erledigt').length})</Text>
              </Pressable>
              <Pressable onPress={() => setScreen('billing')} style={[styles.navButton, screen === 'billing' && styles.navButtonActive]}>
                <Text style={[styles.navText, screen === 'billing' && styles.navTextActive]}>Verrechnung</Text>
              </Pressable>
            </View>
          )}

          {!isAdmin && (
            <View style={styles.subNavigation}>
              <Pressable onPress={() => setScreen('driver')} style={[styles.navButton, screen === 'driver' && styles.navButtonActive]}>
                <Text style={[styles.navText, screen === 'driver' && styles.navTextActive]}>Meine Aufträge</Text>
              </Pressable>
              <Pressable onPress={() => setScreen('repairs')} style={[styles.navButton, screen === 'repairs' && styles.navButtonActive]}>
                <Text style={[styles.navText, screen === 'repairs' && styles.navTextActive]}>Schaden melden ({activeRepairsForEmployee(repairs, currentUser.id).length})</Text>
              </Pressable>
            </View>
          )}

          {message ? (
            <Pressable style={styles.message} onPress={() => setMessage('')}>
              <Text style={styles.messageText}>{message}</Text>
            </Pressable>
          ) : null}

          {isAdmin && screen === 'calendar' && (
            <DispositionView orders={orders} absencesData={absenceData} repairs={repairs} projectsData={projectData} driversData={driverData} vehiclesData={vehicleData} trailersData={trailerData} onNewOrder={() => setScreen('newOrder')} onUpdateOrder={updateScheduledOrder} onOpenAbsences={() => setScreen('absences')} onOpenRepairs={() => setScreen('repairs')} />
          )}
          {isAdmin && screen === 'newOrder' && (
            <OrderForm customersData={customerData} projectsData={projectData} driversData={driverData} vehiclesData={vehicleData} trailersData={trailerData} onSave={saveOrder} onCancel={() => setScreen('calendar')} />
          )}
          {!isAdmin && screen === 'driver' && (
            <DriverView orders={orders} user={currentUser} projectsData={projectData} driversData={driverData} vehiclesData={vehicleData} trailersData={trailerData} onAdvance={advanceOrder} onBack={backOrder} />
          )}
          {!isAdmin && screen === 'repairs' && (
            <EmployeeRepairsView repairs={repairs} user={currentUser} vehiclesData={vehicleData} onReport={reportRepair} />
          )}
          {isAdmin && screen === 'repairs' && (
            <AdminRepairsView repairs={repairs} vehiclesData={vehicleData} onUpdate={updateRepair} />
          )}
          {isAdmin && screen === 'billing' && (
            <OfficeView orders={orders} projectsData={projectData} driversData={driverData} vehiclesData={vehicleData} trailersData={trailerData} onRelease={releaseForBilling} />
          )}
          {isAdmin && screen === 'absences' && <AbsencesView absencesData={absenceData} driversData={driverData} onSave={saveAbsence} onDelete={deleteAbsence} />}
          {isAdmin && screen === 'masterData' && <MasterDataView customers={customerData} projects={projectData} drivers={driverData} vehicles={vehicleData} trailers={trailerData} users={userData} onCustomersChange={setCustomerData} onProjectsChange={setProjectData} onDriversChange={setDriverData} onVehiclesChange={setVehicleData} onTrailersChange={setTrailerData} onUsersChange={setUserData} />}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#07130B' },
  page: { flexGrow: 1, alignItems: 'center', backgroundColor: '#F4F7F4' },
  container: { width: '100%' },
  header: { backgroundColor: '#0B4D27', paddingHorizontal: 24, paddingTop: 22, paddingBottom: 18, gap: 12 },
  headerTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 },
  brandSub: { color: '#FFFFFF', fontSize: 13, fontWeight: '600', textAlign: 'right', marginTop: 4 },
  headerBrand: { width: 230, maxWidth: '58%', alignItems: 'flex-end' },
  headerLogoSurface: { width: '100%', backgroundColor: '#FFFFFF', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5 },
  headerLogo: { width: '100%', height: 38 },
  accountName: { color: '#FFFFFF', fontWeight: '800' },
  accountRole: { color: '#BBD7C3', marginTop: 2, fontSize: 12 },
  logoutButton: { alignSelf: 'flex-start', borderWidth: 1, borderColor: '#8FBA9B', borderRadius: 9, paddingHorizontal: 12, paddingVertical: 8 },
  logoutText: { color: '#FFFFFF', fontWeight: '700' },
  subNavigation: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 18, paddingTop: 16 },
  navButton: { borderRadius: 10, paddingHorizontal: 13, paddingVertical: 9, backgroundColor: '#E7ECE8' },
  navButtonActive: { backgroundColor: '#0B4D27' },
  navText: { color: '#425047', fontWeight: '700' },
  navTextActive: { color: '#FFFFFF' },
  message: { marginHorizontal: 18, marginTop: 14, borderRadius: 10, padding: 12, backgroundColor: '#E4F2E8' },
  messageText: { color: '#0B4D27', fontWeight: '700' },
  section: { paddingHorizontal: 18, paddingBottom: 40 },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12 },
  headingBlock: { flexShrink: 1 },
  eyebrow: { color: '#5C6B60', fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  heading: { color: '#142018', fontSize: 26, fontWeight: '900', marginTop: 4, marginBottom: 18 },
  primaryButton: { backgroundColor: '#0B4D27', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 11, marginBottom: 18 },
  primaryButtonLarge: { flexGrow: 1, backgroundColor: '#0B4D27', borderRadius: 11, padding: 15, alignItems: 'center' },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '800' },
  secondaryButton: { borderWidth: 1, borderColor: '#AAB6AD', borderRadius: 11, padding: 14, alignItems: 'center' },
  secondaryButtonText: { color: '#34443A', fontWeight: '800' },
  dayBlock: { marginBottom: 20 },
  dayTitle: { fontSize: 15, color: '#4B5B50', fontWeight: '800', marginBottom: 8 },
  calendarSwitch: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  calendarNavigator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E0E6E1', borderRadius: 12, padding: 8, marginBottom: 12 },
  calendarArrow: { width: 44, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E7ECE8', borderRadius: 9 },
  calendarArrowText: { color: '#0B4D27', fontSize: 28, fontWeight: '800', lineHeight: 30 },
  calendarPeriod: { flex: 1, textAlign: 'center', color: '#142018', fontSize: 16, fontWeight: '900', textTransform: 'capitalize' },
  calendarBoard: { width: '100%', flexDirection: 'row', gap: 10, paddingBottom: 12 },
  monthBoard: { width: 1100, flexWrap: 'wrap', gap: 8 },
  calendarColumn: { width: 200, minHeight: 250, backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E0E6E1', padding: 11 },
  dayColumn: { flex: 1, width: '100%', minHeight: 360 },
  monthColumn: { width: 150, minHeight: 150, borderRadius: 9, padding: 8 },
  weekDay: { color: '#0B4D27', fontWeight: '900', marginBottom: 10 },
  calendarOrder: { borderLeftWidth: 5, backgroundColor: '#F4F7F4', borderRadius: 8, padding: 9, marginBottom: 8 },
  clickableCalendarEntry: { opacity: 0.98 },
  calendarAbsence: { backgroundColor: '#FFF5C7', borderRadius: 8, padding: 9, marginBottom: 8 },
  calendarRepair: { borderLeftWidth: 5, borderLeftColor: '#D97706', backgroundColor: '#FFF1DD', borderRadius: 8, padding: 9, marginBottom: 8 },
  calendarTime: { color: '#59675E', fontSize: 11, fontWeight: '700' },
  calendarTitle: { color: '#142018', fontWeight: '900', marginTop: 3 },
  calendarMeta: { color: '#66736A', fontSize: 12, marginTop: 3 },
  calendarEmpty: { color: '#8A958D', textAlign: 'center', marginTop: 26 },
  calendarDetail: { backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#A8CDB3', borderRadius: 14, padding: 15, marginBottom: 14 },
  calendarDetailHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 },
  calendarDetailTitle: { color: '#0B4D27', fontSize: 18, fontWeight: '900' },
  closeDetailButton: { backgroundColor: '#E7ECE8', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  closeDetailText: { color: '#34443A', fontWeight: '800', fontSize: 12 },
  moveActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  moveButton: { flexGrow: 1, backgroundColor: '#0B4D27', borderRadius: 10, padding: 13, alignItems: 'center' },
  moveButtonText: { color: '#FFFFFF', fontWeight: '900' },
  calendarDetailHint: { color: '#5E4B00', backgroundColor: '#FFF5C7', borderRadius: 9, padding: 11 },
  detailLinkButton: { alignSelf: 'flex-start', backgroundColor: '#0B4D27', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, marginTop: 14 },
  detailLinkText: { color: '#FFFFFF', fontWeight: '900' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 14, borderLeftWidth: 6, padding: 16, marginBottom: 10, shadowColor: '#000000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardTopline: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  orderNumber: { color: '#66736A', fontSize: 12, fontWeight: '700', flexShrink: 1 },
  status: { color: '#0B4D27', backgroundColor: '#E4F2E8', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999, fontSize: 11, fontWeight: '800' },
  cardTitle: { color: '#142018', fontSize: 17, fontWeight: '900', marginTop: 6 },
  muted: { color: '#6A756D', marginTop: 3 },
  route: { color: '#142018', fontWeight: '700', marginTop: 10 },
  locationLinks: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  locationLinkButton: { borderWidth: 1, borderColor: '#0B4D27', backgroundColor: '#F4FAF6', borderRadius: 9, paddingHorizontal: 11, paddingVertical: 9 },
  locationLinkText: { color: '#0B4D27', fontSize: 12, fontWeight: '800' },
  description: { color: '#445049', marginTop: 7, lineHeight: 20 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 12 },
  tag: { color: '#445049', backgroundColor: '#EEF2EE', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8, fontSize: 12, fontWeight: '600' },
  driverActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginBottom: 10 },
  actionButton: { flexGrow: 1, backgroundColor: '#FFD11A', borderRadius: 11, padding: 14, alignItems: 'center' },
  actionButtonText: { color: '#17331F', fontWeight: '900' },
  disabledButton: { opacity: 0.45 },
  mapButton: { flexGrow: 1, borderWidth: 1, borderColor: '#0B4D27', borderRadius: 11, padding: 13, alignItems: 'center' },
  mapButtonText: { color: '#0B4D27', fontWeight: '900' },
  mapButtonStrong: { backgroundColor: '#0B4D27', borderRadius: 11, padding: 14, alignItems: 'center', marginTop: 10 },
  nextDestinationBox: { backgroundColor: '#E4F2E8', borderWidth: 1, borderColor: '#A8CDB3', borderRadius: 13, padding: 15, marginBottom: 10 },
  nextDestinationEyebrow: { color: '#487255', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  nextDestinationTitle: { color: '#142018', fontSize: 18, fontWeight: '900', marginTop: 4 },
  timeSummary: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E0E6E1', borderRadius: 13, padding: 14, marginBottom: 10 },
  timeSummaryTitle: { color: '#142018', fontWeight: '900', marginBottom: 10 },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeCell: { flexGrow: 1, minWidth: 135, backgroundColor: '#F4F7F4', borderRadius: 9, padding: 10 },
  timeLabel: { color: '#66736A', fontSize: 11, fontWeight: '700' },
  timeValue: { color: '#0B4D27', fontSize: 17, fontWeight: '900', marginTop: 3 },
  backButton: { flexGrow: 1, borderWidth: 1, borderColor: '#A64B3C', backgroundColor: '#FFF7F5', borderRadius: 11, padding: 13, alignItems: 'center' },
  backButtonText: { color: '#8E3529', fontWeight: '900' },
  backConfirmation: { backgroundColor: '#FFF7F5', borderWidth: 1, borderColor: '#D8AAA2', borderRadius: 12, padding: 14, marginBottom: 12 },
  backConfirmationTitle: { color: '#8E3529', fontWeight: '900', fontSize: 16 },
  backConfirmButton: { flexGrow: 1, backgroundColor: '#A13E30', borderRadius: 11, padding: 14, alignItems: 'center' },
  pdfButton: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#0B4D27', borderRadius: 11, padding: 14, alignItems: 'center', marginBottom: 12 },
  pdfSmallButton: { borderWidth: 1, borderColor: '#0B4D27', backgroundColor: '#F4FAF6', borderRadius: 9, paddingHorizontal: 12, paddingVertical: 10, alignItems: 'center' },
  pdfButtonText: { color: '#0B4D27', fontWeight: '900' },
  timeline: { backgroundColor: '#FFFFFF', borderRadius: 10, paddingHorizontal: 12, marginBottom: 20 },
  timelineRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: '#E7ECE8' },
  timelineLabel: { color: '#34443A', flex: 1 },
  timelineTime: { color: '#66736A', fontWeight: '700' },
  billingRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, marginBottom: 10, gap: 12, borderWidth: 1, borderColor: '#E2E8E2' },
  billingMain: { flex: 1 },
  billingActions: { alignItems: 'stretch', gap: 8 },
  amount: { color: '#0B4D27', fontWeight: '900' },
  releaseButton: { backgroundColor: '#0B4D27', borderRadius: 9, paddingHorizontal: 12, paddingVertical: 10 },
  empty: { color: '#6A756D', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 18 },
  fieldLabel: { color: '#27362C', fontWeight: '800', marginTop: 14, marginBottom: 7 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { borderWidth: 1, borderColor: '#C7D1C9', backgroundColor: '#FFFFFF', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 },
  choiceActive: { backgroundColor: '#0B4D27', borderColor: '#0B4D27' },
  choiceText: { color: '#34443A', fontWeight: '700' },
  choiceTextActive: { color: '#FFFFFF' },
  dropdownWrap: { position: 'relative', zIndex: 10 },
  dropdownButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#C7D1C9', borderRadius: 10, paddingHorizontal: 13, paddingVertical: 13 },
  dropdownText: { color: '#142018', fontWeight: '700', flex: 1 },
  dropdownPlaceholder: { color: '#7C887F', fontWeight: '500' },
  dropdownArrow: { color: '#0B4D27', fontSize: 11, fontWeight: '900' },
  dropdownMenu: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#C7D1C9', borderRadius: 10, marginTop: 5, overflow: 'hidden' },
  dropdownOption: { paddingHorizontal: 13, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E7ECE8' },
  dropdownOptionActive: { backgroundColor: '#E4F2E8' },
  dropdownOptionText: { color: '#34443A' },
  dropdownOptionTextActive: { color: '#0B4D27', fontWeight: '800' },
  datePickerWrap: { position: 'relative', zIndex: 20 },
  datePickerButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#C7D1C9', borderRadius: 10, paddingHorizontal: 13, paddingVertical: 13 },
  datePickerButtonText: { color: '#142018', fontWeight: '800' },
  datePickerPanel: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#C7D1C9', borderRadius: 12, padding: 12, marginTop: 6, shadowColor: '#000000', shadowOpacity: 0.12, shadowRadius: 12, elevation: 5 },
  datePickerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 },
  datePickerArrow: { width: 40, height: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E7ECE8', borderRadius: 8 },
  datePickerArrowText: { color: '#0B4D27', fontSize: 26, fontWeight: '900', lineHeight: 28 },
  datePickerMonth: { flex: 1, textAlign: 'center', color: '#142018', fontWeight: '900', textTransform: 'capitalize' },
  datePickerGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  datePickerWeekday: { width: '14.2857%', textAlign: 'center', color: '#66736A', fontSize: 11, fontWeight: '900', paddingVertical: 6 },
  datePickerDay: { width: '14.2857%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  datePickerDaySelected: { backgroundColor: '#0B4D27' },
  datePickerDayToday: { borderWidth: 1, borderColor: '#0B4D27' },
  datePickerDayText: { color: '#27362C', fontWeight: '700' },
  datePickerDayOutside: { color: '#AAB3AC' },
  datePickerDayTextSelected: { color: '#FFFFFF', fontWeight: '900' },
  searchSelectRow: { flexDirection: 'row' },
  searchSelectInput: { flex: 1, backgroundColor: '#FFFFFF', borderWidth: 1, borderRightWidth: 0, borderColor: '#C7D1C9', borderTopLeftRadius: 10, borderBottomLeftRadius: 10, paddingHorizontal: 13, paddingVertical: 12, color: '#142018' },
  searchSelectButton: { width: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#C7D1C9', borderTopRightRadius: 10, borderBottomRightRadius: 10 },
  searchSelectArrow: { color: '#0B4D27', fontSize: 11, fontWeight: '900' },
  noSearchResult: { color: '#6A756D', padding: 13 },
  formGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  formField: { minWidth: 220, flex: 1 },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#C7D1C9', borderRadius: 10, paddingHorizontal: 13, paddingVertical: 12, color: '#142018' },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  formActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 24 },
  absenceForm: { backgroundColor: '#E7ECE8', borderRadius: 14, padding: 16, marginBottom: 18 },
  absenceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8E2', padding: 14, marginBottom: 8 },
  deleteButton: { backgroundColor: '#FDE7E5', borderRadius: 9, paddingHorizontal: 12, paddingVertical: 10 },
  deleteButtonText: { color: '#8A2921', fontWeight: '800' },
  listHeading: { color: '#0B4D27', fontSize: 18, fontWeight: '900', marginTop: 16, marginBottom: 8 },
  listRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8E2', padding: 14 },
  listTitle: { color: '#142018', fontWeight: '800' },
  activeLabel: { color: '#0B4D27', fontSize: 12, fontWeight: '800' },
  adminLabel: { color: '#0B4D27', backgroundColor: '#E4F2E8', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, fontSize: 12, fontWeight: '800' },
  employeeLabel: { color: '#34443A', backgroundColor: '#EEF2EE', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, fontSize: 12, fontWeight: '800' },
  infoBox: { color: '#34443A', backgroundColor: '#FFF5C7', borderRadius: 10, padding: 13, marginBottom: 12, lineHeight: 20 },
  repairCard: { backgroundColor: '#FFFFFF', borderRadius: 14, borderLeftWidth: 6, borderLeftColor: '#D97706', padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#E7DED1' },
  repairStatus: { color: '#8A4B08', backgroundColor: '#FFF1DD', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999, fontSize: 11, fontWeight: '800' },
  repairStatusCritical: { color: '#FFFFFF', backgroundColor: '#B42318' },
  repairPhoto: { width: '100%', height: 220, borderRadius: 11, marginTop: 13, backgroundColor: '#E7ECE8' },
  photoPreview: { width: '100%', height: 240, borderRadius: 12, marginBottom: 12, backgroundColor: '#E7ECE8' },
  cameraButton: { backgroundColor: '#FFD11A', borderRadius: 11, padding: 15, alignItems: 'center', marginTop: 16, marginBottom: 12 },
  cameraButtonText: { color: '#17331F', fontWeight: '900' },
  appointmentBox: { backgroundColor: '#FFF8E8', borderRadius: 10, padding: 12, marginTop: 12 },
  appointmentTitle: { color: '#8A4B08', fontWeight: '900' },
  adminRepairBlock: { marginBottom: 22 },
  repairAdminPanel: { backgroundColor: '#E7ECE8', borderRadius: 12, padding: 14, gap: 10 },
  completeRepairButton: { backgroundColor: '#0B4D27', borderRadius: 11, padding: 14, alignItems: 'center' },
  loginPage: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0B4D27', padding: 20 },
  loginCard: { width: '100%', maxWidth: 440, backgroundColor: '#F4F7F4', borderRadius: 18, padding: 24 },
  loginLogo: { alignSelf: 'flex-end', width: 250, maxWidth: '78%', height: 52 },
  loginAppName: { color: '#0B4D27', textAlign: 'right', fontSize: 15, fontWeight: '800', marginTop: 6 },
  loginTitle: { color: '#142018', fontSize: 28, fontWeight: '900', marginTop: 18 },
  loginSub: { color: '#607066', marginTop: 4, marginBottom: 8 },
  loginButton: { backgroundColor: '#0B4D27', borderRadius: 11, padding: 15, alignItems: 'center', marginTop: 18 },
  errorText: { color: '#B42318', marginTop: 10, fontWeight: '700' },
  demoBox: { backgroundColor: '#E7ECE8', borderRadius: 10, padding: 13, marginTop: 18 },
  demoTitle: { color: '#27362C', fontWeight: '800', marginBottom: 5 },
  demoText: { color: '#536158', marginTop: 3 },
});
