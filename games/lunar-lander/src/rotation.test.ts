import { describe, expect, it } from 'vitest';
import {
  MAX_SPIN,
  MIN_SPIN,
  pushSpin,
  rotationAt,
  rotationOrientation,
  settleSpin,
  turnModule,
  TURN_FUEL,
  type Rotation,
  type Turn,
} from './rotation';
import type { RotationMode } from './missions';

/** The rotation after holding `turn` for `frames` frames. */
const hold = (rotation: Rotation, turn: Turn, frames: number, mode: RotationMode): Rotation =>
  Array.from({ length: frames }).reduce<Rotation>(
    (current) => turnModule(current, turn, mode, true).rotation,
    rotation,
  );

describe('rotation without inertia', () => {
  it('turns one orientation every 4 frames of button', () => {
    const start = rotationAt(16);
    expect(rotationOrientation(hold(start, 1, 3, 'free'))).toBe(16);
    expect(rotationOrientation(hold(start, 1, 4, 'free'))).toBe(17);
    expect(rotationOrientation(hold(start, -1, 1, 'free'))).toBe(15);
    expect(rotationOrientation(hold(start, -1, 5, 'free'))).toBe(14);
  });

  it('goes all the way round in CADET', () => {
    expect(rotationOrientation(hold(rotationAt(0), -1, 4, 'free'))).toBe(31);
  });

  it('costs fuel on every frame the module turns', () => {
    expect(turnModule(rotationAt(8), 1, 'free', true).fuel).toBe(TURN_FUEL);
    expect(turnModule(rotationAt(8), 0, 'free', true).fuel).toBe(0);
  });

  it('stops at the two sides in TRAINING, for free', () => {
    const left = turnModule(rotationAt(16), 1, 'limited', true);
    expect(rotationOrientation(left.rotation)).toBe(16);
    expect(left.fuel).toBe(0);
    const right = turnModule(rotationAt(0), -1, 'limited', true);
    expect(rotationOrientation(right.rotation)).toBe(0);
    expect(right.fuel).toBe(0);
  });

  it('does nothing without fuel', () => {
    expect(turnModule(rotationAt(8), 1, 'free', false)).toEqual({
      rotation: rotationAt(8),
      fuel: 0,
    });
  });
});

describe('rotation with inertia (COMMAND)', () => {
  it('keeps the spin between the two limits', () => {
    expect(pushSpin(MAX_SPIN.left, 1)).toBe(MAX_SPIN.left + 0x10);
    expect(pushSpin(MAX_SPIN.left + 0x10, 1)).toBe(MAX_SPIN.left);
    expect(pushSpin(MAX_SPIN.right, -1)).toBe(MAX_SPIN.right);
  });

  it('turns a tap into the slowest spin, and a tap the other way stops it', () => {
    expect(settleSpin(0x10, false)).toBe(MIN_SPIN);
    expect(settleSpin(-0x10, false)).toBe(-MIN_SPIN);
    expect(settleSpin(0x40, true)).toBe(0);
    expect(settleSpin(0x41, true)).toBe(0x41);
  });

  it('keeps turning after the button is released', () => {
    const tapped = hold(rotationAt(8), 1, 1, 'inertia');
    const released = hold(tapped, 0, 1, 'inertia');
    expect(released.spin).toBe(MIN_SPIN);
    const later = hold(released, 0, 100, 'inertia');
    expect(later.spin).toBe(MIN_SPIN);
    expect(rotationOrientation(later)).not.toBe(8);
    const stopped = hold(hold(later, -1, 1, 'inertia'), 0, 1, 'inertia');
    expect(stopped.spin).toBe(0);
  });

  it('keeps spinning without fuel, but the buttons do nothing', () => {
    const spinning = { ...rotationAt(8), spin: MIN_SPIN, wasSpinning: true };
    const next = turnModule(spinning, -1, 'inertia', false);
    expect(next.rotation.spin).toBe(MIN_SPIN);
    expect(next.rotation.counter).toBe(spinning.counter + MIN_SPIN);
    expect(next.fuel).toBe(0);
  });
});
