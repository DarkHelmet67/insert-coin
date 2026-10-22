/** A point in space, in screen pixels: x to the right, y down, z out of the screen. */
export interface Point3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

/** One piece of an explosion. Positions and speeds are in screen pixels and pixels per second. */
export interface Particle {
  readonly position: Point3;
  readonly velocity: Point3;
  /** Rotation in radians, so the pieces tumble as they fly. */
  readonly spin: number;
  readonly spinSpeed: number;
  /** Seconds since the particle was born, and seconds it lives in all. */
  readonly age: number;
  readonly life: number;
  readonly color: string;
}

/** A piece of the object that blows up: where it was and its color. */
export interface Fragment {
  readonly x: number;
  readonly y: number;
  readonly color: string;
}

/** How a burst looks: every value is a tuning choice, not a law of physics. */
export interface BurstSettings {
  /** Average speed of the pieces flying away from the center, in pixels per second. */
  readonly speed: number;
  /** Random part of the speed, from 0 (all equal) to 1 (from 0 to twice the average). */
  readonly spread: number;
  /** Average speed out of the screen, toward the player, in pixels per second. */
  readonly towardViewer: number;
  /** Shortest and longest life of a piece, in seconds. */
  readonly minLife: number;
  readonly maxLife: number;
  /** Fastest tumbling, in turns per second. */
  readonly maxSpin: number;
}

/** A source of random numbers between 0 (included) and 1 (excluded), like `Math.random`. */
export type Random = () => number;

/** A random number between `min` and `max`. */
const between = (random: Random, min: number, max: number): number => min + (max - min) * random();

/** The direction from `center` to (`x`, `y`), as a unit vector; random when they coincide. */
const directionFrom = (center: Fragment, x: number, y: number, random: Random): Point3 => {
  const dx = x - center.x;
  const dy = y - center.y;
  const length = Math.hypot(dx, dy);
  if (length === 0) {
    const angle = between(random, 0, 2 * Math.PI);
    return { x: Math.cos(angle), y: Math.sin(angle), z: 0 };
  }
  return { x: dx / length, y: dy / length, z: 0 };
};

/** The middle of a group of fragments. */
export const centerOf = (fragments: readonly Fragment[]): Fragment => {
  const count = Math.max(1, fragments.length);
  const sum = fragments.reduce((total, { x, y }) => ({ x: total.x + x, y: total.y + y }), {
    x: 0,
    y: 0,
  });
  return { x: sum.x / count, y: sum.y / count, color: '' };
};

/**
 * Blows a group of fragments apart: every fragment becomes a particle that flies away from the
 * group's center, toward the player, tumbling.
 * @param fragments - the pieces of the object, for example the voxels of an invader.
 * @param settings - how fast and how long the pieces fly.
 * @param random - random source; pass a fixed sequence in tests.
 */
export const createBurst = (
  fragments: readonly Fragment[],
  settings: BurstSettings,
  random: Random = Math.random,
): readonly Particle[] => {
  const center = centerOf(fragments);
  return fragments.map((fragment) => {
    const direction = directionFrom(center, fragment.x, fragment.y, random);
    const speed = settings.speed * between(random, 1 - settings.spread, 1 + settings.spread);
    return {
      position: { x: fragment.x, y: fragment.y, z: 0 },
      velocity: {
        x: direction.x * speed,
        y: direction.y * speed,
        z: settings.towardViewer * between(random, 0.5, 1.5),
      },
      spin: 0,
      spinSpeed: between(random, -1, 1) * settings.maxSpin * 2 * Math.PI,
      age: 0,
      life: between(random, settings.minLife, settings.maxLife),
      color: fragment.color,
    };
  });
};

/** Moves one particle `dt` seconds forward, pulled down by `gravity` (pixels per second²). */
const stepParticle = (particle: Particle, dt: number, gravity: number): Particle => ({
  ...particle,
  position: {
    x: particle.position.x + particle.velocity.x * dt,
    y: particle.position.y + particle.velocity.y * dt,
    z: particle.position.z + particle.velocity.z * dt,
  },
  velocity: { ...particle.velocity, y: particle.velocity.y + gravity * dt },
  spin: particle.spin + particle.spinSpeed * dt,
  age: particle.age + dt,
});

/**
 * All the particles `dt` seconds later: moved, turned, older; the ones at the end of their life
 * are gone.
 * @param particles - the particles now.
 * @param dt - seconds to move forward.
 * @param gravity - downward pull in pixels per second² (screen y grows downward).
 */
export const stepParticles = (
  particles: readonly Particle[],
  dt: number,
  gravity: number,
): readonly Particle[] =>
  particles
    .map((particle) => stepParticle(particle, dt, gravity))
    .filter((particle) => particle.age < particle.life);

/** How big a particle is drawn, from 1 at birth down to 0 at the end of its life. */
export const particleScale = (particle: Particle): number =>
  Math.max(0, 1 - particle.age / particle.life);

/** Keeps at most `limit` particles, dropping the oldest ones: a cap on the work per frame. */
export const capParticles = (particles: readonly Particle[], limit: number): readonly Particle[] =>
  particles.length <= limit ? particles : particles.slice(particles.length - limit);
