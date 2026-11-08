import { afterEach, describe, expect, it, vi } from 'vitest';
import { REPORT_LOG_NUMBER_STORAGE_KEY } from './constants';
import { advanceMileageLogNumber, getNextMileageLogNumber } from './storage';

function useStorage(initial?: string): Map<string, string> {
  const values = new Map<string, string>();
  if (initial !== undefined) {
    values.set(REPORT_LOG_NUMBER_STORAGE_KEY, initial);
  }

  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  });

  return values;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('mileage log numbering', () => {
  it('starts at 1 and advances after each generated log', () => {
    const values = useStorage();

    expect(getNextMileageLogNumber()).toBe(1);
    advanceMileageLogNumber(1);
    expect(values.get(REPORT_LOG_NUMBER_STORAGE_KEY)).toBe('2');
    expect(getNextMileageLogNumber()).toBe(2);

    advanceMileageLogNumber(2);
    expect(getNextMileageLogNumber()).toBe(3);
  });

  it('resumes from the stored next number', () => {
    useStorage('12');

    expect(getNextMileageLogNumber()).toBe(12);
  });

  it('falls back to 1 for invalid stored values', () => {
    useStorage('not-a-number');
    expect(getNextMileageLogNumber()).toBe(1);

    useStorage('0');
    expect(getNextMileageLogNumber()).toBe(1);

    useStorage('-4');
    expect(getNextMileageLogNumber()).toBe(1);
  });

  it('does not break a download when storage is unavailable', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('Storage blocked');
      },
      setItem: () => {
        throw new Error('Storage blocked');
      },
    });

    expect(getNextMileageLogNumber()).toBe(1);
    expect(() => advanceMileageLogNumber(1)).not.toThrow();
  });
});
