import { particleScale, type Particle } from '@arcade/particles';
import type { VoxelInstance } from '@arcade/scene3d';
import type { Voxel } from '@arcade/voxel';
import { toWorld } from './world';

/** A still voxel of the playfield, standing on the screen plane. */
export const voxelInstance = (voxel: Voxel): VoxelInstance => ({
  ...toWorld(voxel.x, voxel.y),
  scale: 1,
  spin: 0,
  color: voxel.color,
});

/**
 * A flying piece of an explosion. Particles move in screen pixels with y downward, like the
 * game; here they join the 3D world, and shrink as they age.
 */
export const particleInstance = (particle: Particle): VoxelInstance => ({
  ...toWorld(particle.position.x, particle.position.y, particle.position.z),
  scale: particleScale(particle),
  spin: particle.spin,
  color: particle.color,
});
