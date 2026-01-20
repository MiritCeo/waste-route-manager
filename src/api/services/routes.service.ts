import { apiClient } from '../client';
import { Route, Address, WasteCategory, AddressStatus, AddressIssueReason, AddressIssueFlag } from '@/types/waste';
import { QueryParams, PaginatedResponse } from '@/types/api';
import { mockRoutes } from '@/data/mockData';
import { APP_CONFIG } from '@/constants/config';
import { RouteFormData } from '@/types/admin';

class RoutesService {
  private useMockData = APP_CONFIG.API.USE_MOCK_DATA;

  async getRoutes(params?: QueryParams): Promise<Route[]> {
    if (this.useMockData) {
      return this.mockGetRoutes(params);
    }

    return apiClient.get<Route[]>('/routes', params);
  }

  async getRouteById(id: string): Promise<Route> {
    if (this.useMockData) {
      return this.mockGetRouteById(id);
    }

    return apiClient.get<Route>(`/routes/${id}`);
  }

  async createRoute(data: RouteFormData): Promise<Route> {
    if (this.useMockData) {
      return this.mockCreateRoute(data);
    }

    return apiClient.post<Route>('/routes', data);
  }

  async updateRoute(id: string, data: Partial<RouteFormData>): Promise<Route> {
    if (this.useMockData) {
      return this.mockUpdateRoute(id, data);
    }

    return apiClient.put<Route>(`/routes/${id}`, data);
  }

  async deleteRoute(id: string): Promise<void> {
    if (this.useMockData) {
      return this.mockDeleteRoute(id);
    }

    return apiClient.delete<void>(`/routes/${id}`);
  }

  async updateAddressCollection(
    routeId: string,
    addressId: string,
    waste: WasteCategory[],
    details?: {
      status?: AddressStatus;
      issueReason?: AddressIssueReason;
      issueFlags?: AddressIssueFlag[];
      issueNote?: string;
      issuePhoto?: string;
      reportToAdmin?: boolean;
    }
  ): Promise<Address> {
    if (this.useMockData) {
      return this.mockUpdateAddressCollection(routeId, addressId, waste, details);
    }

    const status = details?.status ?? 'COLLECTED';
    return apiClient.put<Address>(`/routes/${routeId}/addresses/${addressId}`, {
      waste,
      status,
      isCollected: status === 'COLLECTED',
      issueReason: details?.issueReason,
      issueFlags: details?.issueFlags,
      issueNote: details?.issueNote,
      issuePhoto: details?.issuePhoto,
      reportToAdmin: details?.reportToAdmin,
    });
  }

  // Mock implementations
  private async mockGetRoutes(params?: QueryParams): Promise<Route[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    let routes = [...mockRoutes];
    routes = routes.filter(route => route.publicationStatus !== 'DRAFT');

    // Apply search filter
    if (params?.search) {
      const search = params.search.toLowerCase();
      routes = routes.filter(r => 
        r.name.toLowerCase().includes(search) ||
        r.addresses.some(a => 
          a.street.toLowerCase().includes(search) ||
          a.city.toLowerCase().includes(search)
        )
      );
    }

    // Apply sorting
    if (params?.sortBy) {
      routes.sort((a, b) => {
        const aValue = a[params.sortBy as keyof Route];
        const bValue = b[params.sortBy as keyof Route];
        
        if (params.sortOrder === 'desc') {
          return bValue > aValue ? 1 : -1;
        }
        return aValue > bValue ? 1 : -1;
      });
    }

    return routes;
  }

  private async mockGetRouteById(id: string): Promise<Route> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const route = mockRoutes.find(r => r.id === id);
    if (!route) {
      throw new Error('Nie znaleziono trasy');
    }
    
    return route;
  }

  private async mockCreateRoute(data: RouteFormData): Promise<Route> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newRoute: Route = {
      id: `route_${Date.now()}`,
      name: data.name,
      date: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString(),
      totalAddresses: data.addressIds.length,
      collectedAddresses: 0,
      addresses: [], // Would be populated from addressIds in real implementation
    };
    
    return newRoute;
  }

  private async mockUpdateRoute(id: string, data: Partial<RouteFormData>): Promise<Route> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const route = mockRoutes.find(r => r.id === id);
    if (!route) {
      throw new Error('Nie znaleziono trasy');
    }
    
    return {
      ...route,
      ...data,
    };
  }

  private async mockDeleteRoute(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const route = mockRoutes.find(r => r.id === id);
    if (!route) {
      throw new Error('Nie znaleziono trasy');
    }
  }

  private async mockUpdateAddressCollection(
    routeId: string,
    addressId: string,
    waste: WasteCategory[],
    details?: {
      status?: AddressStatus;
      issueReason?: AddressIssueReason;
      issueFlags?: AddressIssueFlag[];
      issueNote?: string;
      issuePhoto?: string;
      reportToAdmin?: boolean;
    }
  ): Promise<Address> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const route = mockRoutes.find(r => r.id === routeId);
    if (!route) {
      throw new Error('Nie znaleziono trasy');
    }
    
    const address = route.addresses.find(a => a.id === addressId);
    if (!address) {
      throw new Error('Nie znaleziono adresu');
    }

    return {
      ...address,
      waste,
      isCollected: details?.status ? details.status === 'COLLECTED' : true,
      status: details?.status ?? 'COLLECTED',
      issueReason: details?.issueReason,
      issueFlags: details?.issueFlags ?? address.issueFlags ?? [],
      issueNote: details?.issueNote,
      issuePhoto: details?.issuePhoto,
      reportToAdmin: details?.reportToAdmin ?? address.reportToAdmin,
    };
  }
}

export const routesService = new RoutesService();
