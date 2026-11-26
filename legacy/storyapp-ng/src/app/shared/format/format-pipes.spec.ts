import { PluralPipe } from './plural-pipe';
import { TimeAgoPipe } from './time-ago-pipe';
import { TruncatePipe } from './truncate-pipe';

describe('TimeAgoPipe', () => {
  const pipe = new TimeAgoPipe();
  const now = new Date('2026-01-01T12:00:00Z').getTime();

  it('describes the distance to now', () => {
    expect(pipe.transform('2026-01-01T11:55:00Z', now)).toBe('5 minutes ago');
    expect(pipe.transform('2025-12-31T12:00:00Z', now)).toBe('1 day ago');
  });
});

describe('TruncatePipe', () => {
  const pipe = new TruncatePipe();

  it('keeps short text', () => {
    expect(pipe.transform('short', 10)).toBe('short');
    expect(pipe.transform('exactly10!', 10)).toBe('exactly10!');
  });

  it('cuts long text and adds an ellipsis', () => {
    expect(pipe.transform('a'.repeat(12), 10)).toBe(`${'a'.repeat(10)}...`);
  });
});

describe('PluralPipe', () => {
  const pipe = new PluralPipe();

  it('picks the singular for one and the plural otherwise', () => {
    expect(pipe.transform(1, 'writer', 'writers')).toBe('1 writer');
    expect(pipe.transform(0, 'writer', 'writers')).toBe('0 writers');
    expect(pipe.transform(3, 'writer', 'writers')).toBe('3 writers');
  });
});
