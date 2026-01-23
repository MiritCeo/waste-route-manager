import { Route, WasteCategory, WasteType, AddressIssueFlag, AddressIssueReason, AddressStatus } from './waste';
import { User } from './user';

export interface DashboardStats {
  totalRoutes: number;
  activeRoutes: number;
  completedRoutes: number;
  totalAddresses: number;
  collectedAddresses: number;
  pendingAddresses: number;
  totalEmployees: number;
  activeEmployees: number;
  wasteCollected: WasteCollectionStats[];
  recentActivity: ActivityLog[];
}

export interface WasteCollectionStats {
  type: string;
  name: string;
  icon: string;
  total: number;
  trend: number; // percentage change from previous period
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  type: 'collection' | 'route_update' | 'user_action' | 'system';
}

export interface RouteFormData {
  name: string;
  addressIds: string[];
  assignedDriverId?: string;
}

export interface AddressFormData {
  street: string;
  number: string;
  city: string;
  postalCode?: string;
  notes?: string;
  wasteTypes: WasteType[];
  active?: boolean;
}

export interface EmployeeFormData {
  employeeId: string;
  name: string;
  email?: string;
  phone?: string;
  role: User['role'];
  permissions: User['permissions'];
  pin: string;
  active?: boolean;
}

export interface StatisticsFilters {
  startDate: string;
  endDate: string;
  routeId?: string;
  employeeId?: string;
  wasteType?: string;
}

export interface StatisticsData {
  period: {
    start: string;
    end: string;
  };
  routes: {
    total: number;
    completed: number;
    completionRate: number;
  };
  addresses: {
    total: number;
    collected: number;
    collectionRate: number;
  };
  waste: {
    byType: Array<{
      type: string;
      name: string;
      count: number;
      percentage: number;
    }>;
    total: number;
    averagePerAddress: number;
  };
  employees: {
    performance: Array<{
      userId: string;
      userName: string;
      routesCompleted: number;
      addressesCollected: number;
      efficiency: number;
    }>;
  };
  trends: {
    daily: Array<{
      date: string;
      collected: number;
      waste: number;
    }>;
  };
}

export interface AdminAddress {
  id: string;
  street: string;
  number: string;
  city: string;
  postalCode?: string;
  notes?: string;
  composting?: string;
  wasteTypes: WasteType[];
  declaredContainers?: DeclaredContainer[];
  active: boolean;
  createdAt: string;
}

export interface AdminRoute extends Route {
  addressIds: string[];
  assignedDriverId?: string;
  publicationStatus: 'DRAFT' | 'PUBLISHED';
}

export interface IssueReport {
  id: string;
  routeId: string;
  routeName: string;
  addressId: string;
  street: string;
  number: string;
  city: string;
  status: Extract<AddressStatus, 'ISSUE' | 'DEFERRED'>;
  issueReason?: AddressIssueReason;
  issueFlags?: AddressIssueFlag[];
  issueNote?: string;
  issuePhoto?: string;
  issueReportedAt?: string;
  issueReportedBy?: {
    id: string;
    employeeId: string;
    name: string;
  };
  issueArchivedAt?: string;
  createdAt: string;
}

export interface DailyStatsRow {
  date: string;
  totalWaste: number;
  collectedAddresses: number;
  byType: Record<string, number>;
}

export interface DeclaredContainer {
  name: string;
  count: number;
  frequency?: string;
}

export interface ImportAddressesResult {
  created: number;
  updated: number;
  skippedExisting: number;
  totalProcessed: number;
}