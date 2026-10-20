import { describe, expect, it } from 'vitest';
import {
  capParticles,
  centerOf,
  createBurst,
  particleScale,
  stepParticles,
  type BurstSettings,
} from './index';

const settings: BurstSettings = {
  speed: 100,
  spread: 0,
  towardViewer: 50,
  minLife: 1,
  maxLife: 1,
  maxSpin: 1,
};

/** Always the middle value: makes the random parts of a burst predictable. */
const half = (): number => 0.5;

describe('centerOf', () => {
  it('finds the middle of the fragments', () => {
    expect(
      centerOf([
        { x: 0, y: 0, color: '' },
        { x: 4, y: 2, color: '' },
      ]),
    ).toMatchObject({ x: 2, y: 1 });
  });
});

describe('createBurst', () => {
  const fragments = [
    { x: 0, y: 0, color: '#f00' },
    { x: 10, y: 0, color: '#0f0' },
  ];

  it('turns every fragment into a particle of the same color, at the same place', () => {
    const burst = createBurst(fragments, settings, half);
    expect(burst.map((particle) => particle.color)).toEqual(['#f00', '#0f0']);
    expect(burst[1]?.position).toEqual({ x: 10, y: 0, z: 0 });
  });

  it('sends the pieces away from the center and toward the player', () => {
    const [left, right] = createBurst(fragments, settings, half);
    expect(left?.velocity.x).toBeCloseTo(-100);
    expect(right?.velocity.x).toBeCloseTo(100);
    expect(right?.velocity.z).toBeCloseTo(50);
  });
});

describe('stepParticles', () => {
  const [particle] = createBurst(
    [
      { x: 0, y: 0, color: '' },
      { x: 2, y: 0, color: '' },
    ],
    settings,
    half,
  );

  it('moves the particles and pulls them down', () => {
    const [moved] = stepParticles(particle ? [particle] : [], 0.5, 10);
    expect(moved?.position.x).toBeCloseTo(-50);
    expect(moved?.velocity.y).toBeCloseTo(5);
    expect(moved?.age).toBe(0.5);
  });

  it('removes the particles at the end of their life', () => {
    expect(stepParticles(particle ? [particle] : [], 1, 0)).toEqual([]);
  });
});

describe('particleScale', () => {
  it('shrinks from 1 to 0 over the life of the particle', () => {
    const [particle] = createBurst([{ x: 0, y: 0, color: '' }], settings, half);
    expect(particle && particleScale(particle)).toBe(1);
    const [older] = stepParticles(particle ? [particle] : [], 0.75, 0);
    expect(older && particleScale(older)).toBeCloseTo(0.25);
  });
});

describe('capParticles', () => {
  it('keeps the newest particles when there are too many', () => {
    const burst = createBurst(
      [1, 2, 3].map((x) => ({ x, y: 0, color: String(x) })),
      settings,
      half,
    );
    expect(capParticles(burst, 2).map((particle) => particle.color)).toEqual(['2', '3']);
  });
});
