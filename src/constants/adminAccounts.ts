import { Permission, User } from '@/types/user';
import { ALL_PERMISSIONS } from '@/constants/permissions';

export interface AdminAccountConfig {
  employeeId: string;
  pin: string;
  name: string;
  email?: string;
  phone?: string;
  permissions?: Permission[];
}

export const ADMIN_ACCOUNTS: AdminAccountConfig[] = [
  {
    employeeId: '002',
    pin: '1234',
    name: 'Anna Nowak',
    email: 'anna.nowak@kompaktowy.pl',
    phone: '+48 987 654 321',
    permissions: ALL_PERMISSIONS,
  },
];

export const buildAdminUser = (account: AdminAccountConfig, id: string): User => ({
  id,
  employeeId: account.employeeId,
  name: account.name,
  role: 'ADMIN',
  permissions: account.permissions ?? ALL_PERMISSIONS,
  email: account.email,
  phone: account.phone,
  active: true,
  createdAt: new Date().toISOString(),
});
