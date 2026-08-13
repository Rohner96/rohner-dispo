import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppUser } from '../auth/demoAuth';
import { Customer, CustomerContact, Driver, OrderType, Project, Trailer, Vehicle } from '../domain/models';
import { toggleActive } from '../lib/masterData';

type Tab = 'customers' | 'drivers' | 'vehicles' | 'trailers' | 'users';

const tabs: { value: Tab; label: string }[] = [
  { value: 'customers', label: 'Kunden' },
  { value: 'drivers', label: 'Mitarbeiter' },
  { value: 'vehicles', label: 'LKW' },
  { value: 'trailers', label: 'Anhänger' },
  { value: 'users', label: 'Benutzer' },
];

const vehicleTypes: { value: OrderType; label: string }[] = [
  { value: 'kipper', label: 'Kipper' },
  { value: 'silo', label: 'Silowagen' },
  { value: 'fahrmischer', label: 'Fahrmischer' },
  { value: 'tieflader', label: 'Sattelschlepper / Tieflader' },
  { value: 'langware', label: 'Langware' },
  { value: 'kran', label: 'LKW-Kran' },
  { value: 'kombiniert', label: 'Kombiniert' },
];

interface Props {
  customers: Customer[];
  projects: Project[];
  drivers: Driver[];
  vehicles: Vehicle[];
  trailers: Trailer[];
  users: AppUser[];
  onCustomersChange: (items: Customer[]) => void;
  onProjectsChange: (items: Project[]) => void;
  onDriversChange: (items: Driver[]) => void;
  onVehiclesChange: (items: Vehicle[]) => void;
  onTrailersChange: (items: Trailer[]) => void;
  onUsersChange: (items: AppUser[]) => void;
}

function ActionButtons({ onEdit, onToggle, active }: { onEdit: () => void; onToggle: () => void; active: boolean }) {
  return (
    <View style={styles.rowActions}>
      <Pressable style={styles.editButton} onPress={onEdit}><Text style={styles.editText}>Bearbeiten</Text></Pressable>
      <Pressable style={[styles.stateButton, !active && styles.activateButton]} onPress={onToggle}>
        <Text style={[styles.stateText, !active && styles.activateText]}>{active ? 'Deaktivieren' : 'Aktivieren'}</Text>
      </Pressable>
    </View>
  );
}

export function MasterDataView(props: Props) {
  const [tab, setTab] = useState<Tab>('customers');
  const [editingId, setEditingId] = useState<string>();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>();
  const [editingContactId, setEditingContactId] = useState<string>();
  const [contactForm, setContactForm] = useState<Record<string, string>>({});
  const [editingProjectId, setEditingProjectId] = useState<string>();
  const [projectForm, setProjectForm] = useState<Record<string, string>>({});
  const [form, setForm] = useState<Record<string, string>>({});
  const [error, setError] = useState('');

  function beginNew() {
    setEditingId('new');
    setError('');
    if (tab === 'vehicles') setForm({ category: 'kipper' });
    else if (tab === 'users') setForm({ role: 'employee', driverId: '' });
    else setForm({});
  }

  function beginEdit(item: Customer | Driver | Vehicle | Trailer | AppUser) {
    setEditingId(item.id);
    setError('');
    if (tab === 'customers') {
      const value = item as Customer;
      setForm({ customerNumber: value.customerNumber, name: value.name, address: value.address ?? '' });
    } else if (tab === 'drivers') {
      const value = item as Driver;
      setForm({ personnelNumber: value.personnelNumber ?? '', name: value.name, phone: value.phone ?? '' });
    } else if (tab === 'vehicles') {
      const value = item as Vehicle;
      setForm({ internalNumber: value.internalNumber, label: value.label, category: value.category });
    } else if (tab === 'trailers') {
      const value = item as Trailer;
      setForm({ internalNumber: value.internalNumber, label: value.label });
    } else {
      const value = item as AppUser;
      setForm({ displayName: value.displayName, username: value.username, role: value.role, driverId: value.driverId ?? '' });
    }
  }

  function change(key: string, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function save() {
    const id = editingId === 'new' ? `${tab}-${Date.now()}` : editingId;
    if (!id) return;

    if (tab === 'customers') {
      if (!form.customerNumber?.trim() || !form.name?.trim()) return setError('Kundennummer und Kundenname sind erforderlich.');
      const old = props.customers.find((item) => item.id === id);
      const value: Customer = { id, customerNumber: form.customerNumber.trim(), name: form.name.trim(), address: form.address?.trim(), contacts: old?.contacts ?? [], active: old?.active ?? true };
      props.onCustomersChange(old ? props.customers.map((item) => item.id === id ? value : item) : [...props.customers, value]);
      if (old && old.name !== value.name) {
        props.onProjectsChange(props.projects.map((project) => project.customerId === id ? { ...project, customerName: value.name } : project));
      }
    } else if (tab === 'drivers') {
      if (!form.name?.trim()) return setError('Der Name ist erforderlich.');
      const old = props.drivers.find((item) => item.id === id);
      const value: Driver = { id, personnelNumber: form.personnelNumber?.trim(), name: form.name.trim(), phone: form.phone?.trim(), active: old?.active ?? true };
      props.onDriversChange(old ? props.drivers.map((item) => item.id === id ? value : item) : [...props.drivers, value]);
    } else if (tab === 'vehicles') {
      if (!form.internalNumber?.trim() || !form.label?.trim()) return setError('Interne Nummer und Bezeichnung sind erforderlich.');
      const old = props.vehicles.find((item) => item.id === id);
      const value: Vehicle = { id, internalNumber: form.internalNumber.trim(), label: form.label.trim(), category: (form.category || 'kipper') as OrderType, active: old?.active ?? true };
      props.onVehiclesChange(old ? props.vehicles.map((item) => item.id === id ? value : item) : [...props.vehicles, value]);
    } else if (tab === 'trailers') {
      if (!form.internalNumber?.trim() || !form.label?.trim()) return setError('Interne Nummer und Bezeichnung sind erforderlich.');
      const old = props.trailers.find((item) => item.id === id);
      const value: Trailer = { id, internalNumber: form.internalNumber.trim(), label: form.label.trim(), active: old?.active ?? true };
      props.onTrailersChange(old ? props.trailers.map((item) => item.id === id ? value : item) : [...props.trailers, value]);
    } else {
      if (!form.displayName?.trim() || !form.username?.trim()) return setError('Name und Benutzername sind erforderlich.');
      const old = props.users.find((item) => item.id === id);
      const value: AppUser = { id, displayName: form.displayName.trim(), username: form.username.trim().toLowerCase(), role: form.role === 'admin' ? 'admin' : 'employee', driverId: form.role === 'admin' ? undefined : form.driverId || undefined, active: old?.active ?? true };
      props.onUsersChange(old ? props.users.map((item) => item.id === id ? value : item) : [...props.users, value]);
    }
    setEditingId(undefined);
    setForm({});
    setError('');
  }

  function toggle(id: string) {
    if (tab === 'customers') props.onCustomersChange(toggleActive(props.customers, id));
    if (tab === 'drivers') props.onDriversChange(toggleActive(props.drivers, id));
    if (tab === 'vehicles') props.onVehiclesChange(toggleActive(props.vehicles, id));
    if (tab === 'trailers') props.onTrailersChange(toggleActive(props.trailers, id));
    if (tab === 'users') props.onUsersChange(toggleActive(props.users, id));
  }

  const addLabels: Record<Tab, string> = { customers: 'Kunde', drivers: 'Mitarbeiter', vehicles: 'LKW', trailers: 'Anhänger', users: 'Benutzer' };

  const selectedCustomer = props.customers.find((item) => item.id === selectedCustomerId);
  const customerProjects = props.projects.filter((item) => item.customerId === selectedCustomerId);

  function openCustomer(customer: Customer) {
    setSelectedCustomerId(customer.id);
    setEditingId(undefined);
    setEditingContactId(undefined);
    setEditingProjectId(undefined);
  }

  function beginContact(contact?: CustomerContact) {
    setEditingContactId(contact?.id ?? 'new');
    setContactForm(contact ? { name: contact.name, function: contact.function ?? '', phone: contact.phone ?? '', email: contact.email ?? '' } : {});
  }

  function saveContact() {
    if (!selectedCustomer || !editingContactId || !contactForm.name?.trim()) return;
    const id = editingContactId === 'new' ? `contact-${Date.now()}` : editingContactId;
    const value: CustomerContact = { id, name: contactForm.name.trim(), function: contactForm.function?.trim(), phone: contactForm.phone?.trim(), email: contactForm.email?.trim() };
    const exists = selectedCustomer.contacts.some((item) => item.id === id);
    const contacts = exists ? selectedCustomer.contacts.map((item) => item.id === id ? value : item) : [...selectedCustomer.contacts, value];
    props.onCustomersChange(props.customers.map((item) => item.id === selectedCustomer.id ? { ...item, contacts } : item));
    setEditingContactId(undefined);
    setContactForm({});
  }

  function beginProject(project?: Project) {
    setEditingProjectId(project?.id ?? 'new');
    setProjectForm(project ? { projectNumber: project.projectNumber ?? '', name: project.name, description: project.description ?? '' } : {});
  }

  function saveProject() {
    if (!selectedCustomer || !editingProjectId || !projectForm.name?.trim()) return;
    const id = editingProjectId === 'new' ? `project-${Date.now()}` : editingProjectId;
    const old = props.projects.find((item) => item.id === id);
    const value: Project = { id, customerId: selectedCustomer.id, customerName: selectedCustomer.name, projectNumber: projectForm.projectNumber?.trim(), name: projectForm.name.trim(), description: projectForm.description?.trim(), active: old?.active ?? true };
    props.onProjectsChange(old ? props.projects.map((item) => item.id === id ? value : item) : [...props.projects, value]);
    setEditingProjectId(undefined);
    setProjectForm({});
  }

  function toggleProject(id: string) {
    props.onProjectsChange(toggleActive(props.projects, id));
  }

  if (tab === 'customers' && selectedCustomer) {
    return (
      <View style={styles.section}>
        <Pressable style={styles.backButton} onPress={() => setSelectedCustomerId(undefined)}><Text style={styles.backText}>← Zur Kundenliste</Text></Pressable>
        <Text style={styles.eyebrow}>KUNDENMASKE</Text>
        <Text style={styles.heading}>{selectedCustomer.name}</Text>
        <Text style={styles.sub}>{selectedCustomer.customerNumber} · {selectedCustomer.address || 'Keine Adresse erfasst'}</Text>

        <View style={styles.detailSection}>
          <View style={styles.detailHeading}><View><Text style={styles.detailTitle}>Ansprechpersonen</Text><Text style={styles.sub}>Telefon, Funktion und E-Mail pro Kontakt</Text></View><Pressable style={styles.addButton} onPress={() => beginContact()}><Text style={styles.addText}>+ Kontakt</Text></Pressable></View>
          {editingContactId && <View style={styles.formCard}>
            <Field label="Vor- und Nachname" value={contactForm.name} onChange={(value) => setContactForm((current) => ({ ...current, name: value }))} />
            <Field label="Funktion" value={contactForm.function} onChange={(value) => setContactForm((current) => ({ ...current, function: value }))} />
            <Field label="Telefonnummer" value={contactForm.phone} onChange={(value) => setContactForm((current) => ({ ...current, phone: value }))} />
            <Field label="E-Mail-Adresse" value={contactForm.email} onChange={(value) => setContactForm((current) => ({ ...current, email: value }))} />
            <View style={styles.formActions}><Pressable style={styles.cancelButton} onPress={() => setEditingContactId(undefined)}><Text style={styles.cancelText}>Abbrechen</Text></Pressable><Pressable style={styles.saveButton} onPress={saveContact}><Text style={styles.saveText}>Kontakt speichern</Text></Pressable></View>
          </View>}
          {selectedCustomer.contacts.length === 0 ? <Text style={styles.empty}>Noch keine Ansprechperson erfasst.</Text> : selectedCustomer.contacts.map((contact) => <View key={contact.id} style={styles.detailRow}><View style={styles.rowMain}><Text style={styles.rowTitle}>{contact.name}</Text><Text style={styles.rowSub}>{[contact.function, contact.phone, contact.email].filter(Boolean).join(' · ')}</Text></View><Pressable style={styles.editButton} onPress={() => beginContact(contact)}><Text style={styles.editText}>Bearbeiten</Text></Pressable></View>)}
        </View>

        <View style={styles.detailSection}>
          <View style={styles.detailHeading}><View><Text style={styles.detailTitle}>Projekte</Text><Text style={styles.sub}>Diese Projekte erscheinen später bei der Auftragserfassung.</Text></View><Pressable style={styles.addButton} onPress={() => beginProject()}><Text style={styles.addText}>+ Projekt</Text></Pressable></View>
          {editingProjectId && <View style={styles.formCard}>
            <Field label="Projektnummer" value={projectForm.projectNumber} onChange={(value) => setProjectForm((current) => ({ ...current, projectNumber: value }))} />
            <Field label="Projektname" value={projectForm.name} onChange={(value) => setProjectForm((current) => ({ ...current, name: value }))} />
            <Field label="Beschreibung / Baustelle" value={projectForm.description} onChange={(value) => setProjectForm((current) => ({ ...current, description: value }))} />
            <View style={styles.formActions}><Pressable style={styles.cancelButton} onPress={() => setEditingProjectId(undefined)}><Text style={styles.cancelText}>Abbrechen</Text></Pressable><Pressable style={styles.saveButton} onPress={saveProject}><Text style={styles.saveText}>Projekt speichern</Text></Pressable></View>
          </View>}
          {customerProjects.length === 0 ? <Text style={styles.empty}>Noch kein Projekt erfasst.</Text> : customerProjects.map((project) => <View key={project.id} style={[styles.detailRow, !project.active && styles.inactiveRow]}><View style={styles.rowMain}><Text style={styles.rowTitle}>{project.projectNumber ? `${project.projectNumber} · ` : ''}{project.name}</Text>{project.description ? <Text style={styles.rowSub}>{project.description}</Text> : null}<Text style={[styles.status, !project.active && styles.inactiveStatus]}>{project.active ? 'Aktiv' : 'Inaktiv'}</Text></View><ActionButtons active={project.active} onEdit={() => beginProject(project)} onToggle={() => toggleProject(project.id)} /></View>)}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={styles.eyebrow}>ADMINISTRATION</Text>
      <View style={styles.headingRow}>
        <View><Text style={styles.heading}>Stammdaten</Text><Text style={styles.sub}>Testdaten verwalten; die zentrale Speicherung folgt später.</Text></View>
        <Pressable style={styles.addButton} onPress={beginNew}><Text style={styles.addText}>+ {addLabels[tab]}</Text></Pressable>
      </View>

      <View style={styles.tabs}>{tabs.map((item) => (
        <Pressable key={item.value} onPress={() => { setTab(item.value); setEditingId(undefined); setError(''); }} style={[styles.tab, tab === item.value && styles.tabActive]}>
          <Text style={[styles.tabText, tab === item.value && styles.tabTextActive]}>{item.label}</Text>
        </Pressable>
      ))}</View>

      {editingId ? (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>{editingId === 'new' ? `${addLabels[tab]} erfassen` : `${addLabels[tab]} bearbeiten`}</Text>
          {tab === 'customers' && <>
            <Field label="Kundennummer" value={form.customerNumber} onChange={(value) => change('customerNumber', value)} />
            <Field label="Kundenname" value={form.name} onChange={(value) => change('name', value)} />
            <Field label="Adresse / Ort" value={form.address} onChange={(value) => change('address', value)} />
          </>}
          {tab === 'drivers' && <>
            <Field label="Personalnummer" value={form.personnelNumber} onChange={(value) => change('personnelNumber', value)} />
            <Field label="Vor- und Nachname" value={form.name} onChange={(value) => change('name', value)} />
            <Field label="Telefon" value={form.phone} onChange={(value) => change('phone', value)} />
          </>}
          {tab === 'vehicles' && <>
            <Field label="Interne Nummer" value={form.internalNumber} onChange={(value) => change('internalNumber', value)} />
            <Field label="Bezeichnung" value={form.label} onChange={(value) => change('label', value)} />
            <Text style={styles.label}>Fahrzeugart</Text><View style={styles.options}>{vehicleTypes.map((item) => <Pressable key={item.value} onPress={() => change('category', item.value)} style={[styles.option, form.category === item.value && styles.optionActive]}><Text style={[styles.optionText, form.category === item.value && styles.optionTextActive]}>{item.label}</Text></Pressable>)}</View>
          </>}
          {tab === 'trailers' && <>
            <Field label="Interne Nummer" value={form.internalNumber} onChange={(value) => change('internalNumber', value)} />
            <Field label="Bezeichnung / Art" value={form.label} onChange={(value) => change('label', value)} />
          </>}
          {tab === 'users' && <>
            <Field label="Anzeigename" value={form.displayName} onChange={(value) => change('displayName', value)} />
            <Field label="Benutzername" value={form.username} onChange={(value) => change('username', value)} />
            <Text style={styles.label}>Berechtigung</Text><View style={styles.options}>{(['admin', 'employee'] as const).map((role) => <Pressable key={role} onPress={() => change('role', role)} style={[styles.option, form.role === role && styles.optionActive]}><Text style={[styles.optionText, form.role === role && styles.optionTextActive]}>{role === 'admin' ? 'Administrator' : 'Mitarbeiter'}</Text></Pressable>)}</View>
            {form.role !== 'admin' && <><Text style={styles.label}>Zugehöriger Mitarbeiter</Text><View style={styles.options}>{props.drivers.filter((item) => item.active).map((driver) => <Pressable key={driver.id} onPress={() => change('driverId', driver.id)} style={[styles.option, form.driverId === driver.id && styles.optionActive]}><Text style={[styles.optionText, form.driverId === driver.id && styles.optionTextActive]}>{driver.name}</Text></Pressable>)}</View></>}
          </>}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.formActions}><Pressable style={styles.cancelButton} onPress={() => setEditingId(undefined)}><Text style={styles.cancelText}>Abbrechen</Text></Pressable><Pressable style={styles.saveButton} onPress={save}><Text style={styles.saveText}>Speichern</Text></Pressable></View>
        </View>
      ) : null}

      {tab === 'customers' && props.customers.map((item) => <DataRow key={item.id} title={`${item.customerNumber} · ${item.name}`} subtitle={`${item.address || 'Keine Adresse'} · ${item.contacts.length} Kontakt(e) · ${props.projects.filter((project) => project.customerId === item.id).length} Projekt(e)`} active={item.active} onOpen={() => openCustomer(item)} onEdit={() => beginEdit(item)} onToggle={() => toggle(item.id)} />)}
      {tab === 'drivers' && props.drivers.map((item) => <DataRow key={item.id} title={`${item.personnelNumber || 'Ohne Nr.'} · ${item.name}`} subtitle={item.phone} active={item.active} onEdit={() => beginEdit(item)} onToggle={() => toggle(item.id)} />)}
      {tab === 'vehicles' && props.vehicles.map((item) => <DataRow key={item.id} title={`${item.internalNumber} · ${item.label}`} subtitle={vehicleTypes.find((type) => type.value === item.category)?.label} active={item.active} onEdit={() => beginEdit(item)} onToggle={() => toggle(item.id)} />)}
      {tab === 'trailers' && props.trailers.map((item) => <DataRow key={item.id} title={`${item.internalNumber} · ${item.label}`} active={item.active} onEdit={() => beginEdit(item)} onToggle={() => toggle(item.id)} />)}
      {tab === 'users' && <Text style={styles.warning}>Passwörter werden hier absichtlich nicht geführt. Bis zur Datenbank funktionieren weiterhin nur die bekannten Testzugänge.</Text>}
      {tab === 'users' && props.users.map((item) => <DataRow key={item.id} title={item.displayName} subtitle={`${item.username} · ${item.role === 'admin' ? 'Administrator' : 'Mitarbeiter'}`} active={item.active} onEdit={() => beginEdit(item)} onToggle={() => toggle(item.id)} />)}
    </View>
  );
}

function Field({ label, value, onChange }: { label: string; value?: string; onChange: (value: string) => void }) {
  return <View><Text style={styles.label}>{label}</Text><TextInput style={styles.input} value={value ?? ''} onChangeText={onChange} /></View>;
}

function DataRow({ title, subtitle, active, onOpen, onEdit, onToggle }: { title: string; subtitle?: string; active: boolean; onOpen?: () => void; onEdit: () => void; onToggle: () => void }) {
  return <View style={[styles.dataRow, !active && styles.inactiveRow]}><View style={styles.rowMain}><Text style={styles.rowTitle}>{title}</Text>{subtitle ? <Text style={styles.rowSub}>{subtitle}</Text> : null}<Text style={[styles.status, !active && styles.inactiveStatus]}>{active ? 'Aktiv' : 'Inaktiv'}</Text></View><View style={styles.rowActions}>{onOpen ? <Pressable style={styles.openButton} onPress={onOpen}><Text style={styles.openText}>Kundenmaske öffnen</Text></Pressable> : null}<ActionButtons active={active} onEdit={onEdit} onToggle={onToggle} /></View></View>;
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: 18, paddingBottom: 40 }, eyebrow: { color: '#5C6B60', fontSize: 11, fontWeight: '800', letterSpacing: 1.2 }, heading: { color: '#142018', fontSize: 26, fontWeight: '900', marginTop: 4 }, sub: { color: '#6A756D', marginTop: 4 }, headingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 18 }, addButton: { backgroundColor: '#0B4D27', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11 }, addText: { color: '#FFF', fontWeight: '800' },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }, tab: { backgroundColor: '#E7ECE8', borderRadius: 10, paddingHorizontal: 13, paddingVertical: 9 }, tabActive: { backgroundColor: '#0B4D27' }, tabText: { color: '#425047', fontWeight: '700' }, tabTextActive: { color: '#FFF' },
  formCard: { backgroundColor: '#E7ECE8', borderRadius: 14, padding: 16, marginBottom: 16 }, formTitle: { color: '#142018', fontSize: 18, fontWeight: '900', marginBottom: 4 }, label: { color: '#27362C', fontWeight: '800', marginTop: 12, marginBottom: 6 }, input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#C7D1C9', borderRadius: 10, paddingHorizontal: 13, paddingVertical: 12, color: '#142018' }, options: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, option: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#C7D1C9', borderRadius: 9, paddingHorizontal: 11, paddingVertical: 8 }, optionActive: { backgroundColor: '#0B4D27', borderColor: '#0B4D27' }, optionText: { color: '#34443A', fontWeight: '700' }, optionTextActive: { color: '#FFF' }, error: { color: '#B42318', fontWeight: '700', marginTop: 10 }, formActions: { flexDirection: 'row', gap: 9, marginTop: 16 }, cancelButton: { borderWidth: 1, borderColor: '#AAB6AD', backgroundColor: '#FFF', borderRadius: 10, padding: 13 }, cancelText: { color: '#34443A', fontWeight: '800' }, saveButton: { flex: 1, backgroundColor: '#0B4D27', borderRadius: 10, padding: 13, alignItems: 'center' }, saveText: { color: '#FFF', fontWeight: '800' },
  dataRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8E2', padding: 14, marginBottom: 8 }, inactiveRow: { opacity: 0.62 }, rowMain: { flex: 1 }, rowTitle: { color: '#142018', fontWeight: '800' }, rowSub: { color: '#6A756D', marginTop: 3 }, status: { color: '#0B4D27', fontSize: 11, fontWeight: '800', marginTop: 5 }, inactiveStatus: { color: '#7B342E' }, rowActions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 6 }, editButton: { backgroundColor: '#EEF2EE', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 }, editText: { color: '#34443A', fontWeight: '700', fontSize: 12 }, stateButton: { backgroundColor: '#FDE7E5', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 }, stateText: { color: '#8A2921', fontWeight: '700', fontSize: 12 }, activateButton: { backgroundColor: '#E4F2E8' }, activateText: { color: '#0B4D27' }, warning: { color: '#5E4B00', backgroundColor: '#FFF5C7', borderRadius: 10, padding: 13, marginBottom: 10, lineHeight: 19 },
  openButton: { backgroundColor: '#DCECE1', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 }, openText: { color: '#0B4D27', fontWeight: '800', fontSize: 12 }, backButton: { alignSelf: 'flex-start', marginBottom: 16, backgroundColor: '#E7ECE8', borderRadius: 9, paddingHorizontal: 12, paddingVertical: 9 }, backText: { color: '#0B4D27', fontWeight: '800' }, detailSection: { marginTop: 22, backgroundColor: '#FFF', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8E2', padding: 16 }, detailHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14 }, detailTitle: { color: '#142018', fontSize: 19, fontWeight: '900' }, detailRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, borderTopColor: '#E7ECE8', paddingVertical: 13 }, empty: { color: '#6A756D', paddingVertical: 12 },
});
