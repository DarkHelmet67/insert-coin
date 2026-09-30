import { movePoint, type Point } from './position';
import { unitsPerFrame, type Ship } from './ship';
import { cosine, sine } from './trig';

/** A shot: a dot that flies straight and fades after about a second. */
export interface Shot {
  readonly position: Point;
  /** Velocity in position units per frame. */
  readonly vx: number;
  readonly vy: number;
  /** Ticks left, counted down every 4 frames: the shot disappears at 0. */
  readonly life: number;
}

/** Shot slots, four for the ship and two for the saucer [P $6CF0]: `null` is a free slot. */
export type ShotSlots = readonly (Shot | null)[];

/** Four free slots. */
export const noShots: ShotSlots = [null, null, null, null];

/** Life of a new shot [P $6CFF]: 18 ticks of 4 frames, about 1.2 seconds. */
export const SHOT_LIFE = 18;

/** The fastest a shot can fly on each axis [P $6D16]: 111 position units per frame. */
export const MAX_SHOT_SPEED = 111;

/** Half a signed value, rounded down, like the 6502's `CMP #$80; ROR` [P $6D0B]. */
export const halfSigned = (value: number): number => Math.floor(value / 2);

/** The shooter's speed on one axis (units per frame) plus half the sine or cosine, within the limit. */
export const shotAxisSpeed = (speed: number, trig: number): number =>
  Math.max(-MAX_SHOT_SPEED, Math.min(MAX_SHOT_SPEED, speed + halfSigned(trig)));

/** Where a shot comes from: the ship or the saucer, with its velocity in units per frame. */
export interface Shooter {
  readonly position: Point;
  readonly vx: number;
  readonly vy: number;
  /** 0-255 for a full turn, like the ship's direction. */
  readonly direction: number;
}

/**
 * A new shot [P $6D04-$6D87]: it starts 3/4 of the half cosine ahead of the shooter's center
 * and flies at the shooter's speed plus the half cosine and sine. The ship and the saucer use
 * the same routine.
 */
export const shotFrom = (shooter: Shooter): Shot => {
  const cx = halfSigned(cosine(shooter.direction));
  const cy = halfSigned(sine(shooter.direction));
  return {
    position: movePoint(shooter.position, cx + halfSigned(cx), cy + halfSigned(cy)),
    vx: shotAxisSpeed(shooter.vx, cosine(shooter.direction)),
    vy: shotAxisSpeed(shooter.vy, sine(shooter.direction)),
    life: SHOT_LIFE,
  };
};

/** A new shot leaving the nose of the ship: only the high byte of its velocity counts. */
export const newShot = (ship: Ship): Shot =>
  shotFrom({
    position: ship.position,
    vx: unitsPerFrame(ship.vx),
    vy: unitsPerFrame(ship.vy),
    direction: ship.direction,
  });

/** Index of the free slot the program uses: it searches from the last one down [P $6CF0]. */
export const freeShotSlot = (shots: ShotSlots): number => shots.lastIndexOf(null);

/** Puts a shot in the last free slot; with every slot taken, nothing happens. */
export const addShot = (shots: ShotSlots, shot: Shot): ShotSlots => {
  const slot = freeShotSlot(shots);
  return slot < 0 ? shots : shots.map((old, index) => (index === slot ? shot : old));
};

/** Fires a shot from the ship if a slot is free; with four shots flying, nothing happens. */
export const fireShot = (shots: ShotSlots, ship: Ship): ShotSlots => addShot(shots, newShot(ship));

/**
 * One frame of a shot: it moves (wrapping around the edges), and every 4 frames it loses a tick
 * of life [P $738D]. A shot that runs out of life frees its slot.
 */
export const updateShot = (shot: Shot | null, frame: number): Shot | null => {
  if (!shot) return null;
  const life = frame % 4 === 0 ? shot.life - 1 : shot.life;
  if (life <= 0) return null;
  return { ...shot, position: movePoint(shot.position, shot.vx, shot.vy), life };
};
