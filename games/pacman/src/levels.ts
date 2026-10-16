import {
  DIFFICULTY,
  ELROY_DOTS,
  FRIGHT_TIMES,
  HOUSE_DOT_LIMITS,
  HOUSE_TIMERS,
  SPEEDS,
} from './rom/main-rom';
import { patternFromBytes, type SpeedPattern } from './speed';

/** The speeds of one level, in the order of a speed entry at $330F. */
export interface LevelSpeeds {
  readonly pacman: SpeedPattern;
  /** Pac-Man while the ghosts are blue. */
  readonly pacmanFright: SpeedPattern;
  /** Blinky when few dots are left: "Cruise Elroy" 2 and 1. */
  readonly elroy2: SpeedPattern;
  readonly elroy1: SpeedPattern;
  readonly ghost: SpeedPattern;
  readonly ghostFright: SpeedPattern;
  readonly ghostTunnel: SpeedPattern;
}

/** Everything that changes from one level to the next (routine $070E). */
export interface LevelSettings {
  readonly speeds: LevelSpeeds;
  /**
   * Frames from the start of the level at which the ghosts switch between scatter and chase:
   * scatter until the first, chase until the second and so on; after the seventh, chase forever.
   */
  readonly modeChanges: readonly number[];
  /** Dots Pinky, Inky and Clyde wait for in the house before leaving. */
  readonly houseDotLimits: readonly [number, number, number];
  /** Dots left at which Blinky turns into Cruise Elroy 1 and 2. */
  readonly elroyDots: readonly [number, number];
  /** How long the ghosts stay blue, in updates (two per frame). */
  readonly frightTime: number;
  /** Frames without eating a dot after which a ghost leaves the house anyway. */
  readonly houseTimer: number;
}

/** Bytes per level in the difficulty table at $0796. */
const DIFFICULTY_ROW = 6;
/** Bytes per speed entry at $330F: 7 patterns of 4 bytes, then 7 words of mode changes. */
const SPEED_ENTRY = 42;
/** From level 21 on, the levels are all the same as level 21. */
export const LAST_DIFFICULTY_ROW = 20;

/** A little-endian word of a table. */
const word = (table: readonly number[], at: number): number =>
  (table[at] ?? 0) | ((table[at + 1] ?? 0) << 8);

/** The speeds and mode changes of speed entry `entry`. */
const speedEntry = (entry: number): Pick<LevelSettings, 'speeds' | 'modeChanges'> => {
  const at = entry * SPEED_ENTRY;
  /** The `index`-th pattern of the entry. */
  const pattern = (index: number): SpeedPattern => patternFromBytes(SPEEDS, at + index * 4);
  return {
    speeds: {
      pacman: pattern(0),
      pacmanFright: pattern(1),
      elroy2: pattern(2),
      elroy1: pattern(3),
      ghost: pattern(4),
      ghostFright: pattern(5),
      ghostTunnel: pattern(6),
    },
    modeChanges: Array.from({ length: 7 }, (_, i) => word(SPEEDS, at + 28 + i * 2)),
  };
};

/** The settings of `level`, counted from 1. */
export const levelSettings = (level: number): LevelSettings => {
  const row = Math.min(level - 1, LAST_DIFFICULTY_ROW) * DIFFICULTY_ROW;
  /** Column `column` of the level's row: an index into another table. */
  const index = (column: number): number => DIFFICULTY[row + column] ?? 0;
  const house = index(2) * 3;
  const elroy = index(3) * 2;
  return {
    ...speedEntry(index(0)),
    houseDotLimits: [
      HOUSE_DOT_LIMITS[house] ?? 0,
      HOUSE_DOT_LIMITS[house + 1] ?? 0,
      HOUSE_DOT_LIMITS[house + 2] ?? 0,
    ],
    elroyDots: [ELROY_DOTS[elroy] ?? 0, ELROY_DOTS[elroy + 1] ?? 0],
    frightTime: word(FRIGHT_TIMES, index(4) * 2),
    houseTimer: word(HOUSE_TIMERS, index(5) * 2),
  };
};
