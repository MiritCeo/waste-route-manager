import { apiClient } from '../client';
import { LoginCredentials, LoginResponse, User } from '@/types/user';
import { APP_CONFIG } from '@/constants/config';
import { ADMIN_ACCOUNTS, buildAdminUser } from '@/constants/adminAccounts';

// Mock users for development
const MOCK_USERS: User[] = [
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
];

const ADMIN_USERS: User[] = ADMIN_ACCOUNTS.map((account, index) =>
  buildAdminUser(account, `admin_${index + 1}`)
);

class AuthService {
  private useMockData = APP_CONFIG.API.USE_MOCK_DATA;

  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    if (this.useMockData) {
      return this.mockLogin(credentials);
    }

    const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
    this.saveAuthData(response.user, response.token);
    return response;
  }

  async logout(): Promise<void> {
    if (this.useMockData) {
      return this.mockLogout();
    }

    await apiClient.post('/auth/logout');
    this.clearAuthData();
  }

  async getCurrentUser(): Promise<User> {
    if (this.useMockData) {
      return this.mockGetCurrentUser();
    }

    return apiClient.get<User>('/auth/me');
  }

  async refreshToken(): Promise<LoginResponse> {
    if (this.useMockData) {
      const user = this.mockGetCurrentUser();
      return {
        user,
        token: this.generateMockToken(),
      };
    }

    return apiClient.post<LoginResponse>('/auth/refresh');
  }

  // Helper methods
  saveAuthData(user: User, token: string): void {
    localStorage.setItem(APP_CONFIG.AUTH.TOKEN_KEY, token);
    localStorage.setItem(APP_CONFIG.AUTH.USER_KEY, JSON.stringify(user));
  }

  clearAuthData(): void {
    localStorage.removeItem(APP_CONFIG.AUTH.TOKEN_KEY);
    localStorage.removeItem(APP_CONFIG.AUTH.USER_KEY);
  }

  getStoredUser(): User | null {
    const userJson = localStorage.getItem(APP_CONFIG.AUTH.USER_KEY);
    if (!userJson) return null;
    
    try {
      return JSON.parse(userJson);
    } catch {
      return null;
    }
  }

  getStoredToken(): string | null {
    return localStorage.getItem(APP_CONFIG.AUTH.TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.getStoredToken() && !!this.getStoredUser();
  }

  // Mock implementations for development
  private async mockLogin(credentials: LoginCredentials): Promise<LoginResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Simple validation
    if (!credentials.employeeId || !credentials.pin) {
      throw new Error('Nieprawidłowe dane logowania');
    }

    // For demo, accept any PIN with 4+ digits
    if (credentials.pin.length < APP_CONFIG.AUTH.PIN_MIN_LENGTH) {
      throw new Error('PIN musi mieć minimum 4 cyfry');
    }

    const adminAccount = ADMIN_ACCOUNTS.find(
      account => account.employeeId === credentials.employeeId
    );

    if (adminAccount) {
      if (adminAccount.pin !== credentials.pin) {
        throw new Error('Nieprawidłowy PIN');
      }

      const adminUser = ADMIN_USERS.find(u => u.employeeId === adminAccount.employeeId);
      if (!adminUser) {
        throw new Error('Nie znaleziono konta administratora');
      }

      const adminResponse: LoginResponse = {
        user: {
          ...adminUser,
          lastLogin: new Date().toISOString(),
        },
        token: this.generateMockToken(),
      };

      this.saveAuthData(adminResponse.user, adminResponse.token);

      return adminResponse;
    }

    // Find user by employeeId or use default driver
    const user = MOCK_USERS.find(u => u.employeeId === credentials.employeeId) || MOCK_USERS[0];
    
    const token = this.generateMockToken();

    const response: LoginResponse = {
      user: {
        ...user,
        lastLogin: new Date().toISOString(),
      },
      token,
    };

    this.saveAuthData(response.user, response.token);

    return response;
  }

  private async mockLogout(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 200));
    this.clearAuthData();
  }

  private mockGetCurrentUser(): User {
    const storedUser = this.getStoredUser();
    if (!storedUser) {
      throw new Error('Nie jesteś zalogowany');
    }
    return storedUser;
  }

  private generateMockToken(): string {
    return `mock_token_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }
}

export const authService = new AuthService();
