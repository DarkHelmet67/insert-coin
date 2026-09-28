import { alienWidth, createFormation, type Alien } from './aliens';

/**
 * The marching formation.
 *
 * The original hardware was too slow to redraw 55 invaders every frame, so it moved **one
 * invader per frame**. A full "pass" over the formation takes as many frames as there are
 * invaders alive: with 55 invaders the formation steps less than once per second, with one
 * invader left it steps every frame. The famous acceleration is a side effect of this.
 */
export interface FleetState {
  /** Invaders alive, in marching order (bottom row first, left to right). */
  readonly aliens: readonly Alien[];
  /** Index of the invader that moves in the next frame. */
  readonly cursor: number;
  /** 1 when marching right, -1 when marching left. */
  readonly direction: 1 | -1;
  /** Whether the current pass moves the invaders down instead of sideways. */
  readonly dropping: boolean;
  /** Number of the fleet sound note to play next, and frames before a note may play again. */
  readonly beat: number;
  readonly beatCooldown: number;
}

/** Pixels moved sideways at each step. */
export const STEP_X = 2;

/** The very last invader moves 3 pixels to the right and 2 to the left, a quirk of the original. */
export const LAST_ALIEN_STEP_RIGHT = 3;

/** Pixels moved down when the formation reaches a side of the screen. */
export const STEP_DOWN = 8;

/** The formation turns around when an invader reaches these horizontal limits. */
export const FLEET_LEFT_LIMIT = 8;
export const FLEET_RIGHT_LIMIT = 216;

/** Minimum frames between two notes of the fleet sound, so the beat stays audible at top speed. */
export const MIN_BEAT_FRAMES = 5;

/** The formation at the start of `round`, marching right. */
export const createFleet = (round = 1): FleetState => ({
  aliens: createFormation(round),
  cursor: 0,
  direction: 1,
  dropping: false,
  beat: 0,
  beatCooldown: 0,
});

/** Horizontal step of the moving invader, including the last-invader quirk. */
const stepX = (fleet: FleetState): number => {
  if (fleet.direction < 0) return -STEP_X;
  return fleet.aliens.length === 1 ? LAST_ALIEN_STEP_RIGHT : STEP_X;
};

/** The invader after its step: sideways or down, switching animation frame. */
const moveAlien = (fleet: FleetState, alien: Alien): Alien => ({
  ...alien,
  x: fleet.dropping ? alien.x : alien.x + stepX(fleet),
  y: fleet.dropping ? alien.y + STEP_DOWN : alien.y,
  frame: alien.frame === 0 ? 1 : 0,
});

/** Whether any invader has reached the side of the screen it is marching towards. */
export const touchesEdge = (aliens: readonly Alien[], direction: 1 | -1): boolean =>
  aliens.some((alien) =>
    direction > 0 ? alien.x + alienWidth(alien) >= FLEET_RIGHT_LIMIT : alien.x <= FLEET_LEFT_LIMIT,
  );

/**
 * Starts a new pass once every invader has moved: after a drop the formation marches sideways
 * again; after a sideways pass that reached the edge it drops and turns around.
 */
const startNextPass = (fleet: FleetState): FleetState => {
  const beat = fleet.beatCooldown === 0;
  const passState = {
    ...fleet,
    cursor: 0,
    beat: beat ? fleet.beat + 1 : fleet.beat,
    beatCooldown: beat ? MIN_BEAT_FRAMES : fleet.beatCooldown,
  };
  if (fleet.dropping) return { ...passState, dropping: false };
  return touchesEdge(fleet.aliens, fleet.direction)
    ? { ...passState, dropping: true, direction: fleet.direction > 0 ? -1 : 1 }
    : passState;
};

/** Advances the formation by one frame: moves exactly one invader. */
export const stepFleet = (fleet: FleetState): FleetState => {
  const alien = fleet.aliens[fleet.cursor];
  const cooled = { ...fleet, beatCooldown: Math.max(0, fleet.beatCooldown - 1) };
  if (!alien) return cooled;
  const moved = {
    ...cooled,
    aliens: fleet.aliens.map((other, index) =>
      index === fleet.cursor ? moveAlien(fleet, other) : other,
    ),
    cursor: fleet.cursor + 1,
  };
  return moved.cursor >= moved.aliens.length ? startNextPass(moved) : moved;
};

/** Removes a destroyed invader, keeping the cursor on the invader that was due to move next. */
export const removeAlien = (fleet: FleetState, alien: Alien): FleetState => {
  const index = fleet.aliens.indexOf(alien);
  if (index < 0) return fleet;
  const aliens = fleet.aliens.filter((_, i) => i !== index);
  const cursor = index < fleet.cursor ? fleet.cursor - 1 : fleet.cursor;
  const next = { ...fleet, aliens, cursor };
  // If the destroyed invader was the last one due to move in this pass, the pass is over.
  return cursor >= aliens.length && aliens.length > 0 ? startNextPass(next) : next;
};

/** The lowest edge reached by the formation, in screen pixels. */
export const fleetBottom = (fleet: FleetState): number =>
  Math.max(...fleet.aliens.map((alien) => alien.y + 8));
