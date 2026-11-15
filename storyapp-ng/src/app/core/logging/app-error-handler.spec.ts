import { ErrorHandler } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { Notifier } from '../notifications/notifier';
import { AppErrorHandler } from './app-error-handler';
import { Logger } from './logger';

describe('AppErrorHandler', () => {
  it('logs the error and shows a notification', () => {
    const logger = { error: vi.fn() };
    const notifier = { error: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        { provide: ErrorHandler, useClass: AppErrorHandler },
        { provide: Logger, useValue: logger },
        { provide: Notifier, useValue: notifier },
      ],
    });
    const error = new Error('boom');

    TestBed.inject(ErrorHandler).handleError(error);

    expect(logger.error).toHaveBeenCalledWith('Unhandled error:', error);
    expect(notifier.error).toHaveBeenCalledWith('Something went wrong. Please try again.');
  });
});
