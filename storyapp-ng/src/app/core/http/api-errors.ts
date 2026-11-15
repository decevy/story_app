import { HttpErrorResponse } from '@angular/common/http';

import type { ErrorResponse } from '../models/api';

/** True for a 4xx response: the request was understood and refused (bad input, conflict). */
export function isRejection(error: unknown): error is HttpErrorResponse {
  return error instanceof HttpErrorResponse && error.status >= 400 && error.status < 500;
}

/** The `{ "error": "..." }` message from an API error response, if there is one. */
export function apiErrorMessage(error: unknown): string | undefined {
  if (!(error instanceof HttpErrorResponse)) {
    return undefined;
  }
  const body = error.error as Partial<ErrorResponse> | null;
  return typeof body?.error === 'string' && body.error.length > 0 ? body.error : undefined;
}
