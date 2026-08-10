import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
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

import { absences, customers as initialCustomers, drivers as initialDrivers, initialOrders, initialRepairCases, projects, trailers as initialTrailers, vehicles as initialVehicles } from './src/data/demoData';
import { AppUser, authenticateDemoUser, demoUsers } from './src/auth/demoAuth';
import {
  BillingMode,
  Customer,
  Driver,
  OrderType,
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
import { isWorkflowFinished, nextWorkflowAction, nextWorkflowStep, workflowLabels } from './src/lib/workflow';
import { activeRepairsForEmployee, canChangeRepairStatus, repairStatusLabels, workshopRepairsOnDate } from './src/lib/repairs';
import { activeOnly } from './src/lib/masterData';

type Screen = 'calendar' | 'newOrder' | 'driver' | 'repairs' | 'billing' | 'masterData' | 'users';

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

function OrderCard({ order, projectsData, driversData, vehiclesData, trailersData, compact = false }: { order: TransportOrder; projectsData: typeof projects; driversData: Driver[]; vehiclesData: Vehicle[]; trailersData: Trailer[]; compact?: boolean }) {
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
  krank: 'Krank',
  kompensation: 'Kompensation',
  urlaub: 'Urlaub',
};

const weekDays = [
  { date: '2026-08-10', label: 'Mo 10.8.' },
  { date: '2026-08-11', label: 'Di 11.8.' },
  { date: '2026-08-12', label: 'Mi 12.8.' },
  { date: '2026-08-13', label: 'Do 13.8.' },
  { date: '2026-08-14', label: 'Fr 14.8.' },
];

function DispositionView({
  orders,
  repairs,
  projectsData,
  driversData,
  vehiclesData,
  trailersData,
  onNewOrder,
}: {
  orders: TransportOrder[];
  repairs: RepairCase[];
  projectsData: typeof projects;
  driversData: Driver[];
  vehiclesData: Vehicle[];
  trailersData: Trailer[];
  onNewOrder: () => void;
}) {
  const [calendarMode, setCalendarMode] = useState<'week' | 'list'>('week');
  const dates = [...new Set(orders.map((order) => order.date))].sort();

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeading}>
        <View style={styles.headingBlock}>
          <Text style={styles.eyebrow}>AUFTRÄGE & PERSONAL</Text>
          <Text style={styles.heading}>Wochenkalender</Text>
        </View>
        <Pressable style={styles.primaryButton} onPress={onNewOrder}>
          <Text style={styles.primaryButtonText}>+ Auftrag</Text>
        </Pressable>
      </View>
      <View style={styles.calendarSwitch}>
        <Pressable onPress={() => setCalendarMode('week')} style={[styles.navButton, calendarMode === 'week' && styles.navButtonActive]}>
          <Text style={[styles.navText, calendarMode === 'week' && styles.navTextActive]}>Woche</Text>
        </Pressable>
        <Pressable onPress={() => setCalendarMode('list')} style={[styles.navButton, calendarMode === 'list' && styles.navButtonActive]}>
          <Text style={[styles.navText, calendarMode === 'list' && styles.navTextActive]}>Liste</Text>
        </Pressable>
      </View>

      {calendarMode === 'week' ? (
        <ScrollView horizontal showsHorizontalScrollIndicator>
          <View style={styles.weekBoard}>
            {weekDays.map((day) => {
              const dayOrders = orders.filter((order) => order.date === day.date);
              const dayAbsences = absences.filter((absence) => day.date >= absence.from && day.date <= absence.to);
              const dayRepairs = workshopRepairsOnDate(repairs, day.date);
              return (
                <View key={day.date} style={styles.weekColumn}>
                  <Text style={styles.weekDay}>{day.label}</Text>
                  {dayOrders.map((order) => {
                    const driver = lookup(driversData, order.driverId);
                    const project = lookup(projectsData, order.projectId);
                    return (
                      <View key={order.id} style={[styles.calendarOrder, { borderLeftColor: typeColors[order.type] }]}>
                        <Text style={styles.calendarTime}>{order.timeWindow}</Text>
                        <Text style={styles.calendarTitle}>{project?.customerName ?? order.title}</Text>
                        <Text style={styles.calendarMeta}>{driver?.name ?? 'Nicht zugeteilt'} · {typeLabels[order.type]}</Text>
                      </View>
                    );
                  })}
                  {dayAbsences.map((absence) => {
                    const driver = lookup(driversData, absence.driverId);
                    return (
                      <View key={`${absence.id}-${day.date}`} style={styles.calendarAbsence}>
                        <Text style={styles.calendarTitle}>{driver?.name}</Text>
                        <Text style={styles.calendarMeta}>{absenceLabels[absence.type]}</Text>
                      </View>
                    );
                  })}
                  {dayRepairs.map((repair) => {
                    const vehicle = lookup(vehiclesData, repair.vehicleId);
                    return (
                      <View key={`${repair.id}-${day.date}`} style={styles.calendarRepair}>
                        <Text style={styles.calendarTime}>{repair.workshopTime ?? 'Zeit offen'} · WERKSTATT</Text>
                        <Text style={styles.calendarTitle}>{vehicle?.internalNumber} · {repair.title}</Text>
                        <Text style={styles.calendarMeta}>{repair.workshopName ?? 'Werkstatt offen'}</Text>
                      </View>
                    );
                  })}
                  {dayOrders.length === 0 && dayAbsences.length === 0 && dayRepairs.length === 0 && (
                    <Text style={styles.calendarEmpty}>Noch frei</Text>
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>
      ) : (
        dates.map((date) => (
          <View key={date} style={styles.dayBlock}>
            <Text style={styles.dayTitle}>{date}</Text>
            {orders.filter((order) => order.date === date).map((order) => (
              <OrderCard key={order.id} order={order} projectsData={projectsData} driversData={driversData} vehiclesData={vehiclesData} trailersData={trailersData} compact />
            ))}
          </View>
        ))
      )}
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
  projectsData: typeof projects;
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
  const matchingProjects = projectsData.filter((project) => project.customerId === customerId);
  const [projectId, setProjectId] = useState(matchingProjects[0]?.id ?? '');
  const [type, setType] = useState<OrderType>('kipper');
  const [billingMode, setBillingMode] = useState<BillingMode>('stunde');
  const [date, setDate] = useState('2026-08-13');
  const [timeWindow, setTimeWindow] = useState('07:00–17:00');
  const [title, setTitle] = useState('Neuer Transportauftrag');
  const [pickup, setPickup] = useState('Abholort');
  const [delivery, setDelivery] = useState('Abladeort');
  const [description, setDescription] = useState('Bemerkungen zum Auftrag');
  const [driverId, setDriverId] = useState(activeDrivers[0]?.id ?? '');
  const [vehicleId, setVehicleId] = useState(activeVehicles[0]?.id ?? '');
  const [trailerId, setTrailerId] = useState('none');

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
      delivery: delivery.trim(),
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
          setProjectId(projectsData.find((project) => project.customerId === value)?.id ?? '');
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
          <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="JJJJ-MM-TT" />
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
          <Text style={styles.fieldLabel}>Abholort</Text>
          <TextInput style={styles.input} value={pickup} onChangeText={setPickup} />
        </View>
        <View style={styles.formField}>
          <Text style={styles.fieldLabel}>Abladeort</Text>
          <TextInput style={styles.input} value={delivery} onChangeText={setDelivery} />
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
        onSelect={setDriverId}
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
}: {
  orders: TransportOrder[];
  user: AppUser;
  projectsData: typeof projects;
  driversData: Driver[];
  vehiclesData: Vehicle[];
  trailersData: Trailer[];
  onAdvance: (id: string) => void;
}) {
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
          <View style={styles.driverActions}>
            <Pressable
              style={styles.mapButton}
              onPress={() => Linking.openURL(
                `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(order.pickup)}&destination=${encodeURIComponent(order.delivery)}&travelmode=driving`,
              )}
            >
              <Text style={styles.mapButtonText}>Route mit Google Maps</Text>
            </Pressable>
            <Pressable
              disabled={isWorkflowFinished(order.workflowStep)}
              style={[styles.actionButton, isWorkflowFinished(order.workflowStep) && styles.disabledButton]}
              onPress={() => onAdvance(order.id)}
            >
              <Text style={styles.actionButtonText}>{nextWorkflowAction(order.workflowStep)}</Text>
            </Pressable>
          </View>
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

function LoginView({ onLogin }: { onLogin: (user: AppUser) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function login() {
    const user = authenticateDemoUser(username, password);
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
  onRelease,
}: {
  orders: TransportOrder[];
  projectsData: typeof projects;
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
            <Pressable style={styles.releaseButton} onPress={() => onRelease(order.id)}>
              <Text style={styles.primaryButtonText}>Zur Verrechnung freigeben</Text>
            </Pressable>
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
          <Text style={styles.amount}>{formatChf(amount)}</Text>
        </View>
      ))}
      {candidates.length === 0 && (
        <Text style={styles.empty}>Noch keine Leistungen zur Verrechnung freigegeben.</Text>
      )}
    </View>
  );
}

function SummaryBar({ orders, driversData, vehiclesData, trailersData }: { orders: TransportOrder[]; driversData: Driver[]; vehiclesData: Vehicle[]; trailersData: Trailer[] }) {
  return (
    <View style={styles.stats}>
      <View style={styles.stat}>
        <Text style={styles.statValue}>{orders.length}</Text>
        <Text style={styles.muted}>Aufträge</Text>
      </View>
      <View style={styles.stat}>
        <Text style={styles.statValue}>{vehiclesData.filter((item) => item.active).length}</Text>
        <Text style={styles.muted}>LKW</Text>
      </View>
      <View style={styles.stat}>
        <Text style={styles.statValue}>{trailersData.filter((item) => item.active).length}</Text>
        <Text style={styles.muted}>Anhänger</Text>
      </View>
      <View style={styles.stat}>
        <Text style={styles.statValue}>{driversData.filter((item) => item.active).length}</Text>
        <Text style={styles.muted}>Chauffeure</Text>
      </View>
    </View>
  );
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<AppUser>();
  const [screen, setScreen] = useState<Screen>('calendar');
  const [orders, setOrders] = useState(initialOrders);
  const [repairs, setRepairs] = useState(initialRepairCases);
  const [customerData, setCustomerData] = useState(initialCustomers);
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
        : ['unterwegs', 'angekommen', 'entladung_gestartet', 'entladung_beendet'].includes(step)
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
        <LoginView onLogin={login} />
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

          {isAdmin && <SummaryBar orders={orders} driversData={driverData} vehiclesData={vehicleData} trailersData={trailerData} />}

          {isAdmin && screen === 'calendar' && (
            <DispositionView orders={orders} repairs={repairs} projectsData={projects} driversData={driverData} vehiclesData={vehicleData} trailersData={trailerData} onNewOrder={() => setScreen('newOrder')} />
          )}
          {isAdmin && screen === 'newOrder' && (
            <OrderForm customersData={customerData} projectsData={projects} driversData={driverData} vehiclesData={vehicleData} trailersData={trailerData} onSave={saveOrder} onCancel={() => setScreen('calendar')} />
          )}
          {!isAdmin && screen === 'driver' && (
            <DriverView orders={orders} user={currentUser} projectsData={projects} driversData={driverData} vehiclesData={vehicleData} trailersData={trailerData} onAdvance={advanceOrder} />
          )}
          {!isAdmin && screen === 'repairs' && (
            <EmployeeRepairsView repairs={repairs} user={currentUser} vehiclesData={vehicleData} onReport={reportRepair} />
          )}
          {isAdmin && screen === 'repairs' && (
            <AdminRepairsView repairs={repairs} vehiclesData={vehicleData} onUpdate={updateRepair} />
          )}
          {isAdmin && screen === 'billing' && (
            <OfficeView orders={orders} projectsData={projects} onRelease={releaseForBilling} />
          )}
          {isAdmin && screen === 'masterData' && <MasterDataView customers={customerData} drivers={driverData} vehicles={vehicleData} trailers={trailerData} users={userData} onCustomersChange={setCustomerData} onDriversChange={setDriverData} onVehiclesChange={setVehicleData} onTrailersChange={setTrailerData} onUsersChange={setUserData} />}
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
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 18 },
  stat: { minWidth: 130, flexGrow: 1, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#E2E8E2' },
  statValue: { fontSize: 24, fontWeight: '900', color: '#0B4D27' },
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
  calendarSwitch: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  weekBoard: { flexDirection: 'row', gap: 10, paddingBottom: 12 },
  weekColumn: { width: 210, minHeight: 250, backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E0E6E1', padding: 11 },
  weekDay: { color: '#0B4D27', fontWeight: '900', marginBottom: 10 },
  calendarOrder: { borderLeftWidth: 5, backgroundColor: '#F4F7F4', borderRadius: 8, padding: 9, marginBottom: 8 },
  calendarAbsence: { backgroundColor: '#FFF5C7', borderRadius: 8, padding: 9, marginBottom: 8 },
  calendarRepair: { borderLeftWidth: 5, borderLeftColor: '#D97706', backgroundColor: '#FFF1DD', borderRadius: 8, padding: 9, marginBottom: 8 },
  calendarTime: { color: '#59675E', fontSize: 11, fontWeight: '700' },
  calendarTitle: { color: '#142018', fontWeight: '900', marginTop: 3 },
  calendarMeta: { color: '#66736A', fontSize: 12, marginTop: 3 },
  calendarEmpty: { color: '#8A958D', textAlign: 'center', marginTop: 26 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 14, borderLeftWidth: 6, padding: 16, marginBottom: 10, shadowColor: '#000000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardTopline: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  orderNumber: { color: '#66736A', fontSize: 12, fontWeight: '700', flexShrink: 1 },
  status: { color: '#0B4D27', backgroundColor: '#E4F2E8', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999, fontSize: 11, fontWeight: '800' },
  cardTitle: { color: '#142018', fontSize: 17, fontWeight: '900', marginTop: 6 },
  muted: { color: '#6A756D', marginTop: 3 },
  route: { color: '#142018', fontWeight: '700', marginTop: 10 },
  description: { color: '#445049', marginTop: 7, lineHeight: 20 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 12 },
  tag: { color: '#445049', backgroundColor: '#EEF2EE', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8, fontSize: 12, fontWeight: '600' },
  driverActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginBottom: 10 },
  actionButton: { flexGrow: 1, backgroundColor: '#FFD11A', borderRadius: 11, padding: 14, alignItems: 'center' },
  actionButtonText: { color: '#17331F', fontWeight: '900' },
  disabledButton: { opacity: 0.45 },
  mapButton: { flexGrow: 1, borderWidth: 1, borderColor: '#0B4D27', borderRadius: 11, padding: 13, alignItems: 'center' },
  mapButtonText: { color: '#0B4D27', fontWeight: '900' },
  timeline: { backgroundColor: '#FFFFFF', borderRadius: 10, paddingHorizontal: 12, marginBottom: 20 },
  timelineRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: '#E7ECE8' },
  timelineLabel: { color: '#34443A', flex: 1 },
  timelineTime: { color: '#66736A', fontWeight: '700' },
  billingRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, marginBottom: 10, gap: 12, borderWidth: 1, borderColor: '#E2E8E2' },
  billingMain: { flex: 1 },
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
  formGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  formField: { minWidth: 220, flex: 1 },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#C7D1C9', borderRadius: 10, paddingHorizontal: 13, paddingVertical: 12, color: '#142018' },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  formActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 24 },
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
