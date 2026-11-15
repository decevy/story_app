import { HttpErrorResponse } from '@angular/common/http';

import { apiErrorMessage, isRejection } from './api-errors';

describe('api-errors', () => {
  it('treats 4xx responses as rejections', () => {
    expect(isRejection(new HttpErrorResponse({ status: 401 }))).toBe(true);
    expect(isRejection(new HttpErrorResponse({ status: 500 }))).toBe(false);
    expect(isRejection(new HttpErrorResponse({ status: 0 }))).toBe(false);
    expect(isRejection(new Error('x'))).toBe(false);
  });

  it('reads the API error message', () => {
    const conflict = new HttpErrorResponse({
      status: 400,
      error: { error: 'Email already exists' },
    });
    expect(apiErrorMessage(conflict)).toBe('Email already exists');
    expect(apiErrorMessage(new HttpErrorResponse({ status: 400, error: null }))).toBeUndefined();
    expect(
      apiErrorMessage(new HttpErrorResponse({ status: 400, error: { error: '' } })),
    ).toBeUndefined();
    expect(apiErrorMessage(new Error('x'))).toBeUndefined();
  });
});
