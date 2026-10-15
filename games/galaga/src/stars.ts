import { SCREEN_HEIGHT, SCREEN_WIDTH } from './playfield';

/*
 * The starfield of the Namco 05xx chip, as described and emulated by MAME
 * (starfield_05xx.cpp, R. Hildinger 2019). The chip runs a 16-bit shift register one step per
 * pixel over a 256 × 256 raster and lights a star whenever 8 of its bits match a fixed value:
 * 256 possible stars, in 4 sets of 64. Because the register repeats every 65,535 steps but a
 * frame lasts 65,536, the stars drift by one pixel each frame; running a few steps more or fewer
 * per frame makes them scroll faster, slower or stand still.
 *
 * Instead of running the register 65,536 times a frame, the remake finds the 256 stars once and
 * then only computes where each one falls in the current frame: the same picture, much cheaper.
 */

/** State of the shift register after a reset. */
const LFSR_SEED = 0x7fff;
/** Steps before the register repeats. */
const LFSR_PERIOD = 65535;
/** The register "hits" (draws a star) when its bits under this mask... */
const HIT_MASK = 0xfa14;
/** ...have these values. */
const HIT_VALUE = 0x7800;

/** Raster pixels per line, and lines of the raster that reach the screen. */
const LINE = 256;
const VISIBLE_LINES = 224;
/** Register steps before and after the visible lines of a frame, when nothing scrolls vertically. */
const PRE_VISIBLE = 22 * LINE;
const POST_VISIBLE = 10 * LINE;
/** The starfield raster starts 16 pixels into the screen's long side. */
const RASTER_OFFSET = 16;

/**
 * Extra register steps per frame for each of the 8 scroll speeds the program can select:
 * index 7 stands still, 6, 5 and 4 move the stars down 1, 2 and 3 pixels a frame, 0-3 move them
 * up 1-4 pixels. Galaga only uses the downward ones.
 */
const SPEED_EXTRA_STEPS = [0, 1, 2, 3, -4, -3, -2, -1] as const;

/** A scroll speed of the chip (0-7), see `SPEED_EXTRA_STEPS`. */
export type StarSpeed = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** Stars standing still, and moving down 1 pixel a frame (the speed between stages). */
export const STARS_STILL: StarSpeed = 7;
export const STARS_SLOW: StarSpeed = 6;

/** Brightness of each 2-bit color channel of a star, from the resistors of its DAC (MAME). */
const STAR_LEVELS = ['00', '47', '97', 'de'] as const;

/** One of the 256 stars the chip can draw. */
interface StarSeed {
  /** Register step, counted from the seed, at which the star is drawn. */
  readonly step: number;
  /** Which of the 4 sets of stars it belongs to. */
  readonly set: number;
  readonly color: string;
}

/** A star as it appears on the screen in this frame. */
export interface Star {
  readonly x: number;
  readonly y: number;
  readonly color: string;
}

/** The next state of the register: taps at bits 0, 3, 5 and 10 feed bit 15. */
export const nextLfsr = (lfsr: number): number => {
  const bit = (lfsr ^ (lfsr >> 3) ^ (lfsr >> 5) ^ (lfsr >> 10)) & 1;
  return (lfsr >> 1) | (bit << 15);
};

/** The color of the star the register draws in state `lfsr`: 6 inverted bits as BBGGRR. */
const starColor = (lfsr: number): string => {
  const bits = ~(((lfsr >> 5) & 0x07) | ((lfsr << 3) & 0x18) | ((lfsr << 2) & 0x20)) & 0x3f;
  /** The two hex digits of the channel whose bits start at `shift`. */
  const level = (shift: number): string => STAR_LEVELS[(bits >> shift) & 3] ?? '00';
  return `#${level(0)}${level(2)}${level(4)}`;
};

/** Finds the 256 stars by running the register once through its whole period. */
const findStars = (): readonly StarSeed[] => {
  let lfsr = LFSR_SEED;
  const stars = Array.from({ length: LFSR_PERIOD }, (_, step) => {
    const state = lfsr;
    lfsr = nextLfsr(lfsr);
    return (state & HIT_MASK) === HIT_VALUE
      ? { step, set: (((state >> 10) & 1) << 1) | ((state >> 8) & 1), color: starColor(state) }
      : undefined;
  });
  return stars.filter((star) => star !== undefined);
};

const STARS = findStars();

/** Number of stars the chip can generate (exported for tests). */
export const STAR_COUNT = STARS.length;

/** `value` modulo the register period, always positive. */
const wrap = (value: number): number => ((value % LFSR_PERIOD) + LFSR_PERIOD) % LFSR_PERIOD;

/** Register steps run before the first visible pixel of a frame at `speed`. */
const preVisibleSteps = (speed: StarSpeed): number => PRE_VISIBLE + SPEED_EXTRA_STEPS[speed];

/**
 * The register's position (steps since the seed) at the start of the next frame.
 * `phase` is the only state of the starfield.
 */
export const advanceStars = (phase: number, speed: StarSpeed): number =>
  wrap(phase + preVisibleSteps(speed) + VISIBLE_LINES * LINE + POST_VISIBLE);

/**
 * The two sets shown in a frame: the program changes them every 4 frames, from bits 2-4 of its
 * frame counter (`jp_Task_man`), and the hardware always shows one of sets 0-1 and one of 2-3.
 */
export const starSets = (frame: number): readonly [number, number] => {
  const bits = frame & 0x1c;
  const select = ((bits >> 1) ^ bits) & 0x18;
  return [(select >> 3) & 1, ((select >> 4) & 1) | 2];
};

/**
 * The stars of a frame. The chip draws its raster along the monitor's long side, which the
 * cabinet turns upright: a raster line is a screen column, from right to left.
 */
export const visibleStars = (phase: number, speed: StarSpeed, frame: number): readonly Star[] => {
  const start = phase + preVisibleSteps(speed);
  const [setA, setB] = starSets(frame);
  return STARS.flatMap((star) => {
    const pixel = wrap(star.step - start);
    const line = Math.floor(pixel / LINE);
    if (line >= VISIBLE_LINES || (star.set !== setA && star.set !== setB)) return [];
    const x = SCREEN_WIDTH - 1 - line;
    const y = RASTER_OFFSET + (pixel % LINE);
    return y < SCREEN_HEIGHT ? [{ x, y, color: star.color }] : [];
  });
};
