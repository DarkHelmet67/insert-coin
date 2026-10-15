import { describe, expect, it } from 'vitest';
import { initialFormation } from './formation';
import { DISPOSITION, emptyObjects, objectAt, updateObject } from './objects';
import { updateObjectStates, type ObjectWorld } from './object-states';

/** A world with object `id` set to `fields`. */
const world = (id: number, fields: object): ObjectWorld => ({
  objects: updateObject(emptyObjects(), id, (o) => ({ ...o, ...fields })),
  slots: [],
  counting: 0,
  alive: 0,
});

const inputs = { formation: initialFormation(), enemiesEnabled: true };

describe('object manager', () => {
  it('places a resting alien at its cell and counts it', () => {
    const after = updateObjectStates(world(0x08, { disposition: DISPOSITION.home, code: 0x18 }), {
      ...inputs,
      frame: 1,
    });
    expect(objectAt(after.objects, 0x08).x).toBeGreaterThan(0);
    expect(after.counting).toBe(1);
    expect(updateObjectStates(after, { ...inputs, frame: 2 }).alive).toBe(1);
  });

  it('handles odd objects on frame 3 only', () => {
    const w = world(0x0a, { disposition: DISPOSITION.entering });
    expect(objectAt(updateObjectStates(w, { ...inputs, frame: 1 }).objects, 0x0a).disposition).toBe(
      DISPOSITION.entering,
    );
    expect(objectAt(updateObjectStates(w, { ...inputs, frame: 3 }).objects, 0x0a).disposition).toBe(
      DISPOSITION.launched,
    );
  });

  it('turns a returning alien upright, then rests it', () => {
    const w = world(0x08, { disposition: DISPOSITION.rotating, code: 0x1d });
    const once = updateObjectStates(w, { ...inputs, frame: 1 });
    expect(objectAt(once.objects, 0x08).code).toBe(0x1e);
    const twice = updateObjectStates(once, { ...inputs, frame: 5 });
    expect(objectAt(twice.objects, 0x08).disposition).toBe(DISPOSITION.home);
  });

  it('plays an explosion and removes it', () => {
    const w = world(0x08, {
      disposition: DISPOSITION.exploding,
      counter: 0x43,
      hit: 1,
      x: 100,
      y: 100,
    });
    const big = updateObjectStates(w, { ...inputs, frame: 1 });
    expect(objectAt(big.objects, 0x08)).toMatchObject({ code: 0x44, big: true, x: 92 });
    const last = updateObjectStates(big, { ...inputs, frame: 5 });
    const gone = updateObjectStates(last, { ...inputs, frame: 9 });
    expect(objectAt(gone.objects, 0x08)).toMatchObject({ disposition: DISPOSITION.inactive, x: 0 });
  });
});
