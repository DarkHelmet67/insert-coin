import { describe, expect, it } from 'vitest';
import { cameraPosition, cameraTarget, playfieldAngles, viewLean } from './camera';
import { attractGame, LEFTMOST, playingGame, RIGHTMOST } from './test-fixtures';
import { tuning } from './tuning.config';

const { camera, playfield, voxel } = tuning;

describe('viewLean', () => {
  it('leans all the way to the side where the cannon is', () => {
    expect(viewLean(playingGame({ cannon: { x: LEFTMOST } }), 0, camera, 1)).toBe(-1);
    expect(viewLean(playingGame({ cannon: { x: RIGHTMOST } }), 0, camera, 1)).toBe(1);
  });

  it('stays straight with the cannon in the middle', () => {
    const middle = (LEFTMOST + RIGHTMOST) / 2;
    expect(viewLean(playingGame({ cannon: { x: middle } }), 0, camera, 1)).toBeCloseTo(0);
  });

  it('leans less when reduced motion is asked', () => {
    expect(viewLean(playingGame({ cannon: { x: RIGHTMOST } }), 0, camera, 0.25)).toBe(0.25);
  });

  it('sways by itself on the attract screen', () => {
    const quarter = camera.attractSwayPeriod / 4;
    expect(viewLean(attractGame, quarter, camera, 1)).toBeCloseTo(camera.attractSway);
  });
});

describe('playfieldAngles', () => {
  const settings = { tilt: 30, maxRoll: 6, maxTurn: 10 };

  it('keeps the playfield straight with no lean', () => {
    expect(playfieldAngles(0, settings)).toEqual({ tilt: 30, turn: -0, roll: -0 });
  });

  it('reaches each maximum on its own axis at full lean', () => {
    expect(playfieldAngles(1, settings)).toEqual({ tilt: 30, turn: -10, roll: -6 });
    expect(playfieldAngles(-1, settings)).toEqual({ tilt: 30, turn: 10, roll: 6 });
  });
});

describe('cameraPosition', () => {
  it('stands in front of the playfield, a little above it', () => {
    const position = cameraPosition(1.5, camera, playfield, voxel.depth);
    expect(position.x).toBeCloseTo(0);
    expect(position.y).toBeGreaterThan(0);
  });

  it('backs off on a narrow phone screen to keep the whole playfield in view', () => {
    expect(cameraPosition(0.5, camera, playfield, voxel.depth).z).toBeGreaterThan(
      cameraPosition(1.6, camera, playfield, voxel.depth).z,
    );
  });

  it('backs off further when the playfield turns, so its near edge is not cut', () => {
    const still = { ...playfield, maxTurn: 0 };
    expect(cameraPosition(1, camera, playfield, voxel.depth).z).toBeGreaterThan(
      cameraPosition(1, camera, still, voxel.depth).z,
    );
  });
});

describe('cameraTarget', () => {
  it('looks a little below the middle of the playfield', () => {
    expect(cameraTarget(camera).y).toBe(-camera.lookDown);
  });
});
