import { api } from './api';
import type { ApiResponse, Customer, Invoice } from '../types';

export const customerService = {
  getAll: async (search?: string) => {
    const { data } = await api.get<ApiResponse<Customer[]>>('/customers', {
      params: { search },
    });
    return data.data;
  },
  getById: async (id: string) => {
    const { data } = await api.get<ApiResponse<Customer>>(`/customers/${id}`);
    return data.data;
  },
  getHistory: async (id: string) => {
    const { data } = await api.get<
      ApiResponse<{ customer: Customer; invoices: Invoice[] }>
    >(`/customers/${id}/history`);
    return data.data;
  },
  create: async (payload: Partial<Customer>) => {
    const { data } = await api.post<ApiResponse<Customer>>('/customers', payload);
    return data.data;
  },
  update: async (id: string, payload: Partial<Customer>) => {
    const { data } = await api.put<ApiResponse<Customer>>(`/customers/${id}`, payload);
    return data.data;
  },
  delete: async (id: string) => {
    await api.delete(`/customers/${id}`);
  },
};
