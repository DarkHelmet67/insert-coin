import {
  degreesToRadians,
  fitDistance,
  mapRange,
  orbitPosition,
  type Vector3,
} from '@arcade/scene3d';
import { CANNON_MAX_X, CANNON_MIN_X } from '@arcade/space-invaders/src/cannon';
import type { GameState } from '@arcade/space-invaders/src/game';
import { SCREEN_HEIGHT, SCREEN_WIDTH } from '@arcade/space-invaders/src/playfield';

/** The camera settings of `tuning.config.ts`. */
export interface CameraSettings {
  readonly fov: number;
  readonly maxYaw: number;
  readonly pitch: number;
  readonly margin: number;
  readonly lookDown: number;
  readonly attractSway: number;
  readonly attractSwayPeriod: number;
}

/**
 * The angle, in degrees, the camera wants to reach: during play it follows the cannon, so
 * moving left turns the view to the left and the side faces of invaders and shields appear;
 * on the attract screen it sways slowly by itself.
 * @param state - the game now.
 * @param time - seconds since the page loaded, for the sway.
 * @param settings - the camera section of the tuning file.
 * @param motion - share of the movement to keep: 1 normally, less for reduced motion.
 */
export const targetYaw = (
  state: GameState,
  time: number,
  settings: CameraSettings,
  motion: number,
): number => {
  if (state.screen === 'attract') {
    return (
      motion * settings.attractSway * Math.sin((2 * Math.PI * time) / settings.attractSwayPeriod)
    );
  }
  return (
    motion *
    mapRange(state.playing.cannon.x, CANNON_MIN_X, CANNON_MAX_X, -settings.maxYaw, settings.maxYaw)
  );
};

/**
 * Where the camera stands for a given angle, far enough to see the whole playfield: the tilted
 * playfield looks shorter than it is, by the cosine of its tilt.
 * @param yaw - the camera angle in degrees, from `targetYaw` after smoothing.
 * @param tilt - how far the playfield leans back, in degrees.
 * @param aspect - width divided by height of the picture.
 */
export const cameraPosition = (
  yaw: number,
  tilt: number,
  aspect: number,
  settings: CameraSettings,
): Vector3 => {
  const apparentHeight = SCREEN_HEIGHT * Math.cos(degreesToRadians(tilt));
  const distance = fitDistance(SCREEN_WIDTH, apparentHeight, settings.fov, aspect, settings.margin);
  return orbitPosition(degreesToRadians(yaw), degreesToRadians(settings.pitch), distance);
};

/**
 * The point the camera looks at: a little below the middle of the playfield, because the
 * tilted playfield comes closer to the camera at the bottom and looks bigger there.
 */
export const cameraTarget = (settings: CameraSettings): Vector3 => ({
  x: 0,
  y: -settings.lookDown,
  z: 0,
});
