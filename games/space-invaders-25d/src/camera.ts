import {
  degreesToRadians,
  fitPointsDistance,
  mapRange,
  orbitPosition,
  orientPoint,
  standBack,
  type Vector3,
} from '@arcade/scene3d';
import { CANNON_MAX_X, CANNON_MIN_X } from '@arcade/space-invaders/src/cannon';
import type { GameState } from '@arcade/space-invaders/src/game';
import { SCREEN_HEIGHT, SCREEN_WIDTH } from '@arcade/space-invaders/src/playfield';

/** The camera settings of `tuning.config.ts`. */
export interface CameraSettings {
  readonly fov: number;
  readonly pitch: number;
  readonly margin: number;
  readonly lookDown: number;
  readonly attractSway: number;
  readonly attractSwayPeriod: number;
}

/** How the playfield leans and turns, from the `playfield` section of `tuning.config.ts`. */
export interface PlayfieldSettings {
  /** Lean backward, around the horizontal axis (X), in degrees. */
  readonly tilt: number;
  /** Furthest turn like clock hands, around the axis that comes out of the playfield (Z). */
  readonly maxRoll: number;
  /** Furthest turn like the page of a book, around the axis from the cannon to the invaders (Y). */
  readonly maxTurn: number;
}

/** The angles of the playfield, in degrees, around the three axes. */
export interface PlayfieldAngles {
  readonly tilt: number;
  readonly turn: number;
  readonly roll: number;
}

/**
 * How far the view leans toward one side, from -1 (all the way left) to 1 (all the way right):
 * during play it follows the cannon; on the attract screen it sways slowly by itself.
 * @param state - the game now.
 * @param time - seconds since the page loaded, for the sway.
 * @param settings - the camera section of the tuning file.
 * @param motion - share of the movement to keep: 1 normally, less for reduced motion.
 */
export const viewLean = (
  state: GameState,
  time: number,
  settings: CameraSettings,
  motion: number,
): number =>
  motion *
  (state.screen === 'attract'
    ? settings.attractSway * Math.sin((2 * Math.PI * time) / settings.attractSwayPeriod)
    : mapRange(state.playing.cannon.x, CANNON_MIN_X, CANNON_MAX_X, -1, 1));

/**
 * The angles of the playfield for a given lean. The two turns are separate on purpose, each
 * with its own maximum: the roll (around Z) gives the feeling of movement but in excess
 * makes people seasick; the turn (around Y) shows the sides of invaders and shields.
 * With the cannon on the left the playfield turns its left edge toward the player.
 * @param lean - from `viewLean`, after smoothing.
 * @param settings - the playfield section of the tuning file.
 */
export const playfieldAngles = (lean: number, settings: PlayfieldSettings): PlayfieldAngles => ({
  tilt: settings.tilt,
  turn: -lean * settings.maxTurn,
  roll: -lean * settings.maxRoll,
});

/**
 * The point the camera looks at: a little below the middle of the playfield, because the
 * tilted playfield comes closer to the camera at the bottom and looks bigger there.
 */
export const cameraTarget = (settings: CameraSettings): Vector3 => ({
  x: 0,
  y: -settings.lookDown,
  z: 0,
});

/**
 * The corners of the box the voxels fill: the whole screen, `thickness` deep.
 * @param thickness - how deep the voxels are.
 */
const playfieldCorners = (thickness: number): readonly Vector3[] =>
  [-1, 1].flatMap((side) =>
    [-1, 1].flatMap((end) =>
      [-1, 1].map((face) => ({
        x: (side * SCREEN_WIDTH) / 2,
        y: (end * SCREEN_HEIGHT) / 2,
        z: (face * thickness) / 2,
      })),
    ),
  );

/**
 * The corners of the playfield in the world, at both ends of the cannon's run and in the
 * middle: the camera must see all of them, wherever the cannon is.
 * @param playfield - the playfield section of the tuning file.
 * @param thickness - how deep the voxels are.
 */
const cornersInView = (playfield: PlayfieldSettings, thickness: number): readonly Vector3[] =>
  [-1, 0, 1].flatMap((lean) => {
    const angles = playfieldAngles(lean, playfield);
    const orientation = {
      tilt: degreesToRadians(angles.tilt),
      turn: degreesToRadians(angles.turn),
      roll: degreesToRadians(angles.roll),
    };
    return playfieldCorners(thickness).map((corner) => orientPoint(corner, orientation));
  });

/**
 * Where the camera stands: in front of the playfield and a little above it, far enough to see
 * all of it however it turns. The distance does not follow the cannon, so the view does not
 * zoom in and out while playing.
 * @param aspect - width divided by height of the picture.
 * @param settings - the camera section of the tuning file.
 * @param playfield - the playfield section of the tuning file.
 * @param thickness - how deep the voxels are.
 */
export const cameraPosition = (
  aspect: number,
  settings: CameraSettings,
  playfield: PlayfieldSettings,
  thickness: number,
): Vector3 => {
  const target = cameraTarget(settings);
  const direction = orbitPosition(0, degreesToRadians(settings.pitch), 1);
  const distance = fitPointsDistance(
    cornersInView(playfield, thickness),
    target,
    direction,
    settings.fov,
    aspect,
    settings.margin,
  );
  return standBack(target, direction, distance);
};
