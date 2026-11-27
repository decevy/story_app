import { TestBed } from '@angular/core/testing';

import { LocalStorage } from './local-storage';
import { persistedSignal } from './persisted-signal';

type Color = 'red' | 'blue';
const isColor = (value: string): value is Color => value === 'red' || value === 'blue';

describe('LocalStorage', () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('reads, writes and removes values', () => {
    const storage = TestBed.inject(LocalStorage);
    storage.set('k', 'v');
    expect(storage.get('k')).toBe('v');
    storage.remove('k');
    expect(storage.get('k')).toBeNull();
  });

  it('swallows storage errors', () => {
    const storage = TestBed.inject(LocalStorage);
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(storage.get('k')).toBeNull();
    expect(() => {
      storage.set('k', 'v');
      storage.remove('k');
    }).not.toThrow();
  });
});

describe('persistedSignal', () => {
  afterEach(() => {
    localStorage.clear();
  });

  function create() {
    return TestBed.runInInjectionContext(() => persistedSignal<Color>('color', 'red', isColor));
  }

  it('starts from a valid stored value', () => {
    localStorage.setItem('color', 'blue');
    expect(create()()).toBe('blue');
  });

  it('falls back when nothing valid is stored', () => {
    localStorage.setItem('color', 'green');
    expect(create()()).toBe('red');
  });

  it('writes changes back to storage', () => {
    const color = create();
    color.set('blue');
    TestBed.tick();
    expect(localStorage.getItem('color')).toBe('blue');
  });
});
