import { type ErrorHandler, inject, Injectable } from '@angular/core';

import { Notifier } from '../notifications/notifier';
import { Logger } from './logger';

/** Logs uncaught errors and tells the user something went wrong. */
@Injectable()
export class AppErrorHandler implements ErrorHandler {
  private readonly logger = inject(Logger);
  private readonly notifier = inject(Notifier);

  handleError(error: unknown): void {
    this.logger.error('Unhandled error:', error);
    this.notifier.error('Something went wrong. Please try again.');
  }
}
