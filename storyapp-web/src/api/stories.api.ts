// src/api/stories.api.ts

import { api } from './axios-config';
import {
  Story,
  StorySummary,
  CreateStoryRequest,
  UpdateStoryRequest,
  AddWriterRequest,
  Passage,
  PaginatedResponse,
} from '../types/story.types';
import { MessageResponse } from '../types/common.types';

export const storiesApi = {
  async getUserStories(): Promise<StorySummary[]> {
    const response = await api.get<StorySummary[]>('/stories');
    return response.data;
  },

  async getStory(storyId: number): Promise<Story> {
    const response = await api.get<Story>(`/stories/${storyId}`);
    return response.data;
  },

  async createStory(data: CreateStoryRequest): Promise<Story> {
    const response = await api.post<Story>('/stories', data);
    return response.data;
  },

  async updateStory(storyId: number, data: UpdateStoryRequest): Promise<Story> {
    const response = await api.put<Story>(`/stories/${storyId}`, data);
    return response.data;
  },

  async deleteStory(storyId: number): Promise<void> {
    await api.delete(`/stories/${storyId}`);
  },

  async addWriter(
    storyId: number,
    data: AddWriterRequest
  ): Promise<MessageResponse> {
    const response = await api.post<MessageResponse>(
      `/stories/${storyId}/writers`,
      data
    );
    return response.data;
  },

  async removeWriter(storyId: number, userId: number): Promise<void> {
    await api.delete(`/stories/${storyId}/writers/${userId}`);
  },

  async getStoryPassages(
    storyId: number,
    page: number = 1,
    pageSize: number = 50
  ): Promise<PaginatedResponse<Passage>> {
    const response = await api.get<PaginatedResponse<Passage>>(
      `/stories/${storyId}/passages`,
      {
        params: { page, pageSize },
      }
    );
    return response.data;
  },
};
