import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { APP_CONFIG } from '../../core/config/app-config';
import { apiUrl } from '../../core/config/api-url';
import { MessageResponse } from '../../core/models/api';
import { AddWriterRequest, CreateStoryRequest, Story, UpdateStoryRequest } from '../../core/models/story';

/** Mutation endpoints from SPEC.md (not used in the UI yet). Reads live in StoryStore. */
@Injectable({ providedIn: 'root' })
export class StoriesApi {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);

  createStory(data: CreateStoryRequest): Observable<Story> {
    return this.http.post<Story>(apiUrl(this.config, '/stories'), data);
  }

  updateStory(storyId: number, data: UpdateStoryRequest): Observable<Story> {
    return this.http.put<Story>(apiUrl(this.config, `/stories/${storyId}`), data);
  }

  deleteStory(storyId: number): Observable<void> {
    return this.http.delete<void>(apiUrl(this.config, `/stories/${storyId}`));
  }

  addWriter(storyId: number, data: AddWriterRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(apiUrl(this.config, `/stories/${storyId}/writers`), data);
  }

  removeWriter(storyId: number, userId: number): Observable<void> {
    return this.http.delete<void>(apiUrl(this.config, `/stories/${storyId}/writers/${userId}`));
  }
}
