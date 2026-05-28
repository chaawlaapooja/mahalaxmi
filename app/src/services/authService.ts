import { api } from './api';
import type { User } from '../types';

interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

export const authService = {
  login: async (email: string, password: string) => {
    const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
    return data;
  },
  getMe: async () => {
    const { data } = await api.get<{ success: boolean; user: User }>('/auth/me');
    return data.user;
  },
};
