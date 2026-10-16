import { GHOST_PALETTES, PALETTE, type Ghost } from './ghosts';
import { COLOR, ENERGIZER_ADDRESSES } from './maze';
import type { CellWrite } from './video';

/** The state of an energizer's effect ($4DA6, $4DCB, $4DD0, $4DC8). */
export interface Fright {
  /** Pac-Man has eaten an energizer and the ghosts may be blue. */
  readonly active: boolean;
  /** Updates of blue time left. */
  readonly timer: number;
  /** Ghosts eaten with this energizer. */
  readonly eaten: number;
  /** Frames before the next check of the ghosts' colors. */
  readonly flashFrames: number;
}

/** No energizer. */
export const NO_FRIGHT: Fright = { active: false, timer: 0, eaten: 0, flashFrames: 0 };

/**
 * An energizer eaten (routine $1A6A): every ghost turns blue and around, even those in the
 * house or going home as eyes, and the blue time of the level starts.
 */
export const startFright = (
  ghosts: readonly Ghost[],
  frightTime: number,
): { readonly ghosts: readonly Ghost[]; readonly fright: Fright } => ({
  ghosts: ghosts.map((ghost) => ({ ...ghost, blue: true, reverse: true, palette: PALETTE.blue })),
  fright: { active: true, timer: frightTime, eaten: 0, flashFrames: 0 },
});

/**
 * One update of the blue time (routine $1376). It runs out early if no ghost is blue; at the
 * end the ghosts that are still alive stop being blue.
 */
export const tickFright = (
  ghosts: readonly Ghost[],
  fright: Fright,
): { readonly ghosts: readonly Ghost[]; readonly fright: Fright } => {
  if (!fright.active) return { ghosts, fright };
  const anyBlue = ghosts.some((ghost) => ghost.blue);
  const timer = anyBlue ? (fright.timer - 1) & 0xffff : 0;
  if (timer !== 0) return { ghosts, fright: { ...fright, timer } };
  return {
    ghosts: ghosts.map((ghost) => (ghost.eyes === 'alive' ? { ...ghost, blue: false } : ghost)),
    fright: NO_FRIGHT,
  };
};

/** Frames between two checks of the ghosts' colors ($0AD9). */
const FLASH_PERIOD = 14;
/** Below this much blue time left the blue ghosts flash white ($0B04). */
const FLASH_TIME = 0x100;

/** The palette a ghost shows at a color check: blue, flashing, or its own. */
const checkedPalette = (ghost: Ghost, fright: Fright): number => {
  if (!ghost.blue) return GHOST_PALETTES[ghost.id] ?? 1;
  if (fright.timer >= FLASH_TIME) return ghost.palette;
  return ghost.palette === PALETTE.blue ? PALETTE.white : PALETTE.blue;
};

/**
 * Every 14 frames the program sets the ghosts' colors (routine $0AC3): blue ghosts flash white
 * when the blue time is nearly over, the others take back their own color. Between two checks
 * the colors stay as they are, so a ghost may keep its blue color a little after the end.
 */
export const flashGhosts = (
  ghosts: readonly Ghost[],
  fright: Fright,
): { readonly ghosts: readonly Ghost[]; readonly fright: Fright } => {
  if (fright.flashFrames !== 0) {
    return { ghosts, fright: { ...fright, flashFrames: fright.flashFrames - 1 } };
  }
  return {
    ghosts: ghosts.map((ghost) => ({ ...ghost, palette: checkedPalette(ghost, fright) })),
    fright: { ...fright, flashFrames: FLASH_PERIOD - 1 },
  };
};

/** Eyes are drawn with the palette that shows only the eyes ($0BD6). */
export const paintEyes = (ghosts: readonly Ghost[]): readonly Ghost[] =>
  ghosts.map((ghost) => (ghost.eyes === 'alive' ? ghost : { ...ghost, palette: PALETTE.eyes }));

/** Frames between two blinks of the energizers ($0C11). */
export const BLINK_PERIOD = 10;

/**
 * The energizers blink (routine $0C0D): every 10 frames their color switches between the
 * maze's and black, the same for all four, eaten or not.
 */
export const blinkEnergizers = (colors: readonly number[]): readonly CellWrite[] => {
  const value = colors[ENERGIZER_ADDRESSES[0]] === COLOR.maze ? 0 : COLOR.maze;
  return ENERGIZER_ADDRESSES.map((address) => ({ address, value }));
};
