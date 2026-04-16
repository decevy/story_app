// src/api/axios-config.ts

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { tokenService } from '../services/token.service';
import config from '../config/env.config';
import { LoginResponse, RefreshTokenRequest } from '../types/auth.types';

// Types
type QueuedPromise = {
  resolve: (value: string) => void;
  reject: (error: unknown) => void;
};

type RequestConfigWithRetry = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

// Create axios instance
export const api = axios.create({
  baseURL: `${config.apiUrl}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add token to requests
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenService.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Token refresh state
let isRefreshing = false;
let failedQueue: QueuedPromise[] = [];

// Helper functions
const processQueue = (error: unknown, token: string | null = null): void => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const setAuthHeader = (config: InternalAxiosRequestConfig, token: string): void => {
  if (config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
};

// todo: understand this code
const queueFailedRequest = async (originalRequest: RequestConfigWithRetry): Promise<any> => {
  const token = await new Promise<string>((resolve, reject) => {
    failedQueue.push({ resolve, reject });
  });
  setAuthHeader(originalRequest, token);
  return await api(originalRequest);
};

const handleTokenRefresh = async (
  originalRequest: RequestConfigWithRetry,
  error: AxiosError
): Promise<any> => {
  originalRequest._retry = true;
  isRefreshing = true;

  const refreshToken = tokenService.getRefreshToken();
  if (!refreshToken) {
    tokenService.clearTokens();
    processQueue(error, null);
    isRefreshing = false;
    throw error;
  }

  try {
    const refreshRequest: RefreshTokenRequest = { refreshToken };
    const response = await axios.post<LoginResponse>(
      '/api/auth/refresh',
      refreshRequest
    );

    const { accessToken, refreshToken: newRefreshToken } = response.data;
    tokenService.setTokens(accessToken, newRefreshToken);
    setAuthHeader(originalRequest, accessToken);
    processQueue(null, accessToken);

    return api(originalRequest);
  } catch (refreshError) {
    console.error('Token refresh failed:', refreshError);
    processQueue(refreshError, null);
    tokenService.clearTokens();
    window.location.href = '/login';
    throw refreshError;
  } finally {
    isRefreshing = false;
  }
};

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RequestConfigWithRetry;

    const shouldRefreshToken = error.response?.status === 401 && !originalRequest._retry;

    if (shouldRefreshToken) {
      if (isRefreshing) {
        return queueFailedRequest(originalRequest);
      }
      return handleTokenRefresh(originalRequest, error);
    }

    throw error;
  }
);