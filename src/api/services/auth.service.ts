import { apiClient } from '../client';
import { LoginCredentials, LoginResponse, User } from '@/types/user';
import { APP_CONFIG } from '@/constants/config';

class AuthService {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
    this.saveAuthData(response.user, response.token);
    return response;
  }

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout', {});
    this.clearAuthData();
  }

  async getCurrentUser(): Promise<User> {
    return apiClient.get<User>('/auth/me');
  }

  async refreshToken(): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/refresh', {});
    this.saveAuthData(response.user, response.token);
    return response;
  }

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
}

export const authService = new AuthService();
