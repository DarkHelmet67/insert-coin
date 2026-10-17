import { describe, expect, it } from 'vitest';
import { debug, DEBUG_OFF } from './debug';
import { createGameState, wavesBefore } from './game';
import { hitsShip, resolveShip, type HitState } from './hits';
import { hyperspaceLanding, jumpIntoHyperspace } from './player';
import { seedRandom } from './random';
import { noRocks, nextWaveSize, type Rock } from './rocks';
import { noSaucer } from './saucer';
import { newShip } from './ship';
import { noShots } from './shots';
import { tuning } from './tuning.config';

const ROCK: Rock = { kind: 'rock', position: { x: 500, y: 500 }, vx: 0, vy: 0, size: 4, shape: 0 };

/** The flying ship sitting on a large rock. */
const crash: HitState = {
  shots: noShots,
  rocks: noRocks.map((slot, i) => (i === 0 ? ROCK : slot)),
  score: 0,
  rng: seedRandom(9),
  ship: { ...newShip, position: { x: 500, y: 500 } },
  life: { kind: 'flying' },
  lives: 3,
  ...noSaucer,
};

describe('debug mode', () => {
  it('is off in the published game', () => {
    expect(tuning.debug.enabled).toBe(false);
    expect(debug).toEqual(DEBUG_OFF);
  });

  it('starts from the chosen wave: 4, 6, 8, 10, then 11 large rocks', () => {
    const sizes = [1, 2, 3, 4, 5, 6].map((wave) => nextWaveSize(wavesBefore(wave).waveSize));
    expect(sizes).toEqual([4, 6, 8, 10, 11, 11]);
    expect(createGameState(seedRandom(1), 0, newShip, 1)).toMatchObject(wavesBefore(1));
    expect(wavesBefore(1)).toEqual({ waveSize: 2, saucerRockLimit: noSaucer.saucerRockLimit });
    expect(wavesBefore(20).saucerRockLimit).toBe(10);
  });

  it('in god mode nothing touches the ship', () => {
    expect(hitsShip(crash, ROCK.position, 0, false)).toBe(true);
    expect(hitsShip(crash, ROCK.position, 0, true)).toBe(false);
    expect(resolveShip(crash, false).life.kind).toBe('exploding');
    expect(resolveShip(crash, true)).toBe(crash);
  });

  it('a safe hyperspace jump is never fatal', () => {
    const seed = Array.from({ length: 500 }, (_, i) => i).find(
      (i) => hyperspaceLanding(crash.ship.position, noRocks, seedRandom(i)).fatal,
    );
    expect(seed).toBeDefined();
    const rng = seedRandom(seed ?? 0);
    expect(jumpIntoHyperspace(crash, noRocks, rng, false).player.life).toMatchObject({
      reason: 'fatal-jump',
    });
    expect(jumpIntoHyperspace(crash, noRocks, rng, true).player.life).toMatchObject({
      reason: 'jump',
    });
  });
});
