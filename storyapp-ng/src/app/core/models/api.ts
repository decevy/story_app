/** Error body returned by the API (e.g. `{ "error": "Email already exists" }`). */
export interface ErrorResponse {
  error: string;
}

/** Plain confirmation body (e.g. after adding a writer). */
export interface MessageResponse {
  message: string;
}
