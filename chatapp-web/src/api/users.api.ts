// src/api/users.api.ts

import { api } from './axios-config';
import { User } from '../types/auth.types';

export interface UpdateUserRequest {
  username?: string;
  email?: string;
}

export const usersApi = {
  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/users/me');
    return response.data;
  },

  async getUser(userId: number): Promise<User> {
    const response = await api.get<User>(`/users/${userId}`);
    return response.data;
  },

  async searchUsers(query: string): Promise<User[]> {
    const response = await api.get<User[]>('/users/search', {
      params: { query },
    });
    return response.data;
  },

  async updateCurrentUser(data: UpdateUserRequest): Promise<User> {
    const response = await api.put<User>('/users/me', data);
    return response.data;
  },

  async getAllUsers(): Promise<User[]> {
    const response = await api.get<User[]>('/users');
    return response.data;
  },
};