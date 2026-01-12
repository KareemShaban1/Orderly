import { createContext, useContext, useState, type ReactNode } from 'react';
import apiClient from '../api/client';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  tenant_id?: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  registerOrganization: (data: OrganizationRegisterData) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  tenant_id?: number;
  role: string;
}

interface OrganizationRegisterData {
  org_name: string;
  org_email: string;
  org_phone?: string;
  org_address?: string;
  governorate?: string;
  city?: string;
  area?: string;
  subscription_plan: 'starter' | 'professional' | 'enterprise';
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('token');
  });

  const login = async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login', { email, password });
    const { user: userData, token: authToken } = response.data;
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', authToken);
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
  };

  const register = async (data: RegisterData) => {
    const response = await apiClient.post('/auth/register', data);
    const { user: userData, token: authToken } = response.data;
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', authToken);
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
  };

  const registerOrganization = async (data: OrganizationRegisterData) => {
    const response = await apiClient.post('/auth/register-organization', data);
    const { user: userData, token: authToken } = response.data;
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', authToken);
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    delete apiClient.defaults.headers.common['Authorization'];
  };

  // Set token in axios if it exists
  if (token && !apiClient.defaults.headers.common['Authorization']) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        registerOrganization,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}






