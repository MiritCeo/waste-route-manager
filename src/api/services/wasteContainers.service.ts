import { apiClient } from '../client';

export interface WasteContainerDto {
  id: string;
  name: string;
  icon: string;
  sortOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

class WasteContainersService {
  async getActiveForApp(): Promise<Array<{ id: string; name: string; icon: string; sortOrder?: number }>> {
    return apiClient.get('/waste-containers');
  }

  async getAdminList(includeInactive = false): Promise<WasteContainerDto[]> {
    return apiClient.get<WasteContainerDto[]>('/admin/waste-containers', {
      includeInactive: includeInactive ? 'true' : 'false',
    } as Record<string, unknown>);
  }

  async create(data: { name: string; icon?: string; sortOrder?: number }): Promise<WasteContainerDto> {
    return apiClient.post<WasteContainerDto>('/admin/waste-containers', data);
  }

  async update(
    id: string,
    data: { name?: string; icon?: string; sortOrder?: number; active?: boolean }
  ): Promise<WasteContainerDto> {
    return apiClient.put<WasteContainerDto>(`/admin/waste-containers/${id}`, data);
  }
}

export const wasteContainersService = new WasteContainersService();
