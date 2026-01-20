import { apiClient } from '../client';
import {
  AdminAddress,
  AdminRoute,
  DashboardStats,
  StatisticsData,
  StatisticsFilters,
  IssueReport,
  DailyStatsRow,
  ImportAddressesResult,
} from '@/types/admin';
import { User } from '@/types/user';
import { mockRoutes } from '@/data/mockData';
import { Address, WasteCategory, WasteType } from '@/types/waste';
import { ADMIN_ACCOUNTS, buildAdminUser } from '@/constants/adminAccounts';
import {
  AdminAddressesQuery,
  AdminEmployeesQuery,
  AdminRoutesQuery,
  AdminIssuesQuery,
  DailyStatsQuery,
  CreateAddressDto,
  CreateEmployeeDto,
  CreateRouteDto,
  UpdateAddressDto,
  UpdateEmployeeDto,
  UpdateRouteDto,
} from '@/types/adminApi';
import { WASTE_OPTIONS } from '@/constants/waste';
import { APP_CONFIG } from '@/constants/config';
import { buildAddressKey } from '@/utils/addressKeys';

const ADMIN_STORAGE_KEYS = {
  ADDRESSES: 'mock.admin.addresses',
  ROUTES: 'mock.admin.routes',
};

class AdminService {
  private useMockData = APP_CONFIG.API.USE_MOCK_DATA;
  private mockEmployees: User[] = this.buildMockEmployees();
  private mockAddresses: AdminAddress[] = this.buildMockAddresses();
  private mockRoutes: AdminRoute[] = this.buildMockRoutes();

  constructor() {
    if (!this.useMockData) return;
    const stored = this.loadMockState();
    if (stored) {
      this.mockAddresses = stored.addresses;
      this.mockRoutes = stored.routes;
    }
  }

  async getDashboardStats(): Promise<DashboardStats> {
    if (this.useMockData) {
      return this.mockGetDashboardStats();
    }

    return apiClient.get<DashboardStats>('/admin/dashboard');
  }

  async getStatistics(filters: StatisticsFilters): Promise<StatisticsData> {
    if (this.useMockData) {
      return this.mockGetStatistics(filters);
    }

    return apiClient.get<StatisticsData>('/admin/statistics', filters);
  }

  async getEmployees(params?: AdminEmployeesQuery): Promise<User[]> {
    if (this.useMockData) {
      return this.mockGetEmployees(params);
    }

    return apiClient.get<User[]>('/admin/employees', params);
  }

  async createEmployee(data: CreateEmployeeDto): Promise<User> {
    if (this.useMockData) {
      return this.mockCreateEmployee(data);
    }

    return apiClient.post<User>('/admin/employees', data);
  }

  async updateEmployee(id: string, data: UpdateEmployeeDto): Promise<User> {
    if (this.useMockData) {
      return this.mockUpdateEmployee(id, data);
    }

    return apiClient.put<User>(`/admin/employees/${id}`, data);
  }

  async deleteEmployee(id: string): Promise<void> {
    if (this.useMockData) {
      return this.mockDeleteEmployee(id);
    }

    return apiClient.delete<void>(`/admin/employees/${id}`);
  }

  async getAddresses(params?: AdminAddressesQuery): Promise<AdminAddress[]> {
    if (this.useMockData) {
      return this.mockGetAddresses(params);
    }

    return apiClient.get<AdminAddress[]>('/admin/addresses', params);
  }

  async createAddress(data: CreateAddressDto): Promise<AdminAddress> {
    if (this.useMockData) {
      return this.mockCreateAddress(data);
    }

    return apiClient.post<AdminAddress>('/admin/addresses', data);
  }

  async importAddresses(addresses: CreateAddressDto[]): Promise<ImportAddressesResult> {
    if (this.useMockData) {
      return this.mockImportAddresses(addresses);
    }

    return apiClient.post<ImportAddressesResult>('/admin/addresses/import', { addresses });
  }

  async clearAddresses(): Promise<void> {
    if (this.useMockData) {
      this.mockClearAddresses();
      return;
    }

    await apiClient.delete<void>('/admin/addresses');
  }

  async updateAddress(id: string, data: UpdateAddressDto): Promise<AdminAddress> {
    if (this.useMockData) {
      return this.mockUpdateAddress(id, data);
    }

    return apiClient.put<AdminAddress>(`/admin/addresses/${id}`, data);
  }

  async deleteAddress(id: string): Promise<void> {
    if (this.useMockData) {
      return this.mockDeleteAddress(id);
    }

    return apiClient.delete<void>(`/admin/addresses/${id}`);
  }

  async getRoutes(params?: AdminRoutesQuery): Promise<AdminRoute[]> {
    if (this.useMockData) {
      return this.mockGetRoutes(params);
    }

    return apiClient.get<AdminRoute[]>('/admin/routes', params);
  }

  async getIssueReports(params?: AdminIssuesQuery): Promise<IssueReport[]> {
    if (this.useMockData) {
      return this.mockGetIssueReports(params);
    }

    return apiClient.get<IssueReport[]>('/admin/issues', params);
  }

  async getDailyStats(params: DailyStatsQuery): Promise<DailyStatsRow[]> {
    if (this.useMockData) {
      return this.mockGetDailyStats(params);
    }

    return apiClient.get<DailyStatsRow[]>('/admin/daily-stats', params);
  }

  async createRoute(data: CreateRouteDto): Promise<AdminRoute> {
    if (this.useMockData) {
      return this.mockCreateRoute(data);
    }

    return apiClient.post<AdminRoute>('/admin/routes', data);
  }

  async updateRoute(id: string, data: UpdateRouteDto): Promise<AdminRoute> {
    if (this.useMockData) {
      return this.mockUpdateRoute(id, data);
    }

    return apiClient.put<AdminRoute>(`/admin/routes/${id}`, data);
  }

  async deleteRoute(id: string): Promise<void> {
    if (this.useMockData) {
      return this.mockDeleteRoute(id);
    }

    return apiClient.delete<void>(`/admin/routes/${id}`);
  }

  async publishRoute(id: string): Promise<AdminRoute> {
    if (this.useMockData) {
      return this.mockPublishRoute(id);
    }

    return apiClient.post<AdminRoute>(`/admin/routes/${id}/publish`, {});
  }

  // Mock implementations
  private buildMockEmployees(): User[] {
    const baseEmployees: User[] = [
      {
        id: '1',
        employeeId: '001',
        name: 'Jan Kowalski',
        role: 'DRIVER',
        permissions: ['VIEW_ROUTES', 'COLLECT_WASTE'],
        email: 'jan.kowalski@kompaktowy.pl',
        phone: '+48 123 456 789',
        active: true,
        createdAt: '2024-01-01T00:00:00Z',
      },
      {
        id: '3',
        employeeId: '003',
        name: 'Maria Wiśniewska',
        role: 'MANAGER',
        permissions: ['VIEW_ROUTES', 'COLLECT_WASTE', 'VIEW_STATISTICS'],
        email: 'maria.wisniewska@kompaktowy.pl',
        phone: '+48 555 777 111',
        active: true,
        createdAt: '2024-01-10T00:00:00Z',
      },
    ];

    const adminEmployees = ADMIN_ACCOUNTS.map((account, index) =>
      buildAdminUser(account, `admin_${index + 1}`)
    );

    return [...baseEmployees, ...adminEmployees];
  }

  private buildMockAddresses(): AdminAddress[] {
    const map = new Map<string, AdminAddress>();

    mockRoutes.forEach(route => {
      route.addresses.forEach(address => {
        if (map.has(address.id)) return;

        map.set(address.id, {
          id: address.id,
          street: address.street,
          number: address.number,
          city: address.city,
          postalCode: '',
          notes: '',
          wasteTypes: address.waste.map(waste => waste.id),
          active: true,
          createdAt: '2024-01-01T00:00:00Z',
        });
      });
    });

    return Array.from(map.values());
  }

  private buildMockRoutes(): AdminRoute[] {
    return JSON.parse(JSON.stringify(mockRoutes)).map((route: AdminRoute) => ({
      ...route,
      addressIds: route.addresses.map(address => address.id),
      publicationStatus: route.publicationStatus ?? 'PUBLISHED',
    }));
  }

  private buildWasteForTypes(types: WasteType[]): WasteCategory[] {
    return types.map(type => {
      const option = WASTE_OPTIONS.find(item => item.id === type);
      return {
        id: type,
        name: option?.name || type,
        icon: option?.icon || '🗑️',
        count: 0,
      };
    });
  }

  private async mockGetDashboardStats(): Promise<DashboardStats> {
    await new Promise(resolve => setTimeout(resolve, 400));

    const totalAddresses = this.mockRoutes.reduce((sum, r) => sum + r.totalAddresses, 0);
    const collectedAddresses = this.mockRoutes.reduce((sum, r) => sum + r.collectedAddresses, 0);

    // Calculate waste stats
    const wasteMap: Record<string, { name: string; icon: string; total: number }> = {};
    
    this.mockRoutes.forEach(route => {
      route.addresses.forEach(address => {
        if (address.isCollected) {
          address.waste.forEach(waste => {
            if (!wasteMap[waste.id]) {
              wasteMap[waste.id] = {
                name: waste.name,
                icon: waste.icon,
                total: 0,
              };
            }
            wasteMap[waste.id].total += waste.count;
          });
        }
      });
    });

    return {
      totalRoutes: this.mockRoutes.length,
      activeRoutes: this.mockRoutes.filter(r => r.collectedAddresses < r.totalAddresses).length,
      completedRoutes: this.mockRoutes.filter(r => r.collectedAddresses === r.totalAddresses).length,
      totalAddresses,
      collectedAddresses,
      pendingAddresses: totalAddresses - collectedAddresses,
      totalEmployees: this.mockEmployees.length,
      activeEmployees: this.mockEmployees.filter(emp => emp.active).length,
      wasteCollected: Object.entries(wasteMap).map(([type, data]) => ({
        type,
        name: data.name,
        icon: data.icon,
        total: data.total,
        trend: Math.random() * 20 - 10, // Random trend for demo
      })),
      recentActivity: [
        {
          id: '1',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          userId: '1',
          userName: 'Jan Kowalski',
          action: 'Zakończył zbiórkę',
          details: 'ul. Poznańska 12',
          type: 'collection',
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          userId: '2',
          userName: 'Anna Nowak',
          action: 'Utworzył nową trasę',
          details: 'Trasa Wschód',
          type: 'route_update',
        },
      ],
    };
  }

  private async mockGetStatistics(filters: StatisticsFilters): Promise<StatisticsData> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const wasteStats: Record<string, { name: string; count: number }> = {};
    let totalWaste = 0;

    this.mockRoutes.forEach(route => {
      route.addresses.forEach(address => {
        if (address.isCollected) {
          address.waste.forEach(waste => {
            if (waste.count > 0) {
              if (!wasteStats[waste.id]) {
                wasteStats[waste.id] = {
                  name: waste.name,
                  count: 0,
                };
              }
              wasteStats[waste.id].count += waste.count;
              totalWaste += waste.count;
            }
          });
        }
      });
    });

    const totalAddresses = this.mockRoutes.reduce((sum, r) => sum + r.totalAddresses, 0);
    const collectedAddresses = this.mockRoutes.reduce((sum, r) => sum + r.collectedAddresses, 0);

    return {
      period: {
        start: filters.startDate,
        end: filters.endDate,
      },
      routes: {
        total: this.mockRoutes.length,
        completed: this.mockRoutes.filter(r => r.collectedAddresses === r.totalAddresses).length,
        completionRate: (this.mockRoutes.filter(r => r.collectedAddresses === r.totalAddresses).length / this.mockRoutes.length) * 100,
      },
      addresses: {
        total: totalAddresses,
        collected: collectedAddresses,
        collectionRate: (collectedAddresses / totalAddresses) * 100,
      },
      waste: {
        byType: Object.entries(wasteStats).map(([type, data]) => ({
          type,
          name: data.name,
          count: data.count,
          percentage: (data.count / totalWaste) * 100,
        })),
        total: totalWaste,
        averagePerAddress: totalWaste / (collectedAddresses || 1),
      },
      employees: {
        performance: [
          {
            userId: '1',
            userName: 'Jan Kowalski',
            routesCompleted: 2,
            addressesCollected: 15,
            efficiency: 95,
          },
          {
            userId: '2',
            userName: 'Anna Nowak',
            routesCompleted: 1,
            addressesCollected: 8,
            efficiency: 88,
          },
        ],
      },
      trends: {
        daily: Array.from({ length: 7 }, (_, i) => ({
          date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
          collected: Math.floor(Math.random() * 20) + 5,
          waste: Math.floor(Math.random() * 50) + 20,
        })).reverse(),
      },
    };
  }

  private async mockGetEmployees(params?: AdminEmployeesQuery): Promise<User[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    let employees = [...this.mockEmployees];

    if (params?.search) {
      const search = params.search.toLowerCase();
      employees = employees.filter(emp =>
        emp.name.toLowerCase().includes(search) ||
        emp.employeeId.includes(search) ||
        emp.email?.toLowerCase().includes(search)
      );
    }

    if (params?.role) {
      employees = employees.filter(emp => emp.role === params.role);
    }

    if (typeof params?.active === 'boolean') {
      employees = employees.filter(emp => emp.active === params.active);
    }

    if (params?.sortBy) {
      employees.sort((a, b) => {
        const aValue = a[params.sortBy as keyof User];
        const bValue = b[params.sortBy as keyof User];
        const sortOrder = params.sortOrder === 'desc' ? -1 : 1;

        if (aValue === undefined || bValue === undefined) return 0;
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return aValue.localeCompare(bValue) * sortOrder;
        }

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return (aValue - bValue) * sortOrder;
        }

        return String(aValue).localeCompare(String(bValue)) * sortOrder;
      });
    }

    return employees;
  }

  private async mockCreateEmployee(data: CreateEmployeeDto): Promise<User> {
    await new Promise(resolve => setTimeout(resolve, 500));

    if (this.mockEmployees.some(employee => employee.employeeId === data.employeeId)) {
      throw new Error('Numer pracownika jest już używany');
    }

    const newEmployee: User = {
      id: `user_${Date.now()}`,
      employeeId: data.employeeId,
      name: data.name,
      role: data.role,
      permissions: data.permissions,
      email: data.email,
      phone: data.phone,
      active: data.active ?? true,
      createdAt: new Date().toISOString(),
    };

    this.mockEmployees = [newEmployee, ...this.mockEmployees];

    return newEmployee;
  }

  private async mockUpdateEmployee(id: string, data: UpdateEmployeeDto): Promise<User> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const employee = this.mockEmployees.find(e => e.id === id);
    
    if (!employee) {
      throw new Error('Nie znaleziono pracownika');
    }

    const updatedEmployee: User = {
      ...employee,
      ...data,
    };

    this.mockEmployees = this.mockEmployees.map(emp => emp.id === id ? updatedEmployee : emp);

    return updatedEmployee;
  }

  private async mockDeleteEmployee(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const employee = this.mockEmployees.find(emp => emp.id === id);
    if (!employee) {
      throw new Error('Nie znaleziono pracownika');
    }

    if (ADMIN_ACCOUNTS.some(account => account.employeeId === employee.employeeId)) {
      throw new Error('Nie można usunąć konta administratora skonfigurowanego w systemie');
    }

    this.mockEmployees = this.mockEmployees.filter(emp => emp.id !== id);
  }

  private async mockGetAddresses(params?: AdminAddressesQuery): Promise<AdminAddress[]> {
    await new Promise(resolve => setTimeout(resolve, 300));

    let addresses = [...this.mockAddresses];

    if (params?.search) {
      const search = params.search.toLowerCase();
      addresses = addresses.filter(address =>
        address.street.toLowerCase().includes(search) ||
        address.city.toLowerCase().includes(search) ||
        address.number.toLowerCase().includes(search) ||
        address.postalCode?.toLowerCase().includes(search)
      );
    }

    if (params?.city) {
      addresses = addresses.filter(address => address.city === params.city);
    }

    if (params?.wasteType) {
      addresses = addresses.filter(address => address.wasteTypes.includes(params.wasteType));
    }

    if (typeof params?.active === 'boolean') {
      addresses = addresses.filter(address => address.active === params.active);
    }

    if (params?.sortBy) {
      addresses.sort((a, b) => {
        const aValue = a[params.sortBy as keyof AdminAddress];
        const bValue = b[params.sortBy as keyof AdminAddress];
        const sortOrder = params.sortOrder === 'desc' ? -1 : 1;

        if (aValue === undefined || bValue === undefined) return 0;
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return aValue.localeCompare(bValue) * sortOrder;
        }

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return (aValue - bValue) * sortOrder;
        }

        return String(aValue).localeCompare(String(bValue)) * sortOrder;
      });
    }

    return addresses;
  }

  private buildAdminAddress(data: CreateAddressDto): AdminAddress {
    return {
      id: `address_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      street: data.street,
      number: data.number,
      city: data.city,
      postalCode: data.postalCode,
      notes: data.notes,
      wasteTypes: data.wasteTypes,
      declaredContainers: data.declaredContainers,
      active: data.active ?? true,
      createdAt: new Date().toISOString(),
    };
  }

  private async mockCreateAddress(data: CreateAddressDto): Promise<AdminAddress> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const newAddress = this.buildAdminAddress(data);
    this.mockAddresses = [newAddress, ...this.mockAddresses];
    this.persistMockState();
    return newAddress;
  }

  private async mockImportAddresses(addresses: CreateAddressDto[]): Promise<ImportAddressesResult> {
    await new Promise(resolve => setTimeout(resolve, 600));

    const existingKeys = new Set(
      this.mockAddresses.map(address =>
        this.buildImportKey({
          street: address.street,
          number: address.number,
          city: address.city,
          postalCode: address.postalCode,
          notes: address.notes,
        })
      )
    );

    let created = 0;
    let skippedExisting = 0;
    const newEntries: AdminAddress[] = [];

    addresses.forEach(address => {
      const key = this.buildImportKey({
        street: address.street,
        number: address.number,
        city: address.city,
        postalCode: address.postalCode,
        notes: address.notes,
      });

      if (existingKeys.has(key)) {
        skippedExisting += 1;
        return;
      }

      existingKeys.add(key);
      newEntries.push(this.buildAdminAddress(address));
      created += 1;
    });

    this.mockAddresses = [...newEntries, ...this.mockAddresses];
    this.persistMockState();

    return {
      created,
      skippedExisting,
      totalProcessed: addresses.length,
    };
  }

  private buildImportKey(data: {
    street: string;
    number: string;
    city: string;
    postalCode?: string;
    notes?: string;
  }) {
    const baseKey = buildAddressKey(data);
    const owner = this.extractOwnerFromNotes(data.notes);
    if (owner) {
      return `${baseKey}::company::${owner}`;
    }
    return `${baseKey}::residential`;
  }

  private extractOwnerFromNotes(notes?: string) {
    if (!notes) return '';
    const line = notes.split('\n').find(item => item.startsWith('Właściciel:'));
    if (!line) return '';
    return line.replace('Właściciel:', '').toLowerCase().trim();
  }

  private mockClearAddresses() {
    this.mockAddresses = [];
    this.mockRoutes = this.mockRoutes.map(route => ({
      ...route,
      addresses: [],
      addressIds: [],
      totalAddresses: 0,
      collectedAddresses: 0,
    }));
    this.persistMockState();
  }

  private async mockUpdateAddress(id: string, data: UpdateAddressDto): Promise<AdminAddress> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const address = this.mockAddresses.find(item => item.id === id);
    if (!address) {
      throw new Error('Nie znaleziono adresu');
    }

    const updatedAddress = {
      ...address,
      ...data,
    };

    this.mockAddresses = this.mockAddresses.map(item => item.id === id ? updatedAddress : item);
    this.persistMockState();

    return updatedAddress;
  }

  private async mockDeleteAddress(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const address = this.mockAddresses.find(item => item.id === id);
    if (!address) {
      throw new Error('Nie znaleziono adresu');
    }

    this.mockAddresses = this.mockAddresses.filter(item => item.id !== id);
    this.mockRoutes = this.mockRoutes.map(route => {
      const updatedAddresses = route.addresses.filter(addressItem => addressItem.id !== id);
      return {
        ...route,
        addressIds: route.addressIds.filter(addressId => addressId !== id),
        addresses: updatedAddresses,
        totalAddresses: updatedAddresses.length,
        collectedAddresses: updatedAddresses.filter(addressItem => addressItem.isCollected).length,
      };
    });
    this.persistMockState();
  }

  private async mockGetRoutes(params?: AdminRoutesQuery): Promise<AdminRoute[]> {
    await new Promise(resolve => setTimeout(resolve, 300));

    let routes = [...this.mockRoutes];

    if (params?.search) {
      const search = params.search.toLowerCase();
      routes = routes.filter(route => route.name.toLowerCase().includes(search));
    }

    if (params?.status === 'draft') {
      routes = routes.filter(route => route.publicationStatus === 'DRAFT');
    } else if (params?.status === 'completed') {
      routes = routes.filter(
        route =>
          route.publicationStatus !== 'DRAFT' &&
          route.collectedAddresses === route.totalAddresses
      );
    } else if (params?.status === 'active') {
      routes = routes.filter(
        route =>
          route.publicationStatus !== 'DRAFT' &&
          route.collectedAddresses < route.totalAddresses
      );
    }

    if (params?.assignedDriverId) {
      routes = routes.filter(route => route.assignedDriverId === params.assignedDriverId);
    }

    if (params?.sortBy) {
      routes.sort((a, b) => {
        const aValue = a[params.sortBy as keyof AdminRoute];
        const bValue = b[params.sortBy as keyof AdminRoute];
        const sortOrder = params.sortOrder === 'desc' ? -1 : 1;

        if (aValue === undefined || bValue === undefined) return 0;
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return aValue.localeCompare(bValue) * sortOrder;
        }

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return (aValue - bValue) * sortOrder;
        }

        return String(aValue).localeCompare(String(bValue)) * sortOrder;
      });
    }

    return routes;
  }

  private async mockGetIssueReports(params?: AdminIssuesQuery): Promise<IssueReport[]> {
    await new Promise(resolve => setTimeout(resolve, 300));

    let reports: IssueReport[] = [];

    this.mockRoutes.forEach(route => {
      route.addresses.forEach(address => {
        const status = address.status ?? (address.isCollected ? 'COLLECTED' : 'PENDING');
        if (status !== 'ISSUE' && status !== 'DEFERRED') return;

        reports.push({
          id: `${route.id}-${address.id}`,
          routeId: route.id,
          routeName: route.name,
          addressId: address.id,
          street: address.street,
          number: address.number,
          city: address.city,
          status: status as IssueReport['status'],
          issueReason: address.issueReason,
          issueFlags: address.issueFlags,
          issueNote: address.issueNote,
          issuePhoto: address.issuePhoto,
          reportToAdmin: address.reportToAdmin,
          createdAt: new Date(route.date).toISOString(),
        });
      });
    });

    if (params?.search) {
      const search = params.search.toLowerCase();
      reports = reports.filter(report =>
        report.routeName.toLowerCase().includes(search) ||
        report.street.toLowerCase().includes(search) ||
        report.city.toLowerCase().includes(search)
      );
    }

    if (params?.status) {
      reports = reports.filter(report => report.status === params.status);
    }

    if (params?.reason) {
      reports = reports.filter(report => report.issueReason === params.reason);
    }

    if (typeof params?.reported === 'boolean') {
      reports = reports.filter(report => Boolean(report.reportToAdmin) === params.reported);
    }

    return reports;
  }

  private async mockGetDailyStats(params: DailyStatsQuery): Promise<DailyStatsRow[]> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const [year, month] = params.month.split('-').map(Number);
    const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
    const statsMap: Record<string, DailyStatsRow> = {};
    const wasteIds = WASTE_OPTIONS.map(option => option.id);

    this.mockRoutes.forEach(route => {
      const dateSource = route.date || route.updatedAt?.split('T')[0] || monthPrefix + '-01';
      if (!dateSource.startsWith(monthPrefix)) return;

      const collectedAddresses = route.addresses.filter(address => {
        const status = address.status ?? (address.isCollected ? 'COLLECTED' : 'PENDING');
        return status === 'COLLECTED';
      });

      if (!statsMap[dateSource]) {
        statsMap[dateSource] = {
          date: dateSource,
          totalWaste: 0,
          collectedAddresses: 0,
          byType: Object.fromEntries(wasteIds.map(id => [id, 0])),
        };
      }

      collectedAddresses.forEach(address => {
        address.waste.forEach(waste => {
          if (!params.wasteType || waste.id === params.wasteType) {
            statsMap[dateSource].totalWaste += waste.count;
            statsMap[dateSource].byType[waste.id] =
              (statsMap[dateSource].byType[waste.id] || 0) + waste.count;
          }
        });
      });
      statsMap[dateSource].collectedAddresses += collectedAddresses.length;
    });

    return Object.values(statsMap).sort((a, b) => a.date.localeCompare(b.date));
  }

  private async mockCreateRoute(data: CreateRouteDto): Promise<AdminRoute> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const addresses: Address[] = data.addressIds
      .map(addressId => this.mockAddresses.find(address => address.id === addressId))
      .filter((address): address is AdminAddress => !!address)
      .map(address => ({
        id: address.id,
        street: address.street,
        number: address.number,
        city: address.city,
        isCollected: false,
        waste: this.buildWasteForTypes(address.wasteTypes),
      }));

    const publicationStatus = data.publicationStatus ?? 'DRAFT';
    const newRoute: AdminRoute = {
      id: `route_${Date.now()}`,
      name: data.name,
      date: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString(),
      totalAddresses: addresses.length,
      collectedAddresses: 0,
      addresses,
      addressIds: data.addressIds,
      assignedDriverId: data.assignedDriverId,
      publicationStatus,
    };

    this.mockRoutes = [newRoute, ...this.mockRoutes];
    this.persistMockState();
    if (publicationStatus === 'PUBLISHED') {
      this.syncPublishedRoute(newRoute);
    }

    return newRoute;
  }

  private async mockUpdateRoute(id: string, data: UpdateRouteDto): Promise<AdminRoute> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const route = this.mockRoutes.find(item => item.id === id);
    if (!route) {
      throw new Error('Nie znaleziono trasy');
    }

    let updatedAddresses = route.addresses;
    let updatedAddressIds = route.addressIds;

    if (data.addressIds) {
      updatedAddressIds = data.addressIds;
      updatedAddresses = data.addressIds
        .map(addressId => this.mockAddresses.find(address => address.id === addressId))
        .filter((address): address is AdminAddress => !!address)
        .map(address => ({
          id: address.id,
          street: address.street,
          number: address.number,
          city: address.city,
          isCollected: false,
          waste: this.buildWasteForTypes(address.wasteTypes),
        }));
    }

    const collectedAddresses = updatedAddresses.filter(address => address.isCollected).length;

    const updatedRoute: AdminRoute = {
      ...route,
      ...data,
      addresses: updatedAddresses,
      addressIds: updatedAddressIds,
      totalAddresses: updatedAddresses.length,
      collectedAddresses,
      updatedAt: new Date().toISOString(),
      publicationStatus: data.publicationStatus ?? route.publicationStatus ?? 'PUBLISHED',
    };

    this.mockRoutes = this.mockRoutes.map(item => item.id === id ? updatedRoute : item);
    this.persistMockState();
    if (updatedRoute.publicationStatus === 'PUBLISHED') {
      this.syncPublishedRoute(updatedRoute);
    } else {
      this.removePublishedRoute(updatedRoute.id);
    }

    return updatedRoute;
  }

  private async mockDeleteRoute(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const route = this.mockRoutes.find(item => item.id === id);
    if (!route) {
      throw new Error('Nie znaleziono trasy');
    }

    this.mockRoutes = this.mockRoutes.filter(item => item.id !== id);
    this.persistMockState();
    this.removePublishedRoute(id);
  }

  private async mockPublishRoute(id: string): Promise<AdminRoute> {
    const route = this.mockRoutes.find(item => item.id === id);
    if (!route) {
      throw new Error('Nie znaleziono trasy');
    }
    return this.mockUpdateRoute(id, { publicationStatus: 'PUBLISHED' });
  }

  private syncPublishedRoute(route: AdminRoute) {
    const existingIndex = mockRoutes.findIndex(item => item.id === route.id);
    const nextRoute = {
      id: route.id,
      name: route.name,
      date: route.date,
      updatedAt: route.updatedAt,
      totalAddresses: route.totalAddresses,
      collectedAddresses: route.collectedAddresses,
      addresses: route.addresses,
      publicationStatus: 'PUBLISHED' as const,
    };
    if (existingIndex >= 0) {
      mockRoutes[existingIndex] = nextRoute;
    } else {
      mockRoutes.unshift(nextRoute);
    }
  }

  private removePublishedRoute(routeId: string) {
    const index = mockRoutes.findIndex(item => item.id === routeId);
    if (index >= 0) {
      mockRoutes.splice(index, 1);
    }
  }

  private loadMockState():
    | { addresses: AdminAddress[]; routes: AdminRoute[] }
    | null {
    try {
      const rawAddresses = localStorage.getItem(ADMIN_STORAGE_KEYS.ADDRESSES);
      const rawRoutes = localStorage.getItem(ADMIN_STORAGE_KEYS.ROUTES);
      if (!rawAddresses || !rawRoutes) return null;
      return {
        addresses: JSON.parse(rawAddresses) as AdminAddress[],
        routes: JSON.parse(rawRoutes) as AdminRoute[],
      };
    } catch (error) {
      console.error('Failed to load mock admin state:', error);
      return null;
    }
  }

  private persistMockState() {
    try {
      localStorage.setItem(ADMIN_STORAGE_KEYS.ADDRESSES, JSON.stringify(this.mockAddresses));
      localStorage.setItem(ADMIN_STORAGE_KEYS.ROUTES, JSON.stringify(this.mockRoutes));
    } catch (error) {
      console.error('Failed to persist mock admin state:', error);
    }
  }
}

export const adminService = new AdminService();
