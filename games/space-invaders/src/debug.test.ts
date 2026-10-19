import { describe, expect, it } from 'vitest';
import { CANNON_Y } from './cannon';
import { bombsHitCannon, bombsHitShields } from './collisions';
import { debug, DEBUG_OFF } from './debug';
import { createFleet } from './fleet';
import { godModeLanding, initialPlayingState, type PlayingState } from './playing';
import { damageShields } from './shields';
import { tuning } from './tuning.config';

/** A new game whose only bomb is about to hit the cannon. */
const bombOnCannon = (): PlayingState => ({
  ...initialPlayingState(1),
  bombs: {
    ...initialPlayingState(1).bombs,
    active: [{ kind: 'rolling', x: 22, y: CANNON_Y - 4, steps: 3 }],
  },
});

describe('debug mode', () => {
  it('is off in the published game', () => {
    expect(tuning.debug.enabled).toBe(false);
    expect(debug).toEqual(DEBUG_OFF);
  });

  it('starts from the chosen round, with its lower formation', () => {
    const fifth = initialPlayingState(5);
    expect(fifth.round).toBe(5);
    expect(fifth.fleet).toEqual(createFleet(5));
  });

  it('in god mode a bomb on the cannon just disappears', () => {
    const state = bombOnCannon();
    expect(bombsHitCannon(state, false).lives).toBe(state.lives - 1);
    const safe = bombsHitCannon(state, true);
    expect(safe).toMatchObject({ lives: state.lives, cannonExplosion: undefined });
    expect(safe.bombs.active).toEqual([]);
  });

  it('in god mode landed invaders start their round again', () => {
    const start = initialPlayingState(3);
    const aliens = start.fleet.aliens.map((alien) => ({ ...alien, y: alien.y + 200 }));
    const landed: PlayingState = { ...start, fleet: { ...start.fleet, aliens } };
    expect(godModeLanding(landed, false)).toBe(landed);
    expect(godModeLanding(landed, true).fleet).toEqual(createFleet(3));
  });

  it('indestructible shields stop bombs but keep every pixel', () => {
    const state = bombsHitShields({
      ...initialPlayingState(1),
      bombs: {
        ...initialPlayingState(1).bombs,
        active: [{ kind: 'plunger', x: 40, y: 188, steps: 3 }],
      },
    });
    const brush = { bitmap: state.shields[0]?.bitmap, x: 40, y: 192 };
    const shields = initialPlayingState(1).shields;
    expect(damageShields(shields, brush as Parameters<typeof damageShields>[1], true)).toBe(
      shields,
    );
  });
});
