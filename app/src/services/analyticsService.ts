import { api } from './api';
import type { ApiResponse, DashboardStats } from '../types';

export interface AnalyticsFilterParams {
  months?: number;
  from?: string;
  to?: string;
  staffId?: string;
}

export const analyticsService = {
  getDashboard: async () => {
    const { data } = await api.get<ApiResponse<DashboardStats>>('/analytics/dashboard');
    return data.data;
  },
  getSales: async (params: AnalyticsFilterParams = { months: 6 }) => {
    const { data } = await api.get<ApiResponse<unknown[]>>('/analytics/sales', { params });
    return data.data;
  },
  getSalesByStaff: async (params: AnalyticsFilterParams = {}) => {
    const { data } = await api.get<ApiResponse<unknown[]>>('/analytics/sales-by-staff', {
      params,
    });
    return data.data;
  },
  getStockBySize: async () => {
    const { data } = await api.get<ApiResponse<unknown[]>>('/analytics/stock-by-size');
    return data.data;
  },
  getExpenses: async (params: AnalyticsFilterParams = { months: 6 }) => {
    const { data } = await api.get<
      ApiResponse<{ byMonth: unknown[]; byCategory: { _id: string; total: number }[] }>
    >('/analytics/expenses', { params });
    return data.data;
  },
  getProfit: async (params: AnalyticsFilterParams = { months: 6 }) => {
    const { data } = await api.get<
      ApiResponse<
        { year: number; month: number; revenue: number; expenses: number; profit: number }[]
      >
    >('/analytics/profit', { params });
    return data.data;
  },
};
