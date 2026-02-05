export type UserRole = 'DRIVER' | 'ADMIN' | 'MANAGER';

export type Permission = 
  | 'VIEW_ROUTES'
  | 'COLLECT_WASTE'
  | 'VIEW_WARNINGS'
  | 'MANAGE_ROUTES'
  | 'MANAGE_ADDRESSES'
  | 'MANAGE_USERS'
  | 'VIEW_STATISTICS'
  | 'MANAGE_SETTINGS';

export interface User {
  id: string;
  employeeId: string;
  name: string;
  role: UserRole;
  permissions: Permission[];
  email?: string;
  phone?: string;
  active: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  employeeId: string;
  pin: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}
