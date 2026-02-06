import { apiClient } from '../client';
import { Route, Address, WasteCategory, AddressStatus, AddressIssueReason, AddressIssueFlag } from '@/types/waste';
import { QueryParams } from '@/types/api';
import { RouteFormData } from '@/types/admin';

class RoutesService {
  async getRoutes(params?: QueryParams & { summary?: boolean }): Promise<Route[]> {
    return apiClient.get<Route[]>('/routes', params);
  }

  async getRouteById(id: string, params?: { summary?: boolean }): Promise<Route> {
    return apiClient.get<Route>(`/routes/${id}`, params);
  }

  async getRouteAddress(routeId: string, addressId: string): Promise<Address> {
    return apiClient.get<Address>(`/routes/${routeId}/addresses/${addressId}`);
  }

  async createRoute(data: RouteFormData): Promise<Route> {
    return apiClient.post<Route>('/routes', data);
  }

  async updateRoute(id: string, data: Partial<RouteFormData>): Promise<Route> {
    return apiClient.put<Route>(`/routes/${id}`, data);
  }

  async deleteRoute(id: string): Promise<void> {
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
      issuePhotoFile?: File;
    }
  ): Promise<Address> {
    const status = details?.status ?? 'COLLECTED';
    if (details?.issuePhotoFile) {
      const formData = new FormData();
      formData.append('waste', JSON.stringify(waste));
      formData.append('status', status);
      if (details.issueReason) {
        formData.append('issueReason', details.issueReason);
      }
      if (details.issueFlags) {
        formData.append('issueFlags', JSON.stringify(details.issueFlags));
      }
      if (details.issueNote) {
        formData.append('issueNote', details.issueNote);
      }
      formData.append('issuePhoto', details.issuePhotoFile);

      return apiClient.putFormData<Address>(`/routes/${routeId}/addresses/${addressId}`, formData);
    }

    return apiClient.put<Address>(`/routes/${routeId}/addresses/${addressId}`, {
      waste,
      status,
      isCollected: status === 'COLLECTED',
      issueReason: details?.issueReason,
      issueFlags: details?.issueFlags,
      issueNote: details?.issueNote,
      issuePhoto: details?.issuePhoto,
    });
  }
}

export const routesService = new RoutesService();
