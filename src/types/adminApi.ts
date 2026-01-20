import { QueryParams } from '@/types/api';
import { DeclaredContainer } from '@/types/admin';
import { WasteType } from '@/types/waste';
import { Permission, UserRole } from '@/types/user';

export interface AdminEmployeesQuery extends QueryParams {
  role?: UserRole;
  active?: boolean;
}

export interface AdminAddressesQuery extends QueryParams {
  city?: string;
  wasteType?: WasteType;
  active?: boolean;
}

export interface AdminRoutesQuery extends QueryParams {
  status?: 'active' | 'completed' | 'draft';
  assignedDriverId?: string;
}

export interface AdminIssuesQuery extends QueryParams {
  status?: 'ISSUE' | 'DEFERRED';
  reason?: string;
  reported?: boolean;
}

export interface DailyStatsQuery extends QueryParams {
  month: string; // YYYY-MM
  wasteType?: string;
}

export interface AdminEmployeeDto {
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

export interface AdminAddressDto {
  id: string;
  street: string;
  number: string;
  city: string;
  postalCode?: string;
  notes?: string;
  wasteTypes: WasteType[];
  active: boolean;
  createdAt: string;
}

export interface AdminRouteDto {
  id: string;
  name: string;
  date?: string;
  updatedAt?: string;
  totalAddresses: number;
  collectedAddresses: number;
  addressIds: string[];
  assignedDriverId?: string;
}

export interface CreateEmployeeDto {
  employeeId: string;
  name: string;
  role: UserRole;
  permissions: Permission[];
  pin?: string;
  email?: string;
  phone?: string;
  active?: boolean;
}

export interface UpdateEmployeeDto {
  name?: string;
  role?: UserRole;
  permissions?: Permission[];
  pin?: string;
  email?: string;
  phone?: string;
  active?: boolean;
}

export interface CreateAddressDto {
  street: string;
  number: string;
  city: string;
  postalCode?: string;
  notes?: string;
  wasteTypes: WasteType[];
  declaredContainers?: DeclaredContainer[];
  active?: boolean;
}

export interface UpdateAddressDto {
  street?: string;
  number?: string;
  city?: string;
  postalCode?: string;
  notes?: string;
  wasteTypes?: WasteType[];
  declaredContainers?: DeclaredContainer[];
  active?: boolean;
}

export interface CreateRouteDto {
  name: string;
  addressIds: string[];
  assignedDriverId?: string;
  publicationStatus?: 'DRAFT' | 'PUBLISHED';
}

export interface UpdateRouteDto {
  name?: string;
  addressIds?: string[];
  assignedDriverId?: string;
  publicationStatus?: 'DRAFT' | 'PUBLISHED';
}
