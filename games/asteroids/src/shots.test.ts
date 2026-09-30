import { describe, expect, it } from 'vitest';
import { newShip, type Ship } from './ship';
import { fireShot, halfSigned, newShot, noShots, SHOT_LIFE, updateShot, type Shot } from './shots';

describe('halfSigned', () => {
  it('rounds down like an arithmetic shift', () => {
    expect([halfSigned(127), halfSigned(-127), halfSigned(-1)]).toEqual([63, -64, -1]);
  });
});

describe('newShot', () => {
  it('leaves the nose of a still ship at 63 units a frame', () => {
    const shot = newShot(newShip);
    expect(shot.vx).toBe(63);
    expect(shot.vy).toBe(0);
    expect(shot.position).toEqual({ x: newShip.position.x + 63 + 31, y: newShip.position.y });
    expect(shot.life).toBe(SHOT_LIFE);
  });

  it('adds the ship speed, up to 111 units a frame', () => {
    const fast: Ship = { ...newShip, vx: 0x3fff };
    expect(newShot(fast).vx).toBe(111);
    const backwards: Ship = { ...newShip, vx: 0x1000, direction: 128 };
    expect(newShot(backwards).vx).toBe(16 - 64);
  });
});

describe('fireShot', () => {
  it('fills the slots from the last one, and no more than four', () => {
    const one = fireShot(noShots, newShip);
    expect(one.map(Boolean)).toEqual([false, false, false, true]);
    const four = [1, 2, 3].reduce((shots) => fireShot(shots, newShip), one);
    expect(four.every(Boolean)).toBe(true);
    expect(fireShot(four, newShip)).toBe(four);
  });
});

describe('updateShot', () => {
  const shot: Shot = { position: { x: 8190, y: 10 }, vx: 5, vy: 0, life: 2 };

  it('moves the shot and wraps it around the edges', () => {
    expect(updateShot(shot, 1)?.position).toEqual({ x: 3, y: 10 });
  });

  it('loses a tick every 4 frames and disappears at the end', () => {
    expect(updateShot(shot, 1)?.life).toBe(2);
    expect(updateShot(shot, 4)?.life).toBe(1);
    expect(updateShot({ ...shot, life: 1 }, 8)).toBeNull();
  });

  it('lives about 72 frames', () => {
    const frames = Array.from({ length: 100 }, (_, frame) => frame);
    const lived = frames.reduce<{ shot: Shot | null; alive: number }>(
      ({ shot: current, alive }, frame) => {
        const next = updateShot(current, frame);
        return { shot: next, alive: next ? alive + 1 : alive };
      },
      { shot: newShot(newShip), alive: 0 },
    ).alive;
    expect(lived).toBeGreaterThanOrEqual(68);
    expect(lived).toBeLessThanOrEqual(72);
  });
});
