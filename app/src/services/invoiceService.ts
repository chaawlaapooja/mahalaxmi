import { api } from './api';
import type { ApiResponse, Invoice } from '../types';

export interface CreateInvoicePayload {
  customer: string;
  billedBy?: string;
  items: { product: string; quantity: number; unitPrice?: number }[];
  discountType?: 'none' | 'percent' | 'fixed';
  discountValue?: number;
  taxRate?: number;
  notes?: string;
  paymentMode?: 'cash' | 'upi' | 'credit_debit_card';
  paymentStatus?: 'paid' | 'pending';
}

export const invoiceService = {
  getAll: async (params?: { customer?: string; from?: string; to?: string }) => {
    const { data } = await api.get<ApiResponse<Invoice[]>>('/invoices', { params });
    return data.data;
  },
  getById: async (id: string) => {
    const { data } = await api.get<ApiResponse<Invoice>>(`/invoices/${id}`);
    return data.data;
  },
  create: async (payload: CreateInvoicePayload) => {
    const { data } = await api.post<ApiResponse<Invoice>>('/invoices', payload);
    return data.data;
  },
  cancel: async (id: string) => {
    const { data } = await api.patch<ApiResponse<Invoice>>(`/invoices/${id}/cancel`);
    return data.data;
  },
};
