/** Request bodies of the story endpoints (`POST/PUT /stories`, `POST /stories/:id/writers`). */

export interface CreateStoryRequest {
  name: string;
  description?: string;
  isPrivate: boolean;
}

export interface UpdateStoryRequest {
  name: string;
  description?: string;
}

export interface AddWriterRequest {
  userId: number;
}
