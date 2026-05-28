import { api } from './api';
import type { ApiResponse, Product } from '../types';
import { PRODUCT_CATEGORIES } from '../constants/productCategories';

export const productService = {
  getAll: async (params?: { search?: string; category?: string; lowStock?: boolean }) => {
    const { data } = await api.get<ApiResponse<Product[]>>('/products', { params });
    return data.data;
  },
  getById: async (id: string) => {
    const { data } = await api.get<ApiResponse<Product>>(`/products/${id}`);
    return data.data;
  },
  getByBarcode: async (barcode: string) => {
    const { data } = await api.get<ApiResponse<Product>>(
      `/products/barcode/${encodeURIComponent(barcode.trim())}`
    );
    return data.data;
  },
  getCategories: async () => {
    const { data } = await api.get<ApiResponse<string[]>>('/products/categories');
    return data.data.length ? data.data : [...PRODUCT_CATEGORIES];
  },
  create: async (payload: Partial<Product>) => {
    const { data } = await api.post<ApiResponse<Product>>('/products', payload);
    return data.data;
  },
  update: async (id: string, payload: Partial<Product>) => {
    const { data } = await api.put<ApiResponse<Product>>(`/products/${id}`, payload);
    return data.data;
  },
  delete: async (id: string) => {
    await api.delete(`/products/${id}`);
  },
};
