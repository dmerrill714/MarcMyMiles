import { describe, expect, it } from 'vitest';
import { haversineMiles, speedMphForSegment } from './geo';

describe('GPS math', () => {
  it('returns zero for identical points', () => {
    expect(haversineMiles(40.7128, -74.006, 40.7128, -74.006)).toBe(0);
  });

  it('approximates one degree of latitude', () => {
    expect(haversineMiles(0, 0, 0, 1)).toBeCloseTo(69.09, 1);
  });

  it('calculates the distance between two nearby points', () => {
    const distance = haversineMiles(34.0522, -118.2437, 34.0622, -118.2437);

    expect(distance).toBeGreaterThan(0.68);
    expect(distance).toBeLessThan(0.71);
  });

  it('converts a distance over elapsed time to mph', () => {
    expect(speedMphForSegment(1, 60_000)).toBeCloseTo(60);
    expect(speedMphForSegment(10, 30 * 60_000)).toBeCloseTo(20);
  });

  it('rejects unusable time deltas', () => {
    expect(speedMphForSegment(1, 0)).toBeNull();
    expect(speedMphForSegment(1, -100)).toBeNull();
    expect(speedMphForSegment(Number.NaN, 1_000)).toBeNull();
  });
});
