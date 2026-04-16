// src/api/stories.api.ts

import { api } from './axios-config';
import {
  Story,
  StorySummary,
  CreateStoryRequest,
  UpdateStoryRequest,
  AddStoryMemberRequest,
  Turn,
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

  async addMember(
    storyId: number,
    data: AddStoryMemberRequest
  ): Promise<MessageResponse> {
    const response = await api.post<MessageResponse>(
      `/stories/${storyId}/members`,
      data
    );
    return response.data;
  },

  async removeMember(storyId: number, userId: number): Promise<void> {
    await api.delete(`/stories/${storyId}/members/${userId}`);
  },

  async getStoryTurns(
    storyId: number,
    page: number = 1,
    pageSize: number = 50
  ): Promise<PaginatedResponse<Turn>> {
    const response = await api.get<PaginatedResponse<Turn>>(
      `/stories/${storyId}/turns`,
      {
        params: { page, pageSize },
      }
    );
    return response.data;
  },
};
