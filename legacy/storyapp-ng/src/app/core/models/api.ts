/** Error body returned by the API (e.g. `{ "error": "Email already exists" }`). */
export interface ErrorResponse {
  error: string;
}

/** Plain confirmation body (e.g. after adding a writer). */
export interface MessageResponse {
  message: string;
}

/** A page of results (e.g. `GET /stories/:id/passages?page=1&pageSize=50`). */
export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
