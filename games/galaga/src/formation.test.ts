import { describe, expect, it } from 'vitest';
import { breatheFormation, initialFormation, swayFormation } from './formation';

describe('formation', () => {
  it('starts at the origins, rows as sprite heights', () => {
    const f = initialFormation();
    expect(f.spriteCoords.slice(0, 2)).toEqual([0x31, 0x41]);
    expect(f.spriteCoords[10]).toBe(((~(0x92 + 0x4f) & 0xff) << 1) & 0x1ff);
  });

  it('sways one pixel every 4 frames and turns back at 32', () => {
    const steps = Array.from({ length: 33 * 4 }, (_, i) => i + 1).reduce(
      (f, frame) => swayFormation(f, frame, false).formation,
      initialFormation(),
    );
    expect(steps.offsets[0]).toBe(31);
    expect(steps.direction).toBe(1);
  });

  it('stops in the middle once asked, and then breathes', () => {
    const result = swayFormation(initialFormation(), 1, true);
    expect(result.settled).toBe(false);
    const back = swayFormation({ ...result.formation, direction: 1 }, 5, true);
    expect(back.settled).toBe(true);
    const breathed = breatheFormation(back.formation, 4);
    // Outer columns move every time with bitmap $FF: left outwards, right outwards.
    expect(breathed.offsets[0]).toBe(0xff);
    expect(breathed.offsets[9]).toBe(1);
    expect(breathed.direction).toBe(1);
  });
});
