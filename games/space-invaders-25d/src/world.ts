import { SCREEN_HEIGHT, SCREEN_WIDTH } from '@arcade/space-invaders/src/playfield';
import type { Vector3 } from '@arcade/scene3d';

/**
 * Where a pixel of the original screen lies in the 3D world: the screen's center is the origin,
 * x grows to the right, y grows upward (on the screen it grows downward), z toward the player.
 * One pixel is one unit, so the voxels are unit cubes centered on their pixel.
 * @param x - column on the original screen.
 * @param y - row on the original screen.
 * @param z - distance in front of the screen.
 */
export const toWorld = (x: number, y: number, z = 0): Vector3 => ({
  x: x - SCREEN_WIDTH / 2 + 0.5,
  y: SCREEN_HEIGHT / 2 - y - 0.5,
  z,
});
