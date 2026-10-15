import { describe, expect, it } from 'vitest';
import { ATTACK_PROGRAM, newAttacks, runAttacks, type AttackWorld } from './attacks';
import type { BomberSettings } from './bomber-timers';
import { NO_CAPTURE } from './capture-state';
import { DISPOSITION, emptyObjects, objectAt, updateObject, type Objects } from './objects';

/** Objects `ids` resting in the formation. */
const home = (ids: readonly number[]): Objects =>
  ids.reduce(
    (objects, id) =>
      updateObject(objects, id, (o) => ({ ...o, disposition: DISPOSITION.home, x: 100, y: 200 })),
    emptyObjects(),
  );

const settings: BomberSettings = {
  reload: [8, 3, 3],
  bombBits: 5,
  maxBombers: 2,
  continuous: false,
};

const inputs = {
  frame: 16,
  settings,
  flying: 0,
  enemiesEnabled: true,
  fireEnabled: true,
  rescueRunning: false,
};

/** A manager whose countdowns are `countdown`, with aliens `ids` at home. */
const world = (
  countdown: readonly [number, number, number],
  ids: readonly number[],
): AttackWorld => ({
  attacks: { ...newAttacks(), countdown },
  objects: home(ids),
  slots: Array.from({ length: 12 }, () => undefined),
  capture: NO_CAPTURE,
  dived: false,
});

describe('attack manager', () => {
  it('waits for the 16th frame', () => {
    const w = world([5, 1, 5], [0x08]);
    expect(runAttacks(w, { ...inputs, frame: 15 })).toBe(w);
  });

  it('sends the first resting bee when its countdown runs out, then reloads it', () => {
    const after = runAttacks(world([5, 5, 1], [0x08, 0x0a]), inputs);
    expect(after.dived).toBe(true);
    expect(objectAt(after.objects, 0x08).disposition).toBe(DISPOSITION.flying);
    expect(after.slots[0]?.pointer).toBe(ATTACK_PROGRAM.bee);
    expect(after.slots[0]?.bombBits).toBe(5);
    expect(after.attacks.countdown).toEqual([4, 4, 3]);
  });

  it('holds the launch while too many aliens fly', () => {
    const after = runAttacks(world([5, 1, 5], [0x40]), { ...inputs, flying: 2 });
    expect(after.dived).toBe(false);
    expect(after.attacks.countdown).toEqual([4, 1, 5]);
  });

  it('sends a Boss with two escorts, worth 1600 points', () => {
    const after = runAttacks(
      world([1, 5, 5], [0x30, 0x32, 0x34, 0x36, 0x48, 0x4a, 0x50, 0x52]),
      inputs,
    );
    expect(after.attacks.queue.map((q) => q.object)).toHaveLength(3);
    const boss = after.attacks.queue[0]?.object ?? 0;
    expect(after.attacks.bossScores[(boss & 7) >> 1]).toEqual({ hundreds: 0x0d, code: 0xba });
    const launched = runAttacks(after, { ...inputs, frame: 17 });
    expect(objectAt(launched.objects, boss).disposition).toBe(DISPOSITION.flying);
    expect(launched.attacks.queue).toHaveLength(2);
  });

  it('makes every second Boss launch a capture, with no escorts', () => {
    const w = world([1, 5, 5], [0x30, 0x32, 0x48, 0x4a]);
    const after = runAttacks({ ...w, attacks: { ...w.attacks, bossToggle: 1 } }, inputs);
    expect(after.capture).toMatchObject({ busy: true, object: 0x30 });
    expect(after.attacks.queue).toEqual([
      { object: 0x30, mirrored: false, program: ATTACK_PROGRAM.capture },
    ]);
  });

  it('does nothing while the fighter cannot fire', () => {
    const w = world([5, 1, 5], [0x40]);
    expect(runAttacks(w, { ...inputs, fireEnabled: false })).toBe(w);
  });
});
