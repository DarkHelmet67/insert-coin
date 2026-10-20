import type { GameState } from '@arcade/space-invaders/src/game';
import { GROUND_Y } from '@arcade/space-invaders/src/playfield';
import { SHOT_TOP_LIMIT } from '@arcade/space-invaders/src/shot';
import type { FilledRect } from '@arcade/voxel';

/** Top of the line of reserve cannons: two rows below the ground, where the original draws them. */
const RESERVE_TOP = GROUND_Y + 2;

/**
 * The state as the original drawing code should see it. The invaders' 2D burst is left out,
 * because the remaster blows them up into flying voxels instead (see bursts.ts): everything
 * else is drawn exactly as in 1978.
 */
export const drawableState = (state: GameState): GameState =>
  state.screen === 'attract'
    ? state
    : {
        ...state,
        playing: {
          ...state.playing,
          effects: state.playing.effects.filter((effect) => effect.kind !== 'alien'),
        },
      };

/**
 * Whether a drawn rectangle belongs to the score bars rather than to the playfield: the header
 * above the highest point a shot reaches, and the line of reserve cannons below the ground.
 * Those stay flat and sharp on top of the 3D scene, so the score is always easy to read.
 */
export const isHudRect = (rect: FilledRect): boolean =>
  rect.y + rect.height <= SHOT_TOP_LIMIT || rect.y >= RESERVE_TOP;

/** Splits what the original drew into the flat score bars and the 3D playfield. */
export const splitScreen = (
  rects: readonly FilledRect[],
): { readonly hud: readonly FilledRect[]; readonly field: readonly FilledRect[] } => ({
  hud: rects.filter(isHudRect),
  field: rects.filter((rect) => !isHudRect(rect)),
});
