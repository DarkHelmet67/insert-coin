import { describe, expect, it } from 'vitest';
import { dotSound, sirenSound } from './sounds';

describe('sound triggers', () => {
  it('raises the siren with the dots eaten', () => {
    expect(sirenSound(0)[0]?.set).toBe(1);
    expect(sirenSound(0x74)[0]?.set).toBe(2);
    expect(sirenSound(0xe4)[0]?.set).toBe(16);
    expect(sirenSound(0)[0]?.keep).toBe(0xe0);
  });

  it('alternates the two halves of the wakka', () => {
    expect(dotSound(2).map((write) => write.set)).toEqual([1, 0]);
    expect(dotSound(3).map((write) => write.set)).toEqual([0, 2]);
  });
});
