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

class AdminService {
  async getDashboardStats(): Promise<DashboardStats> {
    return apiClient.get<DashboardStats>('/admin/dashboard');
  }

  async getStatistics(filters: StatisticsFilters): Promise<StatisticsData> {
    return apiClient.get<StatisticsData>('/admin/statistics', filters);
  }

  async getEmployees(params?: AdminEmployeesQuery): Promise<User[]> {
    return apiClient.get<User[]>('/admin/employees', params);
  }

  async createEmployee(data: CreateEmployeeDto): Promise<User> {
    return apiClient.post<User>('/admin/employees', data);
  }

  async updateEmployee(id: string, data: UpdateEmployeeDto): Promise<User> {
    return apiClient.put<User>(`/admin/employees/${id}`, data);
  }

  async deleteEmployee(id: string): Promise<void> {
    return apiClient.delete<void>(`/admin/employees/${id}`);
  }

  async getAddresses(params?: AdminAddressesQuery): Promise<AdminAddress[]> {
    return apiClient.get<AdminAddress[]>('/admin/addresses', params);
  }

  async createAddress(data: CreateAddressDto): Promise<AdminAddress> {
    return apiClient.post<AdminAddress>('/admin/addresses', data);
  }

  async importAddresses(addresses: CreateAddressDto[]): Promise<ImportAddressesResult> {
    return apiClient.post<ImportAddressesResult>('/admin/addresses/import', { addresses });
  }

  async clearAddresses(): Promise<void> {
    await apiClient.delete<void>('/admin/addresses');
  }

  async updateAddress(id: string, data: UpdateAddressDto): Promise<AdminAddress> {
    return apiClient.put<AdminAddress>(`/admin/addresses/${id}`, data);
  }

  async deleteAddress(id: string): Promise<void> {
    return apiClient.delete<void>(`/admin/addresses/${id}`);
  }

  async getRoutes(params?: AdminRoutesQuery): Promise<AdminRoute[]> {
    return apiClient.get<AdminRoute[]>('/admin/routes', params);
  }

  async getIssueReports(params?: AdminIssuesQuery): Promise<IssueReport[]> {
    return apiClient.get<IssueReport[]>('/admin/issues', params);
  }

  async getDailyStats(params: DailyStatsQuery): Promise<DailyStatsRow[]> {
    return apiClient.get<DailyStatsRow[]>('/admin/daily-stats', params);
  }

  async createRoute(data: CreateRouteDto): Promise<AdminRoute> {
    return apiClient.post<AdminRoute>('/admin/routes', data);
  }

  async updateRoute(id: string, data: UpdateRouteDto): Promise<AdminRoute> {
    return apiClient.put<AdminRoute>(`/admin/routes/${id}`, data);
  }

  async deleteRoute(id: string): Promise<void> {
    return apiClient.delete<void>(`/admin/routes/${id}`);
  }

  async publishRoute(id: string): Promise<AdminRoute> {
    return apiClient.post<AdminRoute>(`/admin/routes/${id}/publish`, {});
  }

  async archiveIssue(routeId: string, addressId: string): Promise<{ issueArchivedAt?: string }> {
    return apiClient.patch<{ issueArchivedAt?: string }>(
      `/admin/issues/${routeId}/${addressId}/archive`,
      {}
    );
  }
}

export const adminService = new AdminService();
