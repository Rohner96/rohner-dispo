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
];

export const demoUsers: AppUser[] = demoCredentials.map(({ password: _password, ...user }) => user);

export function authenticateDemoUser(username: string, password: string): AppUser | undefined {
  const normalizedUsername = username.trim().toLowerCase();
  const credential = demoCredentials.find((item) => (
    item.active
    && item.username.toLowerCase() === normalizedUsername
    && item.password === password
  ));

  if (!credential) return undefined;
  const { password: _password, ...user } = credential;
  return user;
}
