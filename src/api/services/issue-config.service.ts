import { apiClient } from '../client';
import { IssueConfig } from '@/types/issueConfig';

class IssueConfigService {
  async getIssueConfig(): Promise<IssueConfig> {
    return apiClient.get<IssueConfig>('/issues/config');
  }

  async saveIssueConfig(config: IssueConfig): Promise<IssueConfig> {
    const payload = { ...config, updatedAt: new Date().toISOString() };
    return apiClient.put<IssueConfig>('/admin/issues/config', payload);
  }
}

export const issueConfigService = new IssueConfigService();
