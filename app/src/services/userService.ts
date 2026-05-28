import { api } from './api';
import type { ApiResponse, StaffUser } from '../types';

export const userService = {
  getStaff: async () => {
    const { data } = await api.get<ApiResponse<StaffUser[]>>('/users/staff');
    return data.data;
  },
};
