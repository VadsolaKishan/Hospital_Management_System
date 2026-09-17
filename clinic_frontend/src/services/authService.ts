import api from './api';
import { tokenStore } from '../utils/tokenStore';

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: 'ADMIN' | 'DOCTOR' | 'STAFF' | 'PATIENT' | 'LAB_TECHNICIAN';
  is_active: boolean;
  full_name: string;
  patient_id?: number;
  doctor_id?: number;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  confirm_password: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  tokens: {
    access: string;
  };
}

// Helper to extract results from paginated responses
const extractResults = (data: any): any[] => {
  if (Array.isArray(data)) {
    return data;
  }
  if (data && data.results && Array.isArray(data.results)) {
    return data.results;
  }
  return [];
};

export const authService = {
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await api.post('/accounts/users/login/', data);
    return response.data;
  },

  async googleLogin(token: string): Promise<AuthResponse> {
    const response = await api.post('/accounts/users/google_login/', { token });
    return response.data;
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post('/accounts/users/register/', data);
    return response.data;
  },

  async getProfile(): Promise<User> {
    const response = await api.get('/accounts/users/profile/');
    return response.data;
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await api.patch('/accounts/users/profile/', data);
    return response.data;
  },

  async getAllUsers(searchQuery?: string): Promise<User[]> {
    const params = searchQuery ? { search: searchQuery } : {};
    const response = await api.get('/accounts/users/', { params });
    return extractResults(response.data);
  },

  async getPendingDoctors(): Promise<User[]> {
    const response = await api.get('/accounts/users/pending_doctors/');
    return extractResults(response.data);
  },

  async blockUser(userId: number): Promise<void> {
    await api.post(`/accounts/users/${userId}/block_user/`);
  },

  async activateUser(userId: number): Promise<void> {
    await api.post(`/accounts/users/${userId}/activate_user/`);
  },

  async initCsrf(): Promise<void> {
    await api.get('/accounts/csrf/');
  },

  async logout(): Promise<void> {
    try {
      await api.post('/accounts/users/logout/');
    } catch (e) {
      // Ignore error if logout fails (e.g. network issue), we still clear local state
    }
    tokenStore.clearToken();
  },

  isAuthenticated(): boolean {
    return !!tokenStore.getToken();
  },

  setAuthData(data: AuthResponse): void {
    tokenStore.setToken(data.tokens.access);
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await api.post('/accounts/users/forgot_password/', { email });
    return response.data;
  },

  async verifyResetToken(token: string): Promise<{ message: string; valid: boolean }> {
    const response = await api.post('/accounts/users/verify_reset_token/', { token });
    return response.data;
  },

  async resetPassword(token: string, password: string, confirm_password: string): Promise<{ message: string }> {
    const response = await api.post('/accounts/users/reset_password/', {
      token,
      password,
      confirm_password,
    });
    return response.data;
  },
};
