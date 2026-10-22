import type { Particle } from '@arcade/particles';
import { describe, expect, it } from 'vitest';
import { addBursts, stepExplosions } from './explosions';
import { drawHud, type HudContext } from './hud';
import { particleInstance, voxelInstance } from './instances';
import { paintSky, skyProperties } from './sky';
import { tuning } from './tuning.config';
import { toWorld } from './world';

describe('toWorld', () => {
  it('puts the middle of the screen at the origin, y upward', () => {
    expect(toWorld(112, 128)).toEqual({ x: 0.5, y: -0.5, z: 0 });
    expect(toWorld(0, 0).y).toBeGreaterThan(toWorld(0, 255).y);
  });
});

describe('voxelInstance and particleInstance', () => {
  it('places a still voxel at full size on the screen plane', () => {
    expect(voxelInstance({ x: 112, y: 128, color: '#0f0' })).toEqual({
      x: 0.5,
      y: -0.5,
      z: 0,
      scale: 1,
      spin: 0,
      color: '#0f0',
    });
  });

  it('shrinks a particle as it ages', () => {
    const particle: Particle = {
      position: { x: 112, y: 128, z: 5 },
      velocity: { x: 0, y: 0, z: 0 },
      spin: 1,
      spinSpeed: 0,
      age: 0.5,
      life: 1,
      color: '#f00',
    };
    expect(particleInstance(particle)).toMatchObject({ z: 5, scale: 0.5, spin: 1 });
  });
});

describe('addBursts and stepExplosions', () => {
  const fragments = [
    { x: 0, y: 0, color: '#fff' },
    { x: 2, y: 0, color: '#fff' },
  ];

  it('adds one flying piece per fragment', () => {
    const particles = addBursts([], { objects: [fragments], debris: fragments }, () => 0.5);
    expect(particles).toHaveLength(4);
  });

  it('lets the pieces fall and disappear', () => {
    const particles = addBursts([], { objects: [fragments], debris: [] }, () => 0.5);
    expect(stepExplosions(particles, tuning.explosions.burst.maxLife)).toEqual([]);
  });
});

describe('drawHud', () => {
  it('clears the canvas and draws the score bars as the original drew them', () => {
    const calls: string[] = [];
    const ctx: HudContext = {
      fillStyle: '',
      canvas: { width: 224, height: 256 },
      clearRect: () => calls.push('clear'),
      fillRect: (x, y) => calls.push(`fill ${String(x)},${String(y)} ${String(ctx.fillStyle)}`),
    };
    drawHud(ctx, [{ x: 8, y: 8, width: 1, height: 1, color: '#fff' }]);
    expect(calls).toEqual(['clear', 'fill 8,8 #fff']);
  });
});

describe('paintSky', () => {
  it('hands the three sky colors to the style sheet', () => {
    const set: string[] = [];
    paintSky(
      {
        style: { setProperty: (name: string, value: string) => set.push(`${name}=${value}`) },
      } as never,
      tuning.sky,
    );
    expect(set).toEqual(skyProperties(tuning.sky).map(([name, value]) => `${name}=${value}`));
  });
});
