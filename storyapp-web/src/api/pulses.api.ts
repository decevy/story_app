// src/api/pulses.api.ts

import { api } from './axios-config';
import {
  Pulse,
  PulseSummary,
  CreatePulseRequest,
  UpdatePulseRequest,
  AddPacerRequest,
  Beat,
  PaginatedResponse,
} from '../types/pulse.types';
import { MessageResponse } from '../types/common.types';

export const pulsesApi = {
  async getUserPulses(): Promise<PulseSummary[]> {
    const response = await api.get<PulseSummary[]>('/pulses');
    return response.data;
  },

  async getPulse(pulseId: number): Promise<Pulse> {
    const response = await api.get<Pulse>(`/pulses/${pulseId}`);
    return response.data;
  },

  async createPulse(data: CreatePulseRequest): Promise<Pulse> {
    const response = await api.post<Pulse>('/pulses', data);
    return response.data;
  },

  async updatePulse(pulseId: number, data: UpdatePulseRequest): Promise<Pulse> {
    const response = await api.put<Pulse>(`/pulses/${pulseId}`, data);
    return response.data;
  },

  async deletePulse(pulseId: number): Promise<void> {
    await api.delete(`/pulses/${pulseId}`);
  },

  async addPacer(
    pulseId: number,
    data: AddPacerRequest
  ): Promise<MessageResponse> {
    const response = await api.post<MessageResponse>(
      `/pulses/${pulseId}/pacers`,
      data
    );
    return response.data;
  },

  async removePacer(pulseId: number, userId: number): Promise<void> {
    await api.delete(`/pulses/${pulseId}/pacers/${userId}`);
  },

  async getPulseBeats(
    pulseId: number,
    page: number = 1,
    pageSize: number = 50
  ): Promise<PaginatedResponse<Beat>> {
    const response = await api.get<PaginatedResponse<Beat>>(
      `/pulses/${pulseId}/beats`,
      {
        params: { page, pageSize },
      }
    );
    return response.data;
  },
};
