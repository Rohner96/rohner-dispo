export type AppRole = 'admin' | 'employee';

export interface AppUser {
  id: string;
  username: string;
  displayName: string;
  role: AppRole;
  active: boolean;
  driverId?: string;
}

interface DemoCredential extends AppUser {
  password: string;
}

const demoCredentials: DemoCredential[] = [
  {
    id: 'u-admin',
    username: 'admin',
    password: 'demo',
    displayName: 'Administrator',
    role: 'admin',
    active: true,
  },
  {
    id: 'u-rene',
    username: 'rene',
    password: 'demo',
    displayName: 'René Rohner',
    role: 'employee',
    active: true,
    driverId: 'd1',
  },
  {
    id: 'u-marcel',
    username: 'marcel',
    password: 'demo',
    displayName: 'Marcel Muster',
    role: 'employee',
    active: true,
    driverId: 'd2',
  },
  {
    id: 'u-andre',
    username: 'andre',
    password: 'demo',
    displayName: 'André Beispiel',
    role: 'employee',
    active: true,
    driverId: 'd3',
  },
];

export const demoUsers: AppUser[] = demoCredentials.map(({ password: _password, ...user }) => user);

export function authenticateDemoUser(username: string, password: string, users: AppUser[] = demoUsers): AppUser | undefined {
  const normalizedUsername = username.trim().toLowerCase();
  if (password !== 'demo') return undefined;
  return users.find((item) => item.active && item.username.toLowerCase() === normalizedUsername);
}
