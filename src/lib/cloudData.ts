import { AppUser } from '../auth/demoAuth';
import { Absence, Customer, Driver, Project, RepairCase, Trailer, TransportOrder, Vehicle } from '../domain/models';
import { cloudLoginEmail } from './cloudIdentity';
import { supabase } from './supabase';

export type RecordKind = 'customers' | 'projects' | 'drivers' | 'vehicles' | 'trailers' | 'orders' | 'absences' | 'repairs';

export interface CloudAppData {
  customers: Customer[];
  projects: Project[];
  drivers: Driver[];
  vehicles: Vehicle[];
  trailers: Trailer[];
  orders: TransportOrder[];
  absences: Absence[];
  repairs: RepairCase[];
  users: AppUser[];
}

export interface CloudIdentity {
  organizationId: string;
  user: AppUser;
}

interface PortalUserRow {
  id: string;
  organization_id: string;
  auth_user_id: string | null;
  username: string;
  display_name: string;
  role: 'admin' | 'employee';
  driver_id: string | null;
  active: boolean;
}

interface AppRecordRow {
  kind: RecordKind;
  record_id: string;
  payload: unknown;
}

function requireClient() {
  if (!supabase) throw new Error('Die zentrale Datenbank ist noch nicht konfiguriert.');
  return supabase;
}

function rowToUser(row: PortalUserRow): AppUser {
  return { id: row.id, username: row.username, displayName: row.display_name, role: row.role, driverId: row.driver_id ?? undefined, active: row.active };
}

export async function signInCloud(username: string, password: string): Promise<CloudIdentity> {
  const client = requireClient();
  const { data, error } = await client.auth.signInWithPassword({ email: cloudLoginEmail(username), password });
  if (error || !data.user) throw new Error('Benutzername oder Passwort ist falsch.');
  return loadCloudIdentity(data.user.id);
}

export async function restoreCloudIdentity(): Promise<CloudIdentity | undefined> {
  const client = requireClient();
  const { data } = await client.auth.getSession();
  if (!data.session?.user) return undefined;
  return loadCloudIdentity(data.session.user.id);
}

async function loadCloudIdentity(authUserId: string): Promise<CloudIdentity> {
  const client = requireClient();
  const { data, error } = await client.from('portal_users').select('*').eq('auth_user_id', authUserId).eq('active', true).single();
  if (error || !data) {
    await client.auth.signOut();
    throw new Error('Für dieses Konto ist kein aktiver Portalzugang eingerichtet.');
  }
  const row = data as PortalUserRow;
  return { organizationId: row.organization_id, user: rowToUser(row) };
}

export async function signOutCloud(): Promise<void> {
  const client = requireClient();
  const { error } = await client.auth.signOut();
  if (error) throw error;
}

export async function loadCloudData(organizationId: string): Promise<CloudAppData> {
  const client = requireClient();
  const [recordsResult, usersResult] = await Promise.all([
    client.from('app_records').select('kind, record_id, payload').eq('organization_id', organizationId),
    client.from('portal_users').select('*').eq('organization_id', organizationId),
  ]);
  if (recordsResult.error) throw recordsResult.error;
  if (usersResult.error) throw usersResult.error;
  const records = (recordsResult.data ?? []) as AppRecordRow[];
  const byKind = <T>(kind: RecordKind) => records.filter((row) => row.kind === kind).map((row) => row.payload as T);
  return {
    customers: byKind<Customer>('customers'), projects: byKind<Project>('projects'), drivers: byKind<Driver>('drivers'),
    vehicles: byKind<Vehicle>('vehicles'), trailers: byKind<Trailer>('trailers'), orders: byKind<TransportOrder>('orders'),
    absences: byKind<Absence>('absences'), repairs: byKind<RepairCase>('repairs'), users: ((usersResult.data ?? []) as PortalUserRow[]).map(rowToUser),
  };
}

export async function saveCloudCollection<T extends { id: string }>(organizationId: string, kind: RecordKind, items: T[]): Promise<void> {
  if (items.length === 0) return;
  const client = requireClient();
  const rows = items.map((item) => ({ organization_id: organizationId, kind, record_id: item.id, payload: item }));
  const { error } = await client.from('app_records').upsert(rows, { onConflict: 'organization_id,kind,record_id' });
  if (error) throw error;
}

export async function deleteCloudRecord(organizationId: string, kind: RecordKind, id: string): Promise<void> {
  const client = requireClient();
  const { error } = await client.from('app_records').delete().eq('organization_id', organizationId).eq('kind', kind).eq('record_id', id);
  if (error) throw error;
}

export async function saveCloudUsers(organizationId: string, users: AppUser[]): Promise<void> {
  if (users.length === 0) return;
  const client = requireClient();
  const rows = users.map((user) => ({ id: user.id, organization_id: organizationId, username: user.username, display_name: user.displayName, role: user.role, driver_id: user.driverId ?? null, active: user.active }));
  const { error } = await client.from('portal_users').upsert(rows, { onConflict: 'id' });
  if (error) throw error;
}

export function subscribeToCloudChanges(organizationId: string, onChange: () => void): () => void {
  const client = requireClient();
  let refreshTimer: ReturnType<typeof setTimeout> | undefined;
  const refresh = () => {
    if (refreshTimer) clearTimeout(refreshTimer);
    refreshTimer = setTimeout(onChange, 150);
  };
  const channel = client.channel(`rohner-app-${organizationId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'app_records', filter: `organization_id=eq.${organizationId}` }, refresh)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'portal_users', filter: `organization_id=eq.${organizationId}` }, refresh)
    .subscribe();
  return () => {
    if (refreshTimer) clearTimeout(refreshTimer);
    void client.removeChannel(channel);
  };
}
