/*
 * `f_0857`: how often each kind of alien leaves the formation, and which of them may drop bombs.
 * The values come from small ROM tables, picked by the stage parameters, by how many aliens are
 * left and by how long the stage has lasted (game timer 2 starts at 120 and ticks twice a
 * second).
 */
import { BOMB_ENABLE_TABLE, RED_BOMBER_TIMERS, YELLOW_BOMBER_TIMERS } from './rom/main-rom';
import type { StageParameters } from './stage-setup';

/** What `f_0857` decides (`b_92C0[4-6]` and `b_92C0[8]`). */
export interface BomberSettings {
  /** Launch intervals, in units of 16 frames, of Boss, red and yellow bombers. */
  readonly reload: readonly [number, number, number];
  /** Bits allowing a diving alien to drop bombs, one per chance. */
  readonly bombBits: number;
  /** Aliens attacking at once: grows after the first 30 seconds of the stage. */
  readonly maxBombers: number;
  /** Few aliens left: they attack nonstop and the formation's pulse stops. */
  readonly continuous: boolean;
}

/**
 * `c_08BE`: a byte of the 4-per-row table, the column given by the tens of aliens left. The
 * column is not clamped, as in the original: with all 40 aliens alive it is 4, and the program
 * reads the first byte of the next row (the commented source notes that the two tables must be
 * contiguous for this). The ROM bytes after the table are copied too, so the remake reads the
 * same values.
 */
const byAliensLeft = (first: number, row: number, alive: number): number =>
  BOMB_ENABLE_TABLE[first + row * 4 + Math.floor(alive / 10)] ?? 0;

/** `c_08AD`: a byte of a 3-per-row table, shorter as time passes. */
const byTime = (table: readonly number[], row: number, timer: number): number =>
  table[row * 3 + (timer < 0x28 ? 1 : 0) + (timer === 0 ? 1 : 0)] ?? 0;

/**
 * The settings for the moment: `alive` aliens, game timer 2 at `timer`; the limit of attackers
 * `maxBombers` grows once and stays.
 */
export const bomberSettings = (
  params: StageParameters,
  alive: number,
  timer: number,
  continuous: boolean,
  maxBombers: number,
): BomberSettings => ({
  reload: continuous
    ? [2, 2, 2]
    : [
        byAliensLeft(32, params.bossTimer, alive),
        byTime(RED_BOMBER_TIMERS, params.redTimer, timer),
        byTime(YELLOW_BOMBER_TIMERS, params.yellowTimer, timer),
      ],
  bombBits: byAliensLeft(0, params.bombEnable, alive),
  maxBombers: timer < 0x3c ? params.maxBombersLater : maxBombers,
  continuous,
});

/**
 * The flag set every frame by the second processor (`b_92A0[$0A]`): fewer aliens than the stage
 * parameter, while the fighter can fire.
 */
export const continuousBombing = (
  params: StageParameters,
  alive: number,
  fireEnabled: boolean,
): boolean => alive < params.continuousBombing && fireEnabled;
