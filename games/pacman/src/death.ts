import type { SoundWrite } from './sound-board';
import { SOUND } from './sounds';

/**
 * Pac-Man caught by a ghost (routine $1291). A counter ($4DC5) grows at each update of the
 * core, two per frame: for one second everything stands still, then the ghosts vanish and
 * Pac-Man shrinks through the sprites $34-$3F; at the end a life is gone.
 */

/** The last counter with everything standing still ($12BE): the next update starts the animation. */
const STILL_UNTIL = 0x78;

/** Each sprite of the animation and the counter at which the next one takes over ($12CB-$135F). */
const FRAMES: readonly { readonly sprite: number; readonly until: number }[] = [
  { sprite: 0x34, until: 0xb4 },
  { sprite: 0x35, until: 0xc3 },
  { sprite: 0x36, until: 0xd2 },
  { sprite: 0x37, until: 0xe1 },
  { sprite: 0x38, until: 0xf0 },
  { sprite: 0x39, until: 0xff },
  { sprite: 0x3a, until: 0x10e },
  { sprite: 0x3b, until: 0x11d },
  { sprite: 0x3c, until: 0x12c },
  { sprite: 0x3d, until: 0x13b },
  { sprite: 0x3e, until: 0x159 },
  { sprite: 0x3f, until: 0x1b8 },
];

/** The counter at the end of the animation, when a life is lost ($1366). */
export const DEATH_OVER = 0x1b8;

/**
 * The sound of the animation: Pac-Man's death is asked for during the second sprite ($12F9),
 * its last two notes during the second last ($1346), at each update of the core.
 */
export const deathSound = (counter: number): readonly SoundWrite[] => {
  const sprite = deathSprite(counter);
  if (sprite === 0x35) return SOUND.death;
  if (sprite === 0x3e) return SOUND.deathEnd;
  return [];
};

/** The counter after one more update of the core; it stops at the end. */
export const tickDeath = (counter: number): number => Math.min(counter + 1, DEATH_OVER);

/** Whether the ghosts are gone: from the start of the animation ($12CE). */
export const ghostsGone = (counter: number): boolean => counter > STILL_UNTIL;

/** Whether the animation is over and the life is lost. */
export const deathOver = (counter: number): boolean => counter >= DEATH_OVER;

/** Pac-Man's sprite for the counter, or `undefined` while he is still drawn as usual. */
export const deathSprite = (counter: number): number | undefined =>
  ghostsGone(counter) ? FRAMES.find((frame) => counter <= frame.until)?.sprite : undefined;
