import type { TouchControlsSettings } from '@arcade/input';

/**
 * The values of the remake that the sources do not fix for certain, or that the cabinet lets
 * the owner choose, in one place so they are easy to change and to test. Each value says where
 * it comes from:
 * - [P] read in the program, with the address of the routine;
 * - [R] read in the ROMs;
 * - [H] from the hardware, through MAME;
 * - [W] from written sources (manuals, the Pac-Man Dossier);
 * - [N] our choice, where the sources say nothing or the browser asks for something else.
 * See docs/meccaniche-originali.md for the details.
 */
import type { PacManDebug } from './debug';

/**
 * Debug mode [N], to test the fast levels, the ghosts that no longer turn blue and the split
 * screen of level 256 without playing well. Turn it on with `enabled: true`; while it is on, the
 * DEBUG mark is shown and the hi-score is not saved. Keep `enabled: false` in the published
 * game: a test fails otherwise. See docs/18-modalita-debug.md.
 */
const debug: PacManDebug = {
  enabled: false,
  /** The first level, 1 to 256: from the 21st the settings stop changing, 256 is the split screen. */
  startLevel: 1,
  /** The ghosts pass through Pac-Man instead of catching him (blue ghosts are still eaten). */
  godMode: true,
  /** The levels follow one another without the intermissions. */
  skipIntermissions: false,
};

export const tuning = {
  debug,
  /**
   * Frames per second of the cabinet: the video clock of 6.144 MHz draws 384 × 264 pixels per
   * frame, 60.606 frames a second [H `pacman.cpp`].
   */
  framesPerSecond: 6_144_000 / (384 * 264),

  /**
   * Frames the points of an eaten ghost stay on screen while the game stands still. The
   * program asks its timer for 10 tenths of a second ($126E), counted on a clock that ticks
   * every 6 frames, so the real wait is 55 to 60 frames depending on that clock [P]; we take 60.
   */
  ghostPointsFrames: 60,
  /** Lives at the start of a game: the DIP switches allow 1, 2, 3 or 5; 3 from the factory [P `26D0`]. */
  lives: 3,
  /**
   * The extra life, as the entry of the table at $2728 picked by the DIP switches: 0 for 10 000
   * points (factory setting), 1 for 15 000, 2 for 20 000, 3 for none [P `2728`].
   */
  extraLifeSetting: 0,
  /** Volume of the sound chip's three voices, from 0 to 1 [N]. */
  soundVolume: 0.8,
  /**
   * The controls on touch screens [N]: `movement` is `'joystick'` (a virtual joystick where the
   * arrow buttons were, moving Pac-Man (4 ways, like the cabinet stick)) or `'arrows'` (the arrow buttons). `deadZone` is
   * the part of the joystick's push, from 0 to 1, that does not move anything yet.
   */
  touchControls: { movement: 'joystick', deadZone: 0.3 } satisfies TouchControlsSettings,
} as const;
