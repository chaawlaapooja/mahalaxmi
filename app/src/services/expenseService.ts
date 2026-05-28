import { api } from './api';
import type { ApiResponse, Expense } from '../types';

export const expenseService = {
  getAll: async (params?: { category?: string; month?: number; year?: number }) => {
    const { data } = await api.get<ApiResponse<Expense[]> & { total: number }>(
      '/expenses',
      { params }
    );
    return { expenses: data.data, total: data.total };
  },
  getCategories: async () => {
    const { data } = await api.get<ApiResponse<string[]>>('/expenses/categories');
    return data.data;
  },
  create: async (payload: Partial<Expense>) => {
    const { data } = await api.post<ApiResponse<Expense>>('/expenses', payload);
    return data.data;
  },
  update: async (id: string, payload: Partial<Expense>) => {
    const { data } = await api.put<ApiResponse<Expense>>(`/expenses/${id}`, payload);
    return data.data;
  },
  delete: async (id: string) => {
    await api.delete(`/expenses/${id}`);
  },
};
