import { describe, expect, it } from 'vitest';
import {
  createFleet,
  fleetBottom,
  FLEET_RIGHT_LIMIT,
  removeAlien,
  stepFleet,
  STEP_DOWN,
  STEP_X,
  type FleetState,
} from './fleet';
import { alienAt } from './test-fixtures';

/** Runs `frames` steps of the formation. */
const run = (fleet: FleetState, frames: number): FleetState =>
  Array.from({ length: frames }).reduce<FleetState>((f) => stepFleet(f), fleet);

/** A fleet made of the given invaders, marching right. */
const fleetOf = (...aliens: FleetState['aliens']): FleetState => ({ ...createFleet(), aliens });

describe('stepFleet', () => {
  it('moves exactly one invader per frame, switching its animation frame', () => {
    const [first, second] = stepFleet(createFleet()).aliens;
    expect(first).toMatchObject({ x: (createFleet().aliens[0]?.x ?? 0) + STEP_X, frame: 1 });
    expect(second).toEqual(createFleet().aliens[1]);
  });

  it('completes a pass in as many frames as there are invaders', () => {
    expect(run(createFleet(), 54).beat).toBe(0);
    expect(run(createFleet(), 55)).toMatchObject({ cursor: 0, beat: 1 });
  });

  it('gets faster as invaders die: one invader left moves every frame', () => {
    const lonely = fleetOf(alienAt(100, 100));
    expect(run(lonely, 2).aliens[0]?.x).toBe(106);
  });

  it('moves the last invader 3 pixels right but only 2 left', () => {
    expect(stepFleet(fleetOf(alienAt(100, 100))).aliens[0]?.x).toBe(103);
    expect(stepFleet({ ...fleetOf(alienAt(100, 100)), direction: -1 }).aliens[0]?.x).toBe(98);
  });

  it('drops and turns around after reaching the edge', () => {
    const atEdge = fleetOf(alienAt(FLEET_RIGHT_LIMIT - 14, 100), alienAt(50, 100));
    const turned = run(atEdge, 2);
    expect(turned).toMatchObject({ dropping: true, direction: -1 });
    const dropped = run(turned, 2);
    expect(dropped.aliens.map((a) => a.y)).toEqual([100 + STEP_DOWN, 100 + STEP_DOWN]);
    expect(dropped.dropping).toBe(false);
  });
});

describe('removeAlien', () => {
  it('keeps the cursor on the invader due to move next', () => {
    const fleet = { ...createFleet(), cursor: 10 };
    const victim = fleet.aliens[3];
    const next = victim ? removeAlien(fleet, victim) : fleet;
    expect(next.aliens).toHaveLength(54);
    expect(next.cursor).toBe(9);
  });

  it('ends the pass when the last invader due to move is destroyed', () => {
    const fleet = { ...fleetOf(alienAt(10, 50), alienAt(40, 50)), cursor: 1 };
    const victim = fleet.aliens[1];
    expect(victim && removeAlien(fleet, victim)).toMatchObject({ cursor: 0, beat: 1 });
  });
});

describe('fleetBottom', () => {
  it('is the lowest edge of the formation', () => {
    expect(fleetBottom(fleetOf(alienAt(10, 50), alienAt(10, 90)))).toBe(98);
  });
});
