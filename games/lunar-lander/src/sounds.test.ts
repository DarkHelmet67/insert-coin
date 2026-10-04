import { describe, expect, it } from 'vitest';
import { closeUpOn } from './camera';
import { tankWith } from './fuel';
import { createGame, type GameState } from './game';
import { startFlight } from './play';
import { blast, lowFuelBeep, rumble, rumbleLevel, soundsFor } from './sounds';
import { ABORT_THRUST } from './thrust';

/** A game in flight at `frame`, with `fuel` units and the engine at `thrust`. */
const flying = (frame: number, fuel = 750, thrust = 0): GameState => {
  const flight = { ...startFlight('cadet', tankWith(fuel), 0), thrust };
  return { ...createGame(0, 0), frame, mode: { kind: 'flying', flight, emptyFrames: 0 } };
};

describe('sounds', () => {
  it('rumbles at 1, 3, 5 or 7, loudest in ABORT', () => {
    expect(rumbleLevel(0)).toBe(1);
    expect(rumbleLevel(4)).toBe(3);
    expect(rumbleLevel(15)).toBe(7);
    expect(rumbleLevel(ABORT_THRUST)).toBe(7);
    expect(rumble(15).volume).toBeGreaterThan(rumble(0).volume);
  });

  it('plays the engine in pieces during a flight, never in attract', () => {
    expect(soundsFor(flying(6))).toEqual([rumble(0)]);
    expect(soundsFor(flying(7))).toEqual([]);
    expect(soundsFor({ ...createGame(0, 0), frame: 6 })).toEqual([]);
  });

  it('beeps while LOW ON FUEL is written', () => {
    expect(soundsFor(flying(64, 50))).toContain(lowFuelBeep);
    expect(soundsFor(flying(64, 500))).not.toContain(lowFuelBeep);
    expect(soundsFor(flying(64, 0))).not.toContain(lowFuelBeep);
  });

  it('fades the explosion out', () => {
    expect(blast(1).volume).toBeGreaterThan(blast(60).volume);
    expect(blast(64).volume).toBe(0);
    const state = flying(0);
    const mode = state.mode.kind === 'flying' ? state.mode : undefined;
    const crash: GameState | undefined = mode && {
      ...state,
      mode: {
        kind: 'landed',
        flight: { ...mode.flight, camera: closeUpOn(0, 0) },
        outcome: 'crash',
        step: 3,
        points: 5,
        verdict: 0,
        explosion: { set: 0, cabinX: 0, cabinY: 0 },
        bouncing: false,
      },
    };
    expect(soundsFor(crash ?? state)).toEqual([blast(3)]);
  });
});
