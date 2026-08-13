import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppUser } from '../auth/demoAuth';
import { CraneCapacity, Customer, CustomerContact, Driver, Project, Trailer, TrailerCategory, Vehicle, VehicleAxleConfiguration, VehicleCategory } from '../domain/models';
import { axleConfigurationsForVehicle, toggleActive } from '../lib/masterData';

type Tab = 'customers' | 'drivers' | 'vehicles' | 'trailers';
type Detail = { tab: Tab; id: string };

const tabs: { value: Tab; label: string; singular: string }[] = [
  { value: 'customers', label: 'Kunden', singular: 'Kunde' }, { value: 'drivers', label: 'Mitarbeiter', singular: 'Mitarbeiter' },
  { value: 'vehicles', label: 'LKW', singular: 'LKW' }, { value: 'trailers', label: 'Anhänger', singular: 'Anhänger' },
];
const vehicleTypes: { value: VehicleCategory; label: string }[] = [
  { value: 'sattelschlepper', label: 'Sattelschlepper' }, { value: 'kipper', label: 'Kipper' },
  { value: 'silo', label: 'Silowagen' }, { value: 'fahrmischer', label: 'Fahrmischer' },
];
const axleLabels: Record<VehicleAxleConfiguration, string> = { '2-achs': 'Zweiachs', '3-achs': 'Dreiachs', '4-achs': 'Vierachs', '5-achs': 'Fünfachs' };
const craneCapacities: CraneCapacity[] = [22, 23, 30, 54];
const trailerTypes: { value: TrailerCategory; label: string }[] = [
  { value: 'kippsattel', label: 'Kippsattel' },
  { value: 'semi_tieflader_ohne_kran', label: 'Semi-Tieflader ohne Kran' },
  { value: 'semi_tieflader_mit_kran', label: 'Semi-Tieflader mit Kran' },
];

interface Props {
  customers: Customer[]; projects: Project[]; drivers: Driver[]; vehicles: Vehicle[]; trailers: Trailer[]; users: AppUser[];
  onCustomersChange: (items: Customer[]) => void; onProjectsChange: (items: Project[]) => void;
  onDriversChange: (items: Driver[]) => void; onVehiclesChange: (items: Vehicle[]) => void;
  onTrailersChange: (items: Trailer[]) => void; onUsersChange: (items: AppUser[]) => void;
}

export function MasterDataView(props: Props) {
  const [tab, setTab] = useState<Tab>('customers');
  const [detail, setDetail] = useState<Detail>();
  const [form, setForm] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [contactId, setContactId] = useState<string>();
  const [contactForm, setContactForm] = useState<Record<string, string>>({});
  const [projectId, setProjectId] = useState<string>();
  const [projectForm, setProjectForm] = useState<Record<string, string>>({});
  const change = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const currentLabel = tabs.find((item) => item.value === tab)!;

  function openDetail(targetTab: Tab, id: string) {
    setTab(targetTab); setDetail({ tab: targetTab, id }); setError(''); setContactId(undefined); setProjectId(undefined);
    if (id === 'new') {
      setForm(targetTab === 'drivers' ? { function: 'Chauffeur', employmentPercentage: '100', defaultTrailerId: 'none', role: 'employee', portalActive: 'yes' } : targetTab === 'vehicles' ? { category: 'kipper', axleConfiguration: '3-achs', hasCrane: 'no' } : targetTab === 'trailers' ? { category: 'kippsattel' } : {});
      return;
    }
    if (targetTab === 'customers') {
      const value = props.customers.find((item) => item.id === id)!;
      setForm({ customerNumber: value.customerNumber, name: value.name, address: value.address ?? '' });
    } else if (targetTab === 'drivers') {
      const value = props.drivers.find((item) => item.id === id)!;
      const user = props.users.find((item) => item.driverId === id);
      setForm({ personnelNumber: value.personnelNumber ?? '', name: value.name, address: value.address ?? '', phone: value.phone ?? '', email: value.email ?? '', function: value.function ?? 'Chauffeur', employmentStart: value.employmentStart ?? '', employmentPercentage: value.employmentPercentage ? String(value.employmentPercentage) : '100', notes: value.notes ?? '', defaultVehicleId: value.defaultVehicleId ?? '', defaultTrailerId: value.defaultTrailerId ?? 'none', username: user?.username ?? '', role: user?.role ?? 'employee', portalActive: user?.active === false ? 'no' : 'yes' });
    } else if (targetTab === 'vehicles') {
      const value = props.vehicles.find((item) => item.id === id)!;
      setForm({ internalNumber: value.internalNumber, label: value.label, category: value.category, axleConfiguration: value.axleConfiguration, hasCrane: value.hasCrane ? 'yes' : 'no', craneCapacity: value.craneCapacity ? String(value.craneCapacity) : '' });
    } else {
      const value = props.trailers.find((item) => item.id === id)!;
      setForm({ internalNumber: value.internalNumber, label: value.label, category: value.category });
    }
  }

  function saveDetail() {
    if (!detail) return;
    const id = detail.id === 'new' ? `${detail.tab}-${Date.now()}` : detail.id;
    if (detail.tab === 'customers') {
      if (!form.customerNumber?.trim() || !form.name?.trim()) return setError('Kundennummer und Kundenname sind erforderlich.');
      const old = props.customers.find((item) => item.id === id);
      const value: Customer = { id, customerNumber: form.customerNumber.trim(), name: form.name.trim(), address: form.address?.trim(), contacts: old?.contacts ?? [], active: old?.active ?? true };
      props.onCustomersChange(old ? props.customers.map((item) => item.id === id ? value : item) : [...props.customers, value]);
      if (old?.name !== value.name) props.onProjectsChange(props.projects.map((item) => item.customerId === id ? { ...item, customerName: value.name } : item));
    } else if (detail.tab === 'drivers') {
      if (!form.name?.trim() || !form.username?.trim()) return setError('Name und Benutzername sind erforderlich.');
      const username = form.username.trim().toLowerCase();
      if (props.users.some((item) => item.username.toLowerCase() === username && item.driverId !== id)) return setError('Dieser Benutzername wird bereits verwendet.');
      const old = props.drivers.find((item) => item.id === id); const percentage = Number(form.employmentPercentage);
      const value: Driver = { id, personnelNumber: form.personnelNumber?.trim(), name: form.name.trim(), address: form.address?.trim(), phone: form.phone?.trim(), email: form.email?.trim(), function: form.function?.trim(), employmentStart: form.employmentStart?.trim(), employmentPercentage: Number.isFinite(percentage) ? percentage : undefined, notes: form.notes?.trim(), defaultVehicleId: form.defaultVehicleId || undefined, defaultTrailerId: form.defaultTrailerId && form.defaultTrailerId !== 'none' ? form.defaultTrailerId : undefined, active: old?.active ?? true };
      props.onDriversChange(old ? props.drivers.map((item) => item.id === id ? value : item) : [...props.drivers, value]);
      const oldUser = props.users.find((item) => item.driverId === id);
      const user: AppUser = { id: oldUser?.id ?? `user-${id}`, displayName: value.name, username, role: form.role === 'admin' ? 'admin' : 'employee', driverId: id, active: form.portalActive !== 'no' };
      props.onUsersChange(oldUser ? props.users.map((item) => item.id === oldUser.id ? user : item) : [...props.users, user]);
    } else if (detail.tab === 'vehicles') {
      if (!form.internalNumber?.trim() || !form.label?.trim()) return setError('Kurzform und interne Bezeichnung sind erforderlich.');
      const category = (form.category || 'kipper') as VehicleCategory;
      const allowedAxles = axleConfigurationsForVehicle(category);
      if (!allowedAxles.includes(form.axleConfiguration as VehicleAxleConfiguration)) return setError('Bitte eine passende Achsausführung auswählen.');
      if (form.hasCrane === 'yes' && !craneCapacities.includes(Number(form.craneCapacity) as CraneCapacity)) return setError('Bitte die Kranleistung auswählen.');
      const old = props.vehicles.find((item) => item.id === id);
      const value: Vehicle = { id, internalNumber: form.internalNumber.trim(), label: form.label.trim(), category, axleConfiguration: form.axleConfiguration as VehicleAxleConfiguration, hasCrane: form.hasCrane === 'yes', craneCapacity: form.hasCrane === 'yes' ? Number(form.craneCapacity) as CraneCapacity : undefined, active: old?.active ?? true };
      props.onVehiclesChange(old ? props.vehicles.map((item) => item.id === id ? value : item) : [...props.vehicles, value]);
    } else {
      if (!form.internalNumber?.trim() || !form.label?.trim()) return setError('Kurzform und interne Bezeichnung sind erforderlich.');
      const old = props.trailers.find((item) => item.id === id);
      const value: Trailer = { id, internalNumber: form.internalNumber.trim(), label: form.label.trim(), category: (form.category || 'kippsattel') as TrailerCategory, active: old?.active ?? true };
      props.onTrailersChange(old ? props.trailers.map((item) => item.id === id ? value : item) : [...props.trailers, value]);
    }
    setError(''); setDetail(undefined);
  }

  function toggleCurrent() {
    if (!detail || detail.id === 'new') return;
    if (detail.tab === 'customers') props.onCustomersChange(toggleActive(props.customers, detail.id));
    if (detail.tab === 'vehicles') props.onVehiclesChange(toggleActive(props.vehicles, detail.id));
    if (detail.tab === 'trailers') props.onTrailersChange(toggleActive(props.trailers, detail.id));
    if (detail.tab === 'drivers') {
      const driver = props.drivers.find((item) => item.id === detail.id);
      props.onDriversChange(toggleActive(props.drivers, detail.id));
      if (driver) props.onUsersChange(props.users.map((item) => item.driverId === detail.id ? { ...item, active: !driver.active } : item));
    }
  }

  const detailActive = detail?.id === 'new' ? true : detail?.tab === 'customers' ? props.customers.find((i) => i.id === detail.id)?.active : detail?.tab === 'drivers' ? props.drivers.find((i) => i.id === detail.id)?.active : detail?.tab === 'vehicles' ? props.vehicles.find((i) => i.id === detail.id)?.active : props.trailers.find((i) => i.id === detail?.id)?.active;
  const customer = detail?.tab === 'customers' && detail.id !== 'new' ? props.customers.find((item) => item.id === detail.id) : undefined;
  const selectedVehicleCategory = (form.category || 'kipper') as VehicleCategory;
  const vehicleAxleOptions = axleConfigurationsForVehicle(selectedVehicleCategory).map((value) => ({ value, label: axleLabels[value] }));

  function changeVehicleCategory(value: string) {
    const category = value as VehicleCategory;
    const allowedAxles = axleConfigurationsForVehicle(category);
    setForm((current) => ({ ...current, category, axleConfiguration: allowedAxles.includes(current.axleConfiguration as VehicleAxleConfiguration) ? current.axleConfiguration! : allowedAxles[0]! }));
  }

  function saveContact() {
    if (!customer || !contactId || !contactForm.name?.trim()) return;
    const id = contactId === 'new' ? `contact-${Date.now()}` : contactId;
    const value: CustomerContact = { id, name: contactForm.name.trim(), function: contactForm.function?.trim(), phone: contactForm.phone?.trim(), email: contactForm.email?.trim() };
    const contacts = customer.contacts.some((item) => item.id === id) ? customer.contacts.map((item) => item.id === id ? value : item) : [...customer.contacts, value];
    props.onCustomersChange(props.customers.map((item) => item.id === customer.id ? { ...item, contacts } : item)); setContactId(undefined);
  }
  function saveProject() {
    if (!customer || !projectId || !projectForm.name?.trim()) return;
    const id = projectId === 'new' ? `project-${Date.now()}` : projectId; const old = props.projects.find((item) => item.id === id);
    const value: Project = { id, customerId: customer.id, customerName: customer.name, projectNumber: projectForm.projectNumber?.trim(), name: projectForm.name.trim(), description: projectForm.description?.trim(), active: old?.active ?? true };
    props.onProjectsChange(old ? props.projects.map((item) => item.id === id ? value : item) : [...props.projects, value]); setProjectId(undefined);
  }

  if (detail) return <View style={styles.section}>
    <Pressable style={styles.backButton} onPress={() => setDetail(undefined)}><Text style={styles.backText}>← Zur Übersicht</Text></Pressable>
    <Text style={styles.eyebrow}>DETAILS</Text><Text style={styles.heading}>{detail.id === 'new' ? `${currentLabel.singular} erfassen` : form.name || form.label}</Text>
    <View style={styles.formCard}>
      {detail.tab === 'customers' && <><Field label="Kundennummer" value={form.customerNumber} onChange={(v) => change('customerNumber', v)} /><Field label="Kundenname" value={form.name} onChange={(v) => change('name', v)} /><Field label="Adresse / Ort" value={form.address} onChange={(v) => change('address', v)} /></>}
      {detail.tab === 'drivers' && <><Field label="Personalnummer" value={form.personnelNumber} onChange={(v) => change('personnelNumber', v)} /><Field label="Vor- und Nachname" value={form.name} onChange={(v) => change('name', v)} /><Field label="Adresse / Wohnort" value={form.address} onChange={(v) => change('address', v)} /><Field label="Telefon" value={form.phone} onChange={(v) => change('phone', v)} /><Field label="E-Mail-Adresse" value={form.email} onChange={(v) => change('email', v)} /><Field label="Funktion" value={form.function} onChange={(v) => change('function', v)} /><Field label="Eintrittsdatum" value={form.employmentStart} onChange={(v) => change('employmentStart', v)} /><Field label="Arbeitspensum in %" value={form.employmentPercentage} onChange={(v) => change('employmentPercentage', v)} /><Field label="Interne Bemerkungen" value={form.notes} onChange={(v) => change('notes', v)} />
        <Text style={styles.groupTitle}>Standardgespann</Text><OptionGroup label="Standard-LKW" options={[{ value: '', label: 'Keine Vorgabe' }, ...props.vehicles.filter((i) => i.active).map((i) => ({ value: i.id, label: `${i.internalNumber} · ${i.label}` }))]} selected={form.defaultVehicleId ?? ''} onSelect={(v) => change('defaultVehicleId', v)} /><OptionGroup label="Standard-Anhänger" options={[{ value: 'none', label: 'Ohne Anhänger' }, ...props.trailers.filter((i) => i.active).map((i) => ({ value: i.id, label: `${i.internalNumber} · ${i.label}` }))]} selected={form.defaultTrailerId ?? 'none'} onSelect={(v) => change('defaultTrailerId', v)} />
        <Text style={styles.groupTitle}>Portalzugang</Text><Field label="Benutzername" value={form.username} onChange={(v) => change('username', v)} /><OptionGroup label="Berechtigung" options={[{ value: 'employee', label: 'Mitarbeiter' }, { value: 'admin', label: 'Administrator' }]} selected={form.role ?? 'employee'} onSelect={(v) => change('role', v)} /><OptionGroup label="Portalzugang" options={[{ value: 'yes', label: 'Aktiv' }, { value: 'no', label: 'Gesperrt' }]} selected={form.portalActive ?? 'yes'} onSelect={(v) => change('portalActive', v)} /><Text style={styles.warning}>Testpasswort: «demo». Passwörter werden nicht in den Stammdaten gespeichert.</Text></>}
      {detail.tab === 'vehicles' && <><Field label="Kurzform" value={form.internalNumber} onChange={(v) => change('internalNumber', v)} /><Field label="Interne Bezeichnung" value={form.label} onChange={(v) => change('label', v)} /><OptionGroup label="Fahrzeugart" options={vehicleTypes} selected={form.category ?? 'kipper'} onSelect={changeVehicleCategory} /><OptionGroup label="Achsausführung" options={vehicleAxleOptions} selected={form.axleConfiguration ?? vehicleAxleOptions[0]?.value ?? ''} onSelect={(v) => change('axleConfiguration', v)} /><OptionGroup label="Kran vorhanden" options={[{ value: 'no', label: 'Nein' }, { value: 'yes', label: 'Ja' }]} selected={form.hasCrane ?? 'no'} onSelect={(v) => { change('hasCrane', v); if (v === 'no') change('craneCapacity', ''); }} />{form.hasCrane === 'yes' ? <OptionGroup label="Kranleistung" options={craneCapacities.map((capacity) => ({ value: String(capacity), label: `${capacity} Metertonnen` }))} selected={form.craneCapacity ?? ''} onSelect={(v) => change('craneCapacity', v)} /> : null}</>}
      {detail.tab === 'trailers' && <><Field label="Kurzform" value={form.internalNumber} onChange={(v) => change('internalNumber', v)} /><Field label="Interne Bezeichnung" value={form.label} onChange={(v) => change('label', v)} /><OptionGroup label="Anhängerart" options={trailerTypes} selected={form.category ?? 'kippsattel'} onSelect={(v) => change('category', v)} /></>}
      {error ? <Text style={styles.error}>{error}</Text> : null}<View style={styles.formActions}><Pressable style={styles.saveButton} onPress={saveDetail}><Text style={styles.saveText}>Speichern</Text></Pressable>{detail.id !== 'new' ? <Pressable style={[styles.stateButton, !detailActive && styles.activateButton]} onPress={toggleCurrent}><Text style={[styles.stateText, !detailActive && styles.activateText]}>{detailActive ? 'Deaktivieren' : 'Aktivieren'}</Text></Pressable> : null}</View>
    </View>
    {customer ? <><DetailSection title="Ansprechpersonen" action="+ Kontakt" onAction={() => { setContactId('new'); setContactForm({}); }}>
      {contactId ? <InlineForm><Field label="Name" value={contactForm.name} onChange={(v) => setContactForm((c) => ({ ...c, name: v }))} /><Field label="Funktion" value={contactForm.function} onChange={(v) => setContactForm((c) => ({ ...c, function: v }))} /><Field label="Telefon" value={contactForm.phone} onChange={(v) => setContactForm((c) => ({ ...c, phone: v }))} /><Field label="E-Mail" value={contactForm.email} onChange={(v) => setContactForm((c) => ({ ...c, email: v }))} /><Pressable style={styles.saveButton} onPress={saveContact}><Text style={styles.saveText}>Kontakt speichern</Text></Pressable></InlineForm> : null}
      {customer.contacts.map((item) => <DetailRow key={item.id} title={item.name} subtitle={[item.function, item.phone, item.email].filter(Boolean).join(' · ')} onDetails={() => { setContactId(item.id); setContactForm({ name: item.name, function: item.function ?? '', phone: item.phone ?? '', email: item.email ?? '' }); }} />)}
    </DetailSection><DetailSection title="Projekte" action="+ Projekt" onAction={() => { setProjectId('new'); setProjectForm({}); }}>
      {projectId ? <InlineForm><Field label="Projektnummer" value={projectForm.projectNumber} onChange={(v) => setProjectForm((c) => ({ ...c, projectNumber: v }))} /><Field label="Projektname" value={projectForm.name} onChange={(v) => setProjectForm((c) => ({ ...c, name: v }))} /><Field label="Beschreibung" value={projectForm.description} onChange={(v) => setProjectForm((c) => ({ ...c, description: v }))} /><Pressable style={styles.saveButton} onPress={saveProject}><Text style={styles.saveText}>Projekt speichern</Text></Pressable></InlineForm> : null}
      {props.projects.filter((item) => item.customerId === customer.id).map((item) => <DetailRow key={item.id} title={`${item.projectNumber ? `${item.projectNumber} · ` : ''}${item.name}`} subtitle={`${item.description ?? ''}${item.active ? '' : ' · Inaktiv'}`} onDetails={() => { setProjectId(item.id); setProjectForm({ projectNumber: item.projectNumber ?? '', name: item.name, description: item.description ?? '' }); }} />)}
    </DetailSection></> : null}
  </View>;

  return <View style={styles.section}><Text style={styles.eyebrow}>ADMINISTRATION</Text><View style={styles.headingRow}><View><Text style={styles.heading}>Stammdaten</Text><Text style={styles.sub}>Eintrag öffnen und in der Detailmaske bearbeiten.</Text></View><Pressable style={styles.addButton} onPress={() => openDetail(tab, 'new')}><Text style={styles.addText}>+ {currentLabel.singular}</Text></Pressable></View>
    <View style={styles.tabs}>{tabs.map((item) => <Pressable key={item.value} onPress={() => setTab(item.value)} style={[styles.tab, tab === item.value && styles.tabActive]}><Text style={[styles.tabText, tab === item.value && styles.tabTextActive]}>{item.label}</Text></Pressable>)}</View>
    {tab === 'customers' && props.customers.map((item) => <ListRow key={item.id} title={`${item.customerNumber} · ${item.name}`} subtitle={`${item.address || 'Keine Adresse'} · ${item.contacts.length} Kontakt(e) · ${props.projects.filter((p) => p.customerId === item.id).length} Projekt(e)`} active={item.active} onDetails={() => openDetail(tab, item.id)} />)}
    {tab === 'drivers' && props.drivers.map((item) => { const vehicle = props.vehicles.find((v) => v.id === item.defaultVehicleId); const trailer = props.trailers.find((t) => t.id === item.defaultTrailerId); return <ListRow key={item.id} title={`${item.personnelNumber || 'Ohne Nr.'} · ${item.name}`} subtitle={`${item.function || 'Mitarbeiter'} · ${vehicle?.internalNumber || 'Kein Standard-LKW'}${trailer ? ` + ${trailer.internalNumber}` : ''}`} active={item.active} onDetails={() => openDetail(tab, item.id)} />; })}
    {tab === 'vehicles' && props.vehicles.map((item) => <ListRow key={item.id} title={item.label} subtitle={`${item.internalNumber} · ${vehicleTypes.find((type) => type.value === item.category)?.label ?? 'Fahrzeugart offen'} · ${axleLabels[item.axleConfiguration]}${item.hasCrane ? ` · Kran ${item.craneCapacity} Metertonnen` : ' · Ohne Kran'}`} active={item.active} onDetails={() => openDetail(tab, item.id)} />)}
    {tab === 'trailers' && props.trailers.map((item) => <ListRow key={item.id} title={item.label} subtitle={`${item.internalNumber} · ${trailerTypes.find((type) => type.value === item.category)?.label ?? 'Anhängerart offen'}`} active={item.active} onDetails={() => openDetail(tab, item.id)} />)}
  </View>;
}

function Field({ label, value, onChange }: { label: string; value?: string; onChange: (value: string) => void }) { return <View><Text style={styles.label}>{label}</Text><TextInput style={styles.input} value={value ?? ''} onChangeText={onChange} /></View>; }
function OptionGroup({ label, options, selected, onSelect }: { label: string; options: { value: string; label: string }[]; selected: string; onSelect: (value: string) => void }) { return <><Text style={styles.label}>{label}</Text><View style={styles.options}>{options.map((item) => <Pressable key={item.value || 'empty'} onPress={() => onSelect(item.value)} style={[styles.option, selected === item.value && styles.optionActive]}><Text style={[styles.optionText, selected === item.value && styles.optionTextActive]}>{item.label}</Text></Pressable>)}</View></>; }
function ListRow({ title, subtitle, active, onDetails }: { title: string; subtitle?: string; active: boolean; onDetails: () => void }) { return <View style={[styles.dataRow, !active && styles.inactiveRow]}><View style={styles.rowMain}><Text style={styles.rowTitle}>{title}</Text>{subtitle ? <Text style={styles.rowSub}>{subtitle}</Text> : null}<Text style={[styles.status, !active && styles.inactiveStatus]}>{active ? 'Aktiv' : 'Inaktiv'}</Text></View><Pressable style={styles.detailsButton} onPress={onDetails}><Text style={styles.detailsText}>Details</Text></Pressable></View>; }
function DetailRow({ title, subtitle, onDetails }: { title: string; subtitle?: string; onDetails: () => void }) { return <View style={styles.detailRow}><View style={styles.rowMain}><Text style={styles.rowTitle}>{title}</Text>{subtitle ? <Text style={styles.rowSub}>{subtitle}</Text> : null}</View><Pressable style={styles.detailsButton} onPress={onDetails}><Text style={styles.detailsText}>Details</Text></Pressable></View>; }
function DetailSection({ title, action, onAction, children }: { title: string; action: string; onAction: () => void; children: React.ReactNode }) { return <View style={styles.detailSection}><View style={styles.detailHeading}><Text style={styles.detailTitle}>{title}</Text><Pressable style={styles.addButton} onPress={onAction}><Text style={styles.addText}>{action}</Text></Pressable></View>{children}</View>; }
function InlineForm({ children }: { children: React.ReactNode }) { return <View style={styles.inlineForm}>{children}</View>; }

const styles = StyleSheet.create({
  section: { paddingHorizontal: 18, paddingBottom: 40 }, eyebrow: { color: '#5C6B60', fontSize: 11, fontWeight: '800', letterSpacing: 1.2 }, heading: { color: '#142018', fontSize: 26, fontWeight: '900', marginTop: 4 }, sub: { color: '#6A756D', marginTop: 4 }, headingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 18 }, addButton: { backgroundColor: '#0B4D27', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11 }, addText: { color: '#FFF', fontWeight: '800' },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }, tab: { backgroundColor: '#E7ECE8', borderRadius: 10, paddingHorizontal: 13, paddingVertical: 9 }, tabActive: { backgroundColor: '#0B4D27' }, tabText: { color: '#425047', fontWeight: '700' }, tabTextActive: { color: '#FFF' },
  formCard: { backgroundColor: '#E7ECE8', borderRadius: 14, padding: 16, marginTop: 14, marginBottom: 16 }, label: { color: '#27362C', fontWeight: '800', marginTop: 12, marginBottom: 6 }, input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#C7D1C9', borderRadius: 10, paddingHorizontal: 13, paddingVertical: 12, color: '#142018' }, options: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, option: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#C7D1C9', borderRadius: 9, paddingHorizontal: 11, paddingVertical: 8 }, optionActive: { backgroundColor: '#0B4D27', borderColor: '#0B4D27' }, optionText: { color: '#34443A', fontWeight: '700' }, optionTextActive: { color: '#FFF' },
  groupTitle: { color: '#142018', fontSize: 17, fontWeight: '900', marginTop: 22, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#C7D1C9' }, warning: { color: '#5E4B00', backgroundColor: '#FFF5C7', borderRadius: 10, padding: 13, marginTop: 14, lineHeight: 19 }, error: { color: '#B42318', fontWeight: '700', marginTop: 10 }, formActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 16 }, saveButton: { flexGrow: 1, backgroundColor: '#0B4D27', borderRadius: 10, padding: 13, alignItems: 'center', marginTop: 12 }, saveText: { color: '#FFF', fontWeight: '800' }, stateButton: { backgroundColor: '#FDE7E5', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, marginTop: 12 }, stateText: { color: '#8A2921', fontWeight: '800' }, activateButton: { backgroundColor: '#E4F2E8' }, activateText: { color: '#0B4D27' },
  dataRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8E2', padding: 14, marginBottom: 8 }, inactiveRow: { opacity: 0.62 }, rowMain: { flex: 1 }, rowTitle: { color: '#142018', fontWeight: '800' }, rowSub: { color: '#6A756D', marginTop: 3 }, status: { color: '#0B4D27', fontSize: 11, fontWeight: '800', marginTop: 5 }, inactiveStatus: { color: '#7B342E' }, detailsButton: { backgroundColor: '#DCECE1', borderRadius: 9, paddingHorizontal: 13, paddingVertical: 10 }, detailsText: { color: '#0B4D27', fontWeight: '900' }, backButton: { alignSelf: 'flex-start', marginBottom: 16, backgroundColor: '#E7ECE8', borderRadius: 9, paddingHorizontal: 12, paddingVertical: 9 }, backText: { color: '#0B4D27', fontWeight: '800' },
  detailSection: { marginTop: 18, backgroundColor: '#FFF', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8E2', padding: 16 }, detailHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 10 }, detailTitle: { color: '#142018', fontSize: 19, fontWeight: '900' }, detailRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, borderTopColor: '#E7ECE8', paddingVertical: 13 }, inlineForm: { backgroundColor: '#E7ECE8', borderRadius: 12, padding: 13, marginBottom: 12 },
});
