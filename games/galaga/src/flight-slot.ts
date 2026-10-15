import { signed8 } from './z80-math';

/**
 * One of the 12 flight slots of the second processor (`ds_bug_motion_que`, 20 bytes each):
 * the state of an alien flying along its program. Field names follow the meaning of the
 * original bytes, noted next to each one.
 */
export interface FlightSlot {
  /** Height (b00-b01), 9.7 fixed point, growing upwards. */
  readonly y: number;
  /** Horizontal position (b02-b03), 9.7 fixed point. */
  readonly x: number;
  /** Direction (b04-b05): 10 bits, 0 is right, $100 up, $200 left, $300 down. */
  readonly angle: number;
  /** Target of a "go home" or "dive until" command (b06, b07), in units of 2 pixels. */
  readonly targetY: number;
  readonly targetX: number;
  /** Address of the next byte of the flight program (b08-b09). */
  readonly pointer: number;
  /** Speed on odd and on even frames (b0A, b0B), pixels per frame. */
  readonly speedOdd: number;
  readonly speedEven: number;
  /** Rotation per frame (b0C), a signed byte. */
  readonly turn: number;
  /** Frames left in the current instruction (b0D). */
  readonly timer: number;
  /** Frames to the next chance to drop a bomb (b0E), and the bits allowing it (b0F). */
  readonly bombTimer: number;
  readonly bombBits: number;
  /** The object flying (b10). */
  readonly object: number;
  /** Formation offset frozen when heading home (b11, b12), added to the sprite position. */
  readonly offsetX: number;
  readonly offsetY: number;
  /** Flags of b13: watching for the dive target (bit 5), heading home (6), mirrored (7). */
  readonly diveCheck: boolean;
  readonly homing: boolean;
  readonly mirrored: boolean;
}

/** A slot as the program prepares it before the first instruction is read. */
export const newSlot = (fields: Partial<FlightSlot> & Pick<FlightSlot, 'object'>): FlightSlot => ({
  y: 0,
  x: 0,
  angle: 0,
  targetY: 0,
  targetX: 0,
  pointer: 0,
  speedOdd: 0,
  speedEven: 0,
  turn: 0,
  timer: 1,
  bombTimer: 0,
  bombBits: 0,
  offsetX: 0,
  offsetY: 0,
  diveCheck: false,
  homing: false,
  mirrored: false,
  ...fields,
});

/** The high byte of a 9.7 coordinate: the position in units of 2 pixels. */
export const coarse = (value: number): number => (value >> 8) & 0xff;

/** How the sprite of a flying alien looks for a given direction. */
export interface Pose {
  /** Which of the 8 drawings of the alien: 0-5 rotated, 6 upright. */
  readonly tile: number;
  readonly flipX: boolean;
  readonly flipY: boolean;
}

/**
 * `l_0C6D`: the drawing for `angle`. Each quarter turn has 6 drawings 15 degrees apart (42
 * angle steps each), plus the upright one within 7.5 degrees of vertical; the other three
 * quarters mirror the first.
 */
export const poseFor = (angle: number): Pose => {
  const quadrant = (angle >> 8) & 3;
  const low = (quadrant & 1) === 1 ? ~angle & 0xff : angle & 0xff;
  // Dividing by 42 is done as (a/2 + a/4) / 32: no division on a Z80 if it can be avoided.
  const tile = low + 21 > 0xff ? 6 : (((low >> 1) + (low >> 2)) >> 5) & 7;
  return {
    tile,
    flipX: ((quadrant ^ (quadrant >> 1)) & 1) === 0,
    flipY: (quadrant & 2) !== 0,
  };
};

/** The secondary axis moves in these directions in the 8 octants: an octagonal sine. */
const SECONDARY_SIGN = [1, 1, -1, 1, -1, -1, 1, -1] as const;

/**
 * `l_0C46`-`l_0CFA`: one step of movement at `speed` pixels in direction `angle`. The axis
 * closer to the direction moves by the whole speed, the other by a fraction of it that grows
 * with the angle inside the octant: sine and cosine on an octagon, with one 8 × 8 bit
 * multiplication.
 */
export const stepPosition = (
  position: Pick<FlightSlot, 'x' | 'y'>,
  angle: number,
  speed: number,
): Pick<FlightSlot, 'x' | 'y'> => {
  if (speed === 0) return position;
  const octant = (angle >> 7) & 7;
  const yIsPrimary = ((octant ^ (octant >> 1)) & 1) === 1;
  const primary = (octant >= 3 && octant <= 6 ? -speed : speed) * 128;
  const fraction = (angle & 0x80) !== 0 ? (angle & 0x7f) ^ 0x7f : angle & 0x7f;
  const secondary = (SECONDARY_SIGN[octant] ?? 1) * speed * fraction;
  const dx = yIsPrimary ? secondary : primary;
  const dy = yIsPrimary ? primary : secondary;
  return { x: (position.x + dx) & 0xffff, y: (position.y + dy) & 0xffff };
};

/** The sprite position of a slot (`l_0D03`): flight y grows upwards, sprite y downwards. */
export const spritePosition = (slot: FlightSlot): { readonly x: number; readonly y: number } => {
  const x = (slot.x >> 7) & 0xff;
  const y = (0x161 - ((slot.y >> 7) & 0x1ff)) & 0x1ff;
  return slot.homing
    ? { x: (x + slot.offsetX) & 0xff, y: (y + signed8(slot.offsetY)) & 0x1ff }
    : { x, y };
};
