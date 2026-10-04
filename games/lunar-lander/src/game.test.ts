import { describe, expect, it } from 'vitest';
import { closeUpOn } from './camera';
import { noControls, type Controls } from './controls';
import { fuelUnits, tankWith } from './fuel';
import { createGame, currentTank, LAST_STEP, updateGame, type GameState } from './game';
import { POSITION_SCALE } from './lander';
import { startFlight } from './play';
import { rotationAt } from './rotation';

/** `count` frames with the same controls. */
const run = (state: GameState, count: number, controls: Controls = noControls): GameState =>
  Array.from({ length: count }).reduce<GameState>(
    (current) => updateGame(current, controls),
    state,
  );

/** A game in flight with the module upright above site 0 (2X), falling at `vy`. */
const aboveSite = (vy: number, fuel = 750): GameState => {
  const flight = startFlight('cadet', tankWith(fuel), 0);
  const lander = {
    x: 2600 * POSITION_SCALE,
    y: (64 + 19) * POSITION_SCALE,
    vx: 0,
    vy,
    rotation: rotationAt(8),
  };
  return {
    ...createGame(0, 0),
    mode: {
      kind: 'flying',
      flight: { ...flight, camera: closeUpOn(2600, 83), flight: { ...flight.flight, lander } },
      emptyFrames: 0,
    },
  };
};

describe('the cabinet', () => {
  it('waits in attract until a coin, then asks for START', () => {
    const coin = updateGame(createGame(0, 0), { ...noControls, coin: true });
    expect(coin.mode.kind).toBe('ready');
    expect(fuelUnits(coin.tank)).toBe(750);
    const started = updateGame(coin, { ...noControls, start: true });
    expect(started.mode.kind).toBe('flying');
  });

  it('takes the START key in attract as a coin', () => {
    expect(updateGame(createGame(0, 0), { ...noControls, start: true }).mode.kind).toBe('ready');
  });

  it('changes mission with SELECT, but not in attract', () => {
    expect(updateGame(createGame(0, 0), { ...noControls, select: true }).mission).toBe('training');
    const ready = updateGame(createGame(0, 0), { ...noControls, coin: true });
    expect(updateGame(ready, { ...noControls, select: true }).mission).toBe('cadet');
  });

  it('scores a good landing on a site and gives back 50 units of fuel', () => {
    const landed = updateGame(aboveSite(-0x100), noControls);
    expect(landed.mode.kind).toBe('landed');
    expect(landed.score).toBe(100);
    expect(fuelUnits(currentTank(landed))).toBe(800);
  });

  it('scores a crash and makes the player pay for the fuel not burned', () => {
    const state = aboveSite(-0x900);
    const flying = state.mode.kind === 'flying' ? state.mode : undefined;
    const late = flying && {
      ...state,
      mode: { ...flying, flight: { ...flying.flight, frames: 42 * 10 } },
    };
    const crashed = updateGame(late ?? state, noControls);
    expect(crashed.mode.kind === 'landed' && crashed.mode.outcome).toBe('crash');
    expect(crashed.score).toBe(10);
    expect(crashed.fuelLoss?.units).toBe(80);
  });

  it('starts the next mission after the sequence, or ends the game without fuel', () => {
    const landed = updateGame(aboveSite(-0x100), noControls);
    expect(run(landed, 2 * LAST_STEP + 2).mode.kind).toBe('flying');
    const broke = updateGame(aboveSite(-0x900, 0), noControls);
    const over = run(broke, 2 * LAST_STEP + 2);
    expect(over.mode.kind).toBe('attract');
    expect(over.hiScore).toBe(10);
  });

  it('gives up five seconds after the tank runs dry', () => {
    const empty = { ...aboveSite(0, 0) };
    const mode = empty.mode.kind === 'flying' ? empty.mode : undefined;
    const high = mode && {
      ...empty,
      mode: { ...mode, flight: startFlight('cadet', tankWith(0), 0) },
    };
    expect(run(high ?? empty, 200).mode.kind).toBe('flying');
    expect(run(high ?? empty, 210).mode.kind).toBe('attract');
  });
});
