import { HttpClient, httpResource, type HttpResourceRef } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { injectApiUrl } from '@core/config/api-url';
import type { MessageResponse, PaginatedResponse } from '@core/models/api';
import type { Passage, Story, StorySummary } from '@core/models/story';
import type { Observable } from 'rxjs';

import type { AddWriterRequest, CreateStoryRequest, UpdateStoryRequest } from './story-dtos';

/** Passages per page. Only the first page is loaded for now (as in storyapp-web). */
export const PASSAGE_PAGE_SIZE = 50;

/**
 * Every `/stories` endpoint. Reads are `httpResource` factories: call them in an injection
 * context (a field initializer); the resource lives as long as that context.
 */
@Injectable({ providedIn: 'root' })
export class StoriesApi {
  private readonly http = inject(HttpClient);
  private readonly url = injectApiUrl();

  storiesResource(): HttpResourceRef<StorySummary[]> {
    return httpResource<StorySummary[]>(() => this.url('/stories'), { defaultValue: [] });
  }

  /** The story with `id()`; idle while `id()` is null. */
  storyResource(id: () => number | null): HttpResourceRef<Story | undefined> {
    return httpResource<Story>(() => {
      const storyId = id();
      return storyId == null ? undefined : this.url(`/stories/${storyId}`);
    });
  }

  /** The first page of passages of story `id()`; idle while `id()` is null. */
  passagesResource(
    id: () => number | null,
  ): HttpResourceRef<PaginatedResponse<Passage> | undefined> {
    return httpResource<PaginatedResponse<Passage>>(() => {
      const storyId = id();
      return storyId == null
        ? undefined
        : {
            url: this.url(`/stories/${storyId}/passages`),
            params: { page: 1, pageSize: PASSAGE_PAGE_SIZE },
          };
    });
  }

  createStory(data: CreateStoryRequest): Observable<Story> {
    return this.http.post<Story>(this.url('/stories'), data);
  }

  updateStory(storyId: number, data: UpdateStoryRequest): Observable<Story> {
    return this.http.put<Story>(this.url(`/stories/${storyId}`), data);
  }

  /** Emits `null` (204 No Content). */
  deleteStory(storyId: number): Observable<null> {
    return this.http.delete<null>(this.url(`/stories/${storyId}`));
  }

  addWriter(storyId: number, data: AddWriterRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(this.url(`/stories/${storyId}/writers`), data);
  }

  /** Emits `null` (204 No Content). */
  removeWriter(storyId: number, userId: number): Observable<null> {
    return this.http.delete<null>(this.url(`/stories/${storyId}/writers/${userId}`));
  }
}
