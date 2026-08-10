import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Image,
  useWindowDimensions,
} from 'react-native';

import { drivers, initialOrders, projects, trailers, vehicles } from './src/data/demoData';
import { AppUser, authenticateDemoUser, demoUsers } from './src/auth/demoAuth';
import {
  BillingMode,
  OrderStatus,
  OrderType,
  TransportOrder,
} from './src/domain/models';
import { buildBillingPool, formatChf } from './src/lib/billing';

type Screen = 'calendar' | 'newOrder' | 'driver' | 'billing' | 'masterData' | 'users';

const statusLabels: Record<OrderStatus, string> = {
  anfrage: 'Anfrage',
  provisorisch: 'Provisorisch',
  bestaetigt: 'Bestätigt',
  zugeteilt: 'Zugeordnet',
  unterwegs: 'Unterwegs',
  abgeschlossen: 'Abgeschlossen',
  kontrolliert: 'Kontrolliert',
  verrechenbar: 'Verrechenbar',
  verrechnet: 'Verrechnet',
};

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

function OrderCard({ order, compact = false }: { order: TransportOrder; compact?: boolean }) {
  const project = lookup(projects, order.projectId);
  const driver = lookup(drivers, order.driverId);
  const vehicle = lookup(vehicles, order.vehicleId);
  const trailer = lookup(trailers, order.trailerId);

  return (
    <View style={[styles.card, { borderLeftColor: typeColors[order.type] }]}>
      <View style={styles.cardTopline}>
        <Text style={styles.orderNumber}>{order.orderNumber} · {typeLabels[order.type]}</Text>
        <Text style={styles.status}>{statusLabels[order.status]}</Text>
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

function DispositionView({
  orders,
  onNewOrder,
}: {
  orders: TransportOrder[];
  onNewOrder: () => void;
}) {
  const dates = [...new Set(orders.map((order) => order.date))].sort();

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeading}>
        <View style={styles.headingBlock}>
          <Text style={styles.eyebrow}>OPERATIVE PLANUNG</Text>
          <Text style={styles.heading}>Dispositionskalender</Text>
        </View>
        <Pressable style={styles.primaryButton} onPress={onNewOrder}>
          <Text style={styles.primaryButtonText}>+ Auftrag</Text>
        </Pressable>
      </View>
      {dates.map((date) => (
        <View key={date} style={styles.dayBlock}>
          <Text style={styles.dayTitle}>{date}</Text>
          {orders.filter((order) => order.date === date).map((order) => (
            <OrderCard key={order.id} order={order} compact />
          ))}
        </View>
      ))}
    </View>
  );
}

function OrderForm({
  onSave,
  onCancel,
}: {
  onSave: (order: TransportOrder) => void;
  onCancel: () => void;
}) {
  const [projectId, setProjectId] = useState(projects[0]?.id ?? '');
  const [type, setType] = useState<OrderType>('kipper');
  const [billingMode, setBillingMode] = useState<BillingMode>('stunde');
  const [date, setDate] = useState('2026-08-13');
  const [timeWindow, setTimeWindow] = useState('07:00–17:00');
  const [title, setTitle] = useState('Neuer Transportauftrag');
  const [pickup, setPickup] = useState('Abholort');
  const [delivery, setDelivery] = useState('Abladeort');
  const [description, setDescription] = useState('Bemerkungen zum Auftrag');
  const [driverId, setDriverId] = useState(drivers[0]?.id ?? '');
  const [vehicleId, setVehicleId] = useState(vehicles[0]?.id ?? '');
  const [trailerId, setTrailerId] = useState('none');

  function save() {
    const number = `A-2026-${String(Date.now()).slice(-4)}`;
    onSave({
      id: `order-${Date.now()}`,
      orderNumber: number,
      type,
      status: 'zugeteilt',
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

      <Text style={styles.fieldLabel}>Kunde und Projekt</Text>
      <ChoiceRow
        options={projects.map((project) => ({
          value: project.id,
          label: `${project.customerName} · ${project.name}`,
        }))}
        selected={projectId}
        onSelect={setProjectId}
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
      <ChoiceRow
        options={drivers.map((driver) => ({ value: driver.id, label: driver.name }))}
        selected={driverId}
        onSelect={setDriverId}
      />

      <Text style={styles.fieldLabel}>LKW</Text>
      <ChoiceRow
        options={vehicles.map((vehicle) => ({
          value: vehicle.id,
          label: `${vehicle.internalNumber} · ${vehicle.label}`,
        }))}
        selected={vehicleId}
        onSelect={setVehicleId}
      />

      <Text style={styles.fieldLabel}>Anhänger / Auflieger</Text>
      <ChoiceRow
        options={[
          { value: 'none', label: 'Ohne Anhänger' },
          ...trailers.map((trailer) => ({
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
  onAdvance,
}: {
  orders: TransportOrder[];
  user: AppUser;
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
          <OrderCard order={order} />
          <Pressable
            disabled={order.status === 'verrechnet'}
            style={styles.actionButton}
            onPress={() => onAdvance(order.id)}
          >
            <Text style={styles.actionButtonText}>Nächsten Status melden</Text>
          </Pressable>
        </View>
      ))}
      {assigned.length === 0 && <Text style={styles.empty}>Keine Aufträge zugeteilt.</Text>}
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

function OfficeView({ orders }: { orders: TransportOrder[] }) {
  const candidates = buildBillingPool(orders, projects);

  return (
    <View style={styles.section}>
      <Text style={styles.eyebrow}>KONTROLLE & VERRECHNUNG</Text>
      <Text style={styles.heading}>Unverrechnete Leistungen</Text>
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
        <Text style={styles.empty}>Noch keine kontrollierten Leistungen zur Verrechnung.</Text>
      )}
    </View>
  );
}

function MasterDataView() {
  return (
    <View style={styles.section}>
      <Text style={styles.eyebrow}>GRUNDLAGEN</Text>
      <Text style={styles.heading}>Stammdaten</Text>

      <Text style={styles.listHeading}>Chauffeure</Text>
      {drivers.map((driver) => (
        <View key={driver.id} style={styles.listRow}>
          <Text style={styles.listTitle}>{driver.name}</Text>
          <Text style={styles.activeLabel}>Aktiv</Text>
        </View>
      ))}

      <Text style={styles.listHeading}>LKW</Text>
      {vehicles.map((vehicle) => (
        <View key={vehicle.id} style={styles.listRow}>
          <View>
            <Text style={styles.listTitle}>{vehicle.internalNumber}</Text>
            <Text style={styles.muted}>{vehicle.label}</Text>
          </View>
          <Text style={styles.activeLabel}>Aktiv</Text>
        </View>
      ))}

      <Text style={styles.listHeading}>Anhänger und Auflieger</Text>
      {trailers.map((trailer) => (
        <View key={trailer.id} style={styles.listRow}>
          <View>
            <Text style={styles.listTitle}>{trailer.internalNumber}</Text>
            <Text style={styles.muted}>{trailer.label}</Text>
          </View>
          <Text style={styles.activeLabel}>Aktiv</Text>
        </View>
      ))}
    </View>
  );
}

function UserManagementView() {
  return (
    <View style={styles.section}>
      <Text style={styles.eyebrow}>ADMINISTRATION</Text>
      <Text style={styles.heading}>Benutzer und Rechte</Text>
      <Text style={styles.infoBox}>
        Diese Konten sind vorläufige Testzugänge. Echte Passwörter werden später sicher auf dem Server gespeichert.
      </Text>
      {demoUsers.map((user) => (
        <View key={user.id} style={styles.listRow}>
          <View>
            <Text style={styles.listTitle}>{user.displayName}</Text>
            <Text style={styles.muted}>Benutzername: {user.username}</Text>
          </View>
          <Text style={user.role === 'admin' ? styles.adminLabel : styles.employeeLabel}>
            {user.role === 'admin' ? 'Administrator' : 'Mitarbeiter'}
          </Text>
        </View>
      ))}
    </View>
  );
}

function SummaryBar({ orders }: { orders: TransportOrder[] }) {
  return (
    <View style={styles.stats}>
      <View style={styles.stat}>
        <Text style={styles.statValue}>{orders.length}</Text>
        <Text style={styles.muted}>Aufträge</Text>
      </View>
      <View style={styles.stat}>
        <Text style={styles.statValue}>{vehicles.length}</Text>
        <Text style={styles.muted}>LKW</Text>
      </View>
      <View style={styles.stat}>
        <Text style={styles.statValue}>{trailers.length}</Text>
        <Text style={styles.muted}>Anhänger</Text>
      </View>
      <View style={styles.stat}>
        <Text style={styles.statValue}>{drivers.length}</Text>
        <Text style={styles.muted}>Chauffeure</Text>
      </View>
    </View>
  );
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<AppUser>();
  const [screen, setScreen] = useState<Screen>('calendar');
  const [orders, setOrders] = useState(initialOrders);
  const [message, setMessage] = useState('');
  const { width } = useWindowDimensions();
  const maxWidth = width > 1100 ? 1040 : width;

  const nextStatus = useMemo<Record<OrderStatus, OrderStatus>>(() => ({
    anfrage: 'provisorisch',
    provisorisch: 'bestaetigt',
    bestaetigt: 'zugeteilt',
    zugeteilt: 'unterwegs',
    unterwegs: 'abgeschlossen',
    abgeschlossen: 'kontrolliert',
    kontrolliert: 'verrechenbar',
    verrechenbar: 'verrechnet',
    verrechnet: 'verrechnet',
  }), []);

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
    setOrders((current) => current.map((order) => (
      order.id === id ? { ...order, status: nextStatus[order.status] } : order
    )));
    setMessage('Status wurde aktualisiert.');
  }

  function saveOrder(order: TransportOrder) {
    setOrders((current) => [...current, order]);
    setScreen('calendar');
    setMessage(`${order.orderNumber} wurde gespeichert und eingeplant.`);
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
            <View style={styles.accountRow}>
              <View>
                <Text style={styles.accountName}>{currentUser.displayName}</Text>
                <Text style={styles.accountRole}>{isAdmin ? 'Administrator' : 'Mitarbeiter'}</Text>
              </View>
              <Pressable onPress={logout} style={styles.logoutButton}>
                <Text style={styles.logoutText}>Abmelden</Text>
              </Pressable>
            </View>
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
              <Pressable onPress={() => setScreen('users')} style={[styles.navButton, screen === 'users' && styles.navButtonActive]}>
                <Text style={[styles.navText, screen === 'users' && styles.navTextActive]}>Benutzer</Text>
              </Pressable>
              <Pressable onPress={() => setScreen('billing')} style={[styles.navButton, screen === 'billing' && styles.navButtonActive]}>
                <Text style={[styles.navText, screen === 'billing' && styles.navTextActive]}>Verrechnung</Text>
              </Pressable>
            </View>
          )}

          {message ? (
            <Pressable style={styles.message} onPress={() => setMessage('')}>
              <Text style={styles.messageText}>{message}</Text>
            </Pressable>
          ) : null}

          {isAdmin && <SummaryBar orders={orders} />}

          {isAdmin && screen === 'calendar' && (
            <DispositionView orders={orders} onNewOrder={() => setScreen('newOrder')} />
          )}
          {isAdmin && screen === 'newOrder' && (
            <OrderForm onSave={saveOrder} onCancel={() => setScreen('calendar')} />
          )}
          {!isAdmin && screen === 'driver' && (
            <DriverView orders={orders} user={currentUser} onAdvance={advanceOrder} />
          )}
          {isAdmin && screen === 'billing' && <OfficeView orders={orders} />}
          {isAdmin && screen === 'masterData' && <MasterDataView />}
          {isAdmin && screen === 'users' && <UserManagementView />}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#07130B' },
  page: { flexGrow: 1, alignItems: 'center', backgroundColor: '#F4F7F4' },
  container: { width: '100%' },
  header: { backgroundColor: '#0B4D27', paddingHorizontal: 24, paddingTop: 28, paddingBottom: 22, gap: 20 },
  brandSub: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  headerBrand: { width: '100%', maxWidth: 340 },
  headerLogoSurface: { backgroundColor: '#FFFFFF', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7 },
  headerLogo: { width: '100%', height: 58 },
  accountRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  accountName: { color: '#FFFFFF', fontWeight: '800' },
  accountRole: { color: '#BBD7C3', marginTop: 2, fontSize: 12 },
  logoutButton: { borderWidth: 1, borderColor: '#8FBA9B', borderRadius: 9, paddingHorizontal: 12, paddingVertical: 8 },
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
  actionButton: { backgroundColor: '#FFD11A', borderRadius: 11, padding: 14, alignItems: 'center', marginTop: -2, marginBottom: 18 },
  actionButtonText: { color: '#17331F', fontWeight: '900' },
  billingRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, marginBottom: 10, gap: 12, borderWidth: 1, borderColor: '#E2E8E2' },
  billingMain: { flex: 1 },
  amount: { color: '#0B4D27', fontWeight: '900' },
  empty: { color: '#6A756D', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 18 },
  fieldLabel: { color: '#27362C', fontWeight: '800', marginTop: 14, marginBottom: 7 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { borderWidth: 1, borderColor: '#C7D1C9', backgroundColor: '#FFFFFF', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 },
  choiceActive: { backgroundColor: '#0B4D27', borderColor: '#0B4D27' },
  choiceText: { color: '#34443A', fontWeight: '700' },
  choiceTextActive: { color: '#FFFFFF' },
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
  loginPage: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0B4D27', padding: 20 },
  loginCard: { width: '100%', maxWidth: 440, backgroundColor: '#F4F7F4', borderRadius: 18, padding: 24 },
  loginLogo: { width: '100%', height: 78 },
  loginAppName: { color: '#0B4D27', textAlign: 'center', fontSize: 16, fontWeight: '800', marginTop: 8 },
  loginTitle: { color: '#142018', fontSize: 28, fontWeight: '900', marginTop: 18 },
  loginSub: { color: '#607066', marginTop: 4, marginBottom: 8 },
  loginButton: { backgroundColor: '#0B4D27', borderRadius: 11, padding: 15, alignItems: 'center', marginTop: 18 },
  errorText: { color: '#B42318', marginTop: 10, fontWeight: '700' },
  demoBox: { backgroundColor: '#E7ECE8', borderRadius: 10, padding: 13, marginTop: 18 },
  demoTitle: { color: '#27362C', fontWeight: '800', marginBottom: 5 },
  demoText: { color: '#536158', marginTop: 3 },
});
