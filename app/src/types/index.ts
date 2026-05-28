export type UserRole = 'admin' | 'employee';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface StaffUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Product {
  _id: string;
  name: string;
  barcode: string;
  category: string;
  color: string;
  size: string;
  price: number;
  costPrice?: number;
  quantity: number;
  lowStockThreshold: number;
  isActive: boolean;
  isLowStock?: boolean;
  createdAt: string;
}

export interface Customer {
  _id: string;
  name: string;
  email?: string;
  phone: string;
  address?: string;
  city?: string;
  notes?: string;
  createdAt: string;
}

export interface InvoiceItem {
  product: string;
  productName: string;
  barcode?: string;
  color?: string;
  size?: string;
  quantity: number;
  unitPrice: number;
  costPrice?: number;
  lineTotal: number;
}

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  customer: Customer | string;
  items: InvoiceItem[];
  subtotal: number;
  discountType: 'none' | 'percent' | 'fixed';
  discountValue: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  notes?: string;
  paymentMode: 'cash' | 'upi' | 'credit_debit_card';
  paymentStatus: 'paid' | 'pending';
  status: 'draft' | 'paid' | 'cancelled';
  billedBy?: { _id: string; name: string; role: UserRole };
  createdBy?: { name: string };
  createdAt: string;
}

export interface Expense {
  _id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  description?: string;
  createdBy?: { name: string };
}

export interface DashboardStats {
  totalRevenue: number;
  totalInvoices: number;
  monthRevenue: number;
  monthInvoices: number;
  monthExpenses: number;
  monthProfit: number;
  lowStockCount: number;
  totalProducts: number;
  totalCustomers: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
