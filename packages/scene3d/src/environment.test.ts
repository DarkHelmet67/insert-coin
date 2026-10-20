import { describe, expect, it } from 'vitest';
import { skyColorAt } from './environment';

const sky = { ground: '#ff0000', horizon: '#00ff00', sky: '#0000ff' };

describe('skyColorAt', () => {
  it('is the ground color straight down, the horizon in the middle, the sky straight up', () => {
    expect(skyColorAt(sky, -1).getHexString()).toBe('ff0000');
    expect(skyColorAt(sky, 0).getHexString()).toBe('00ff00');
    expect(skyColorAt(sky, 1).getHexString()).toBe('0000ff');
  });

  it('blends the colors in between', () => {
    const halfway = skyColorAt(sky, 0.5);
    expect(halfway.g).toBeGreaterThan(0);
    expect(halfway.b).toBeGreaterThan(0);
  });
});
