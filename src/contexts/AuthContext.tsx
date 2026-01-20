import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginCredentials, AuthState } from '@/types/user';
import { authService } from '@/api/services/auth.service';
import { toast } from 'sonner';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  checkAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    try {
      const user = authService.getStoredUser();
      const token = authService.getStoredToken();

      if (user && token) {
        setState({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        setState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  };

  const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      const response = await authService.login(credentials);

      setState({
        user: response.user,
        token: response.token,
        isAuthenticated: true,
        isLoading: false,
      });

      toast.success('Zalogowano pomyślnie', {
        description: `Witaj, ${response.user.name}!`,
      });

      return response;
    } catch (error: any) {
      setState(prev => ({ ...prev, isLoading: false }));
      
      const message = error?.message || 'Nie udało się zalogować';
      toast.error('Błąd logowania', {
        description: message,
      });
      
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();

      setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });

      toast.success('Wylogowano pomyślnie');
    } catch (error: any) {
      console.error('Logout failed:', error);
      toast.error('Błąd wylogowania');
    }
  };

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
