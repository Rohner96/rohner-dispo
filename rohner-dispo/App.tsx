import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import { drivers, initialOrders, projects, trailers, vehicles } from './src/data/demoData';
import { OrderStatus, TransportOrder, UserRole } from './src/domain/models';
import { buildBillingPool, formatChf } from './src/lib/billing';

const roleLabels: Record<UserRole, string> = {
  dispo: 'Disposition',
  chauffeur: 'Chauffeur',
  sekretariat: 'Sekretariat',
};

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

const typeColors: Record<TransportOrder['type'], string> = {
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

function OrderCard({ order, compact = false }: { order: TransportOrder; compact?: boolean }) {
  const project = lookup(projects, order.projectId);
  const driver = lookup(drivers, order.driverId);
  const vehicle = lookup(vehicles, order.vehicleId);
  const trailer = lookup(trailers, order.trailerId);

  return (
    <View style={[styles.card, { borderLeftColor: typeColors[order.type] }]}>
      <View style={styles.cardTopline}>
        <Text style={styles.orderNumber}>{order.orderNumber}</Text>
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

function DispositionView({ orders }: { orders: TransportOrder[] }) {
  const dates = [...new Set(orders.map((order) => order.date))].sort();
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeading}>
        <View>
          <Text style={styles.eyebrow}>OPERATIVE PLANUNG</Text>
          <Text style={styles.heading}>Dispositionskalender</Text>
        </View>
        <Pressable style={styles.primaryButton}><Text style={styles.primaryButtonText}>+ Auftrag</Text></Pressable>
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

function DriverView({ orders, onAdvance }: { orders: TransportOrder[]; onAdvance: (id: string) => void }) {
  const assigned = orders.filter((order) => order.driverId === 'd1');
  return (
    <View style={styles.section}>
      <Text style={styles.eyebrow}>RENE ROHNER · HEUTE</Text>
      <Text style={styles.heading}>Meine Aufträge</Text>
      {assigned.map((order) => (
        <View key={order.id}>
          <OrderCard order={order} />
          <Pressable style={styles.actionButton} onPress={() => onAdvance(order.id)}>
            <Text style={styles.actionButtonText}>Nächsten Status melden</Text>
          </Pressable>
        </View>
      ))}
      {assigned.length === 0 && <Text style={styles.empty}>Keine Aufträge zugeteilt.</Text>}
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

function MasterData() {
  return (
    <View style={styles.stats}>
      <View style={styles.stat}><Text style={styles.statValue}>{drivers.length}</Text><Text style={styles.muted}>Chauffeure</Text></View>
      <View style={styles.stat}><Text style={styles.statValue}>{vehicles.length}</Text><Text style={styles.muted}>LKW</Text></View>
      <View style={styles.stat}><Text style={styles.statValue}>{trailers.length}</Text><Text style={styles.muted}>Anhänger</Text></View>
      <View style={styles.stat}><Text style={styles.statValue}>{projects.length}</Text><Text style={styles.muted}>Projekte</Text></View>
    </View>
  );
}

export default function App() {
  const [role, setRole] = useState<UserRole>('dispo');
  const [orders, setOrders] = useState(initialOrders);
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

  function advanceOrder(id: string) {
    setOrders((current) => current.map((order) => (
      order.id === id ? { ...order, status: nextStatus[order.status] } : order
    )));
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.page}>
        <View style={[styles.container, { maxWidth }]}>
          <View style={styles.header}>
            <View>
              <Text style={styles.brand}>rohner ag</Text>
              <Text style={styles.brandSub}>Transporte · Disposition</Text>
            </View>
            <View style={styles.roleSwitch}>
              {(Object.keys(roleLabels) as UserRole[]).map((item) => (
                <Pressable key={item} onPress={() => setRole(item)} style={[styles.roleButton, role === item && styles.roleActive]}>
                  <Text style={[styles.roleText, role === item && styles.roleTextActive]}>{roleLabels[item]}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <MasterData />
          {role === 'dispo' && <DispositionView orders={orders} />}
          {role === 'chauffeur' && <DriverView orders={orders} onAdvance={advanceOrder} />}
          {role === 'sekretariat' && <OfficeView orders={orders} />}
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
  brand: { color: '#FFD11A', fontSize: 30, fontWeight: '900', fontStyle: 'italic' },
  brandSub: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  roleSwitch: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  roleButton: { borderWidth: 1, borderColor: '#6EA680', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  roleActive: { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' },
  roleText: { color: '#FFFFFF', fontWeight: '700' },
  roleTextActive: { color: '#0B4D27' },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 18 },
  stat: { minWidth: 130, flexGrow: 1, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#E2E8E2' },
  statValue: { fontSize: 24, fontWeight: '900', color: '#0B4D27' },
  section: { paddingHorizontal: 18, paddingBottom: 40 },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12 },
  eyebrow: { color: '#5C6B60', fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  heading: { color: '#142018', fontSize: 26, fontWeight: '900', marginTop: 4, marginBottom: 18 },
  primaryButton: { backgroundColor: '#0B4D27', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 11, marginBottom: 18 },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '800' },
  dayBlock: { marginBottom: 20 },
  dayTitle: { fontSize: 15, color: '#4B5B50', fontWeight: '800', marginBottom: 8 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 14, borderLeftWidth: 6, padding: 16, marginBottom: 10, shadowColor: '#000000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardTopline: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  orderNumber: { color: '#66736A', fontSize: 12, fontWeight: '700' },
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
});
