import { api } from './api';
import type { ApiResponse, DashboardStats } from '../types';

export const analyticsService = {
  getDashboard: async () => {
    const { data } = await api.get<ApiResponse<DashboardStats>>('/analytics/dashboard');
    return data.data;
  },
  getSales: async (months = 6) => {
    const { data } = await api.get<ApiResponse<unknown[]>>('/analytics/sales', {
      params: { months },
    });
    return data.data;
  },
  getExpenses: async (months = 6) => {
    const { data } = await api.get<
      ApiResponse<{ byMonth: unknown[]; byCategory: { _id: string; total: number }[] }>
    >('/analytics/expenses', { params: { months } });
    return data.data;
  },
  getProfit: async (months = 6) => {
    const { data } = await api.get<
      ApiResponse<
        { year: number; month: number; revenue: number; expenses: number; profit: number }[]
      >
    >('/analytics/profit', { params: { months } });
    return data.data;
  },
};
