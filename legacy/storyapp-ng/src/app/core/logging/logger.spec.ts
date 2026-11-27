import { TestBed } from '@angular/core/testing';

import { DEV_MODE } from '../config/dev-mode';
import { Logger } from './logger';

describe('Logger', () => {
  let logger: Logger;

  beforeEach(() => {
    logger = TestBed.inject(Logger);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logs debug output in dev mode', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    logger.debug('joined', 3);
    expect(log).toHaveBeenCalledWith('joined', 3);
  });

  it('keeps debug output quiet in production', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [{ provide: DEV_MODE, useValue: false }] });
    logger = TestBed.inject(Logger);
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    logger.debug('joined');
    expect(log).not.toHaveBeenCalled();
  });

  it('writes errors with and without a cause', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const cause = new Error('boom');
    logger.error('Send failed', cause);
    logger.error('Plain');
    expect(error).toHaveBeenNthCalledWith(1, 'Send failed', cause);
    expect(error).toHaveBeenNthCalledWith(2, 'Plain');
  });

  it('writes warnings', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    logger.warn('Careful', 1);
    expect(warn).toHaveBeenCalledWith('Careful', 1);
  });
});
