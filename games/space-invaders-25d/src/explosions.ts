import {
  capParticles,
  createBurst,
  stepParticles,
  type Particle,
  type Random,
} from '@arcade/particles';
import type { Bursts } from './bursts';
import { tuning } from './tuning.config';

const { burst, debris, gravity, maxParticles } = tuning.explosions;

/** Adds the pieces of what just blew up to the ones already flying. */
export const addBursts = (
  particles: readonly Particle[],
  bursts: Bursts,
  random: Random = Math.random,
): readonly Particle[] =>
  capParticles(
    [
      ...particles,
      ...bursts.objects.flatMap((fragments) => createBurst(fragments, burst, random)),
      ...createBurst(bursts.debris, debris, random),
    ],
    maxParticles,
  );

/** The flying pieces `dt` seconds later. */
export const stepExplosions = (particles: readonly Particle[], dt: number): readonly Particle[] =>
  stepParticles(particles, dt, gravity);
